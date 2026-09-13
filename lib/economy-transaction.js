import { AsyncLocalStorage } from 'async_hooks';
import { createHash } from 'crypto';
import { readFile, readdir, unlink, writeFile, rename } from 'fs/promises';
import { join } from 'path';

import { withFileLock } from './file-lock.js';

const USERS_DIRECTORY = 'storage/json/users';
const BANK_PATH = join(USERS_DIRECTORY, 'bank.json');
const JOURNAL_PATH = join(USERS_DIRECTORY, 'economy-transaction.json');
const STORAGE_LOCK_PATH = join(USERS_DIRECTORY, '.storage-write');
const MAXBALANCE = Number.MAX_SAFE_INTEGER / 100;

const economyStorage = new AsyncLocalStorage();
const writeStorage = new AsyncLocalStorage();

const userPath = id => join(USERS_DIRECTORY, `${id}.json`);
const serialize = data => JSON.stringify(data, null, 2);
const hash = data => createHash('sha256').update(data ?? '').digest('hex');

const readText = async path => {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
};

const writeText = async (path, data) => {
  const tempPath = `${path}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tempPath, data, 'utf8');
  await rename(tempPath, path);
};

const writeJson = async (path, data) => writeText(path, serialize(data));

const recoverPending = async () => {
  const journalText = await readText(JOURNAL_PATH);
  if (journalText === null) return;

  let journal;
  try {
    journal = JSON.parse(journalText);
  } catch (error) {
    throw new Error(`Повреждён journal экономики: ${error.message}`);
  }

  if (journal.version !== 2 || !Array.isArray(journal.files) || journal.files.length === 0) {
    throw new Error('Некорректная структура journal экономики');
  }

  for (const entry of journal.files) {
    if (typeof entry?.path !== 'string' || typeof entry.beforeHash !== 'string' ||
        typeof entry.afterHash !== 'string' || typeof entry.data !== 'string') {
      throw new Error('Некорректная запись в journal экономики');
    }

    const current = await readText(entry.path);
    const currentHash = hash(current);

    if (currentHash === entry.afterHash) continue;
    if (currentHash !== entry.beforeHash) {
      throw new Error(`Конфликт восстановления ${entry.path}: файл изменён вне транзакции`);
    }

    await writeText(entry.path, entry.data);
  }

  await unlink(JOURNAL_PATH);
};

const withStorageWriteLock = async callback => {
  if (writeStorage.getStore()) return callback();

  return withFileLock(STORAGE_LOCK_PATH, async () => {
    await recoverPending();
    return writeStorage.run(true, callback);
  });
};

const ensureBankFileUnlocked = async () => {
  const current = await readText(BANK_PATH);
  if (current !== null) {
    const bank = JSON.parse(current);
    if (typeof bank.balance !== 'number' || !Number.isFinite(bank.balance)) {
      throw new Error('Некорректный bank.json');
    }
    return;
  }

  const files = await readdir(USERS_DIRECTORY);
  let allMoney = 0;

  for (const file of files.filter(file => /^\d+\.json$/.test(file))) {
    const data = JSON.parse(await readFile(join(USERS_DIRECTORY, file), 'utf8'));
    if (typeof data.money !== 'number' || !Number.isFinite(data.money)) {
      throw new Error(`Некорректное поле money в ${file}`);
    }
    allMoney += data.money;
  }

  await writeJson(BANK_PATH, { balance: MAXBALANCE - allMoney });
};

const getUserIds = ids => [...new Set(ids.filter(id => id !== undefined && id !== null).map(String))].sort();

const withUserLocks = async (ids, callback, index = 0) => {
  if (index >= ids.length) return callback();
  return withFileLock(userPath(ids[index]), () => withUserLocks(ids, callback, index + 1));
};

const commitFiles = async files => {
  const changed = files.filter(file => file.beforeHash !== file.afterHash);
  if (changed.length === 0) return;

  if (changed.length === 1) {
    await writeText(changed[0].path, changed[0].data);
    return;
  }

  await writeJson(JOURNAL_PATH, {
    version: 2,
    createdAt: new Date().toISOString(),
    files: changed
  });

  for (const file of changed) {
    await writeText(file.path, file.data);
  }

  await unlink(JOURNAL_PATH);
};

await withStorageWriteLock(ensureBankFileUnlocked);

export const getActiveEconomyTransaction = () => economyStorage.getStore() ?? null;
export const withStorageLock = withStorageWriteLock;

export const withEconomyTransaction = async (userIds, callback) => {
  const ids = getUserIds(userIds);

  return withStorageWriteLock(async () => {
    await ensureBankFileUnlocked();

    return withUserLocks(ids, async () => {
      const users = {};
      const originalUsers = {};
      for (const id of ids) {
        const data = JSON.parse(await readFile(userPath(id), 'utf8'));
        users[id] = data;
        originalUsers[id] = serialize(data);
      }

      const bankText = await readText(BANK_PATH);
      const bank = JSON.parse(bankText);
      const originalBank = bankText;

      const result = await economyStorage.run({ users, bank }, () => callback({ users, bank }));

      const files = ids.map(id => {
        const data = serialize(users[id]);
        return {
          path: userPath(id),
          beforeHash: hash(originalUsers[id]),
          afterHash: hash(data),
          data
        };
      });

      const bankAfter = serialize(bank);
      files.push({
        path: BANK_PATH,
        beforeHash: hash(originalBank),
        afterHash: hash(bankAfter),
        data: bankAfter
      });

      await commitFiles(files);
      return result;
    });
  });
};

export const withUserTransaction = async (userIds, callback) => {
  const ids = getUserIds(userIds);

  return withStorageWriteLock(async () => withUserLocks(ids, async () => {
    const users = {};
    const originalUsers = {};

    for (const id of ids) {
      const data = JSON.parse(await readFile(userPath(id), 'utf8'));
      users[id] = data;
      originalUsers[id] = serialize(data);
    }

    const result = await callback(users);
    const files = ids.map(id => {
      const data = serialize(users[id]);
      return {
        path: userPath(id),
        beforeHash: hash(originalUsers[id]),
        afterHash: hash(data),
        data
      };
    });

    await commitFiles(files);
    return result;
  }));
};

export const withEconomyContext = async (context, callback) => {
  const ids = [context.account.id, context.reply?.account?.id];

  return withEconomyTransaction(ids, async transaction => {
    context.account = transaction.users[String(context.account.id)];

    if (context.reply?.account?.id !== undefined) {
      context.reply.account = transaction.users[String(context.reply.account.id)];
    }

    return callback(transaction);
  });
};
