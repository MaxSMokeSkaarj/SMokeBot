import { readFile, unlink, writeFile, rename } from 'fs/promises';
import { join } from 'path';

import { withFileLock } from './file-lock.js';

const USERS_DIRECTORY = 'storage/json/users';
const BANK_PATH = join(USERS_DIRECTORY, 'bank.json');
const JOURNAL_PATH = join(USERS_DIRECTORY, 'economy-transaction.json');

const readJson = async path => JSON.parse(await readFile(path, 'utf8'));

const writeJson = async (path, data) => {
  const tempPath = `${path}.tmp`;
  await writeFile(tempPath, JSON.stringify(data, null, 2));
  await rename(tempPath, path);
};

const userPath = id => join(USERS_DIRECTORY, `${id}.json`);

const acquireLocks = async (paths, callback, index = 0) => {
  if (index >= paths.length) return callback();
  return withFileLock(paths[index], () => acquireLocks(paths, callback, index + 1));
};

const getResourcePaths = userIds => [
  ...userIds.map(userPath),
  BANK_PATH,
  JOURNAL_PATH
].sort();

const recoverPending = async () => {
  try {
    const journal = await readJson(JOURNAL_PATH);
    const userIds = journal.users.map(user => user.id);
    const paths = getResourcePaths(userIds);

    await acquireLocks(paths, async () => {
      for (const user of journal.users) {
        await writeJson(userPath(user.id), user.data);
      }
      await writeJson(BANK_PATH, journal.bank);
      await unlink(JOURNAL_PATH).catch(error => {
        if (error.code !== 'ENOENT') throw error;
      });
    });
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Ошибка восстановления экономической транзакции:', error);
    }
  }
};

await withFileLock(JOURNAL_PATH, recoverPending);

/**
 * Выполняет атомарную экономическую операцию над пользователями и банком.
 * Journal записывается до изменения целевых файлов, поэтому после падения процесса
 * операция может быть безопасно повторена при следующем запуске.
 *
 * @param {(transaction: {
 *   users: Record<string, object>,
 *   bank: { balance: number }
 * }) => Promise<any>} callback
 * @param {Array<string|number>} userIds
 * @returns {Promise<any>}
 */
export const withEconomyTransaction = async (userIds, callback) => {
  const ids = [...new Set(userIds.map(String))];
  const paths = getResourcePaths(ids);

  return acquireLocks(paths, async () => {
    const users = {};
    for (const id of ids) {
      users[id] = await readJson(userPath(id));
    }

    const bank = await readJson(BANK_PATH);
    const result = await callback({ users, bank });

    const journal = {
      users: ids.map(id => ({ id, data: users[id] })),
      bank
    };

    await writeJson(JOURNAL_PATH, journal);

    for (const id of ids) {
      await writeJson(userPath(id), users[id]);
    }
    await writeJson(BANK_PATH, bank);

    await unlink(JOURNAL_PATH);
    return result;
  });
};

export const economy = {
  withTransaction: withEconomyTransaction
};
