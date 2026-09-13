import { randomUUID } from 'crypto';
import { mkdir, readFile, rmdir, stat, unlink, utimes, writeFile } from 'fs/promises';
import { join } from 'path';

const RETRY_DELAY = 50;
const DEFAULT_TIMEOUT = 30_000;
const STALE_LOCK_AGE = 5 * 60_000;
const HEARTBEAT_INTERVAL = 60_000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const processIsAlive = pid => {
  if (!Number.isInteger(pid) || pid <= 0) return false;

  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === 'ESRCH') return false;
    if (error.code === 'EPERM') return true;
    return true;
  }
};

const readOwnerPid = async path => {
  try {
    const owner = await readFile(path, 'utf8');
    const pid = Number.parseInt(owner.split('\n', 1)[0], 10);
    return Number.isInteger(pid) ? pid : null;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
};

/**
 * Serializes access to a resource across multiple Node.js processes.
 * The lock is represented by an atomic directory creation.
 *
 * @param {string} resourcePath
 * @param {() => Promise<any>} callback
 * @param {number} timeout
 * @returns {Promise<any>}
 */
export const withFileLock = async (resourcePath, callback, timeout = DEFAULT_TIMEOUT) => {
  const lockPath = `${resourcePath}.lock`;
  const metadataPath = join(lockPath, 'owner');
  const ownerToken = randomUUID();
  const owner = `${process.pid}\n${ownerToken}\n${new Date().toISOString()}\n`;
  const startedAt = Date.now();

  while (true) {
    try {
      await mkdir(lockPath);
      await writeFile(metadataPath, owner, 'utf8');
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;

      try {
        const lockStat = await stat(lockPath);
        if (Date.now() - lockStat.mtimeMs > STALE_LOCK_AGE) {
          const ownerPid = await readOwnerPid(metadataPath);
          if (ownerPid === null || !processIsAlive(ownerPid)) {
            await unlink(metadataPath).catch(() => {});
            await rmdir(lockPath).catch(() => {});
            continue;
          }
        }
      } catch (statError) {
        if (statError.code !== 'ENOENT') throw statError;
      }

      if (Date.now() - startedAt >= timeout) {
        throw new Error(`Не удалось получить блокировку ${resourcePath}`);
      }

      await sleep(RETRY_DELAY);
    }
  }

  const heartbeat = setInterval(() => {
    void utimes(lockPath, new Date(), new Date()).catch(() => {});
  }, HEARTBEAT_INTERVAL);
  heartbeat.unref?.();

  try {
    return await callback();
  } finally {
    clearInterval(heartbeat);

    try {
      const currentOwner = await readFile(metadataPath, 'utf8');
      if (currentOwner === owner) {
        await unlink(metadataPath).catch(() => {});
        await rmdir(lockPath).catch(() => {});
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
};
