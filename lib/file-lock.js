import { mkdir, rmdir, stat, unlink, utimes, writeFile } from 'fs/promises';
import { join } from 'path';

const RETRY_DELAY = 50;
const DEFAULT_TIMEOUT = 30_000;
const STALE_LOCK_AGE = 5 * 60_000;
const HEARTBEAT_INTERVAL = 60_000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
  const startedAt = Date.now();

  while (true) {
    try {
      await mkdir(lockPath);
      await writeFile(metadataPath, `${process.pid}\n${new Date().toISOString()}\n`);
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;

      try {
        const lockStat = await stat(lockPath);
        if (Date.now() - lockStat.mtimeMs > STALE_LOCK_AGE) {
          await unlink(metadataPath).catch(() => {});
          await rmdir(lockPath).catch(() => {});
          continue;
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
    await unlink(metadataPath).catch(() => {});
    await rmdir(lockPath).catch(() => {});
  }
};
