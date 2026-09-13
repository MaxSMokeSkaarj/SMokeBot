import { AsyncLocalStorage } from 'async_hooks';
import { readFile, unlink, writeFile, rename } from 'fs/promises';
import { join } from 'path';

import { withFileLock } from './file-lock.js';

const USERS_DIRECTORY = 'storage/json/users';
const BANK_PATH = join(USERS_DIRECTORY, 'bank.json');
const JOURNAL_PATH = join(USERS_DIRECTORY, 'economy-transaction.json');
const storage = new AsyncLocalStorage();

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
    const paths = getResourcePaths(userIds).filter(path => path !== JOURNAL_PATH);

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

export const getActiveEconomyTransaction = () => storage.getStore() ?? null;

export const withEconomyTransaction = async (userIds, callback) => {
  const ids = [...new Set(userIds.map(String))];
  const paths = getResourcePaths(ids);

  return acquireLocks(paths, async () => {
    const users = {};
    const originalUsers = {};

    for (const id of ids) {
      users[id] = await readJson(userPath(id));
      originalUsers[id] = JSON.stringify(users[id]);
    }

    const bank = await readJson(BANK_PATH);
    const originalBalance = bank.balance;

    const result = await storage.run({ users, bank }, () => callback({ users, bank }));

    const usersChanged = ids.some(id => JSON.stringify(users[id]) !== originalUsers[id]);
    const bankChanged = bank.balance !== originalBalance;

    if (!usersChanged && !bankChanged) return result;

    const journal = {
      users: ids.map(id => ({ id, data: users[id] })),
      bank
    };

    if (bankChanged) {
      await writeJson(JOURNAL_PATH, journal);
    }

    for (const id of ids) {
      if (JSON.stringify(users[id]) !== originalUsers[id]) {
        await writeJson(userPath(id), users[id]);
      }
    }

    if (bankChanged) {
      await writeJson(BANK_PATH, bank);
      await unlink(JOURNAL_PATH);
    }

    return result;
  });
};

export const withEconomyContext = async (context, callback) => {
  const ids = [
    context.account.id,
    context.reply?.account?.id
  ].filter(id => id !== undefined && id !== null);

  return withEconomyTransaction(ids, async transaction => {
    context.account = transaction.users[String(context.account.id)];

    if (context.reply?.account?.id !== undefined) {
      context.reply.account = transaction.users[String(context.reply.account.id)];
    }

    return callback(transaction);
  });
};
