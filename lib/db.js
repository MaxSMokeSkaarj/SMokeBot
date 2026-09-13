import { randomBytes } from 'crypto';
import { readFile, readdir, unlink, writeFile, rename } from 'fs/promises';
import { join } from 'path';

import { withFileLock } from './file-lock.js';
import { withStorageLock } from './economy-transaction.js';

/**
 * @type {UserTemplate}
 */
const UserTemplate = {};

class Database {
  #directory;

  constructor(directory) {
    this.#directory = directory;
  }

  #getFilePath(id) {
    return join(this.#directory, `${id}.json`);
  }

  async #readUser(id) {
    const filePath = this.#getFilePath(id);

    try {
      const data = await readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw new Error(`Ошибка чтения данных пользователя ${id}: ${error.message}`);
    }
  }

  async #writeUser(id, data) {
    if (!data) throw new Error(`Попытка записи пустых данных для пользователя ${id}`);

    const filePath = this.#getFilePath(id);
    const tempFilePath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
    await writeFile(tempFilePath, JSON.stringify(data, null, 2), 'utf8');
    await rename(tempFilePath, filePath);
  }

  #createUser(id) {
    return {
      id: String(id),
      nick: 'Новичок',
      money: 0,
      workTimeout: null,
      jackpotTimeout: null,
      taxTimeout: null,
      cars: [],
      houses: [],
      phones: [],
      pets: [],
      buisnesses: [],
      credit: [],
      deposit: [],
      isBotAdmin: false,
      isBanned: false,
      banReason: [],
      secret: randomBytes(32).toString('hex')
    };
  }

  async create(id) {
    const userId = String(id);

    return withStorageLock(async () => withFileLock(this.#getFilePath(userId), async () => {
      const existingUser = await this.#readUser(userId);
      if (existingUser) return null;

      const newUser = this.#createUser(userId);
      await this.#writeUser(userId, newUser);
      return newUser;
    }));
  }

  async read(id) {
    return this.#readUser(id);
  }

  async readAll() {
    try {
      const files = await readdir(this.#directory);
      const userFiles = files.filter(file => /^\d+\.json$/.test(file));
      const users = await Promise.all(userFiles.map(file => this.#readUser(file.slice(0, -5))));
      return users.filter(user => user !== null);
    } catch (error) {
      throw new Error(`Ошибка чтения всех пользователей: ${error.message}`);
    }
  }

  async modify(id, mutator) {
    const userId = String(id);

    return withStorageLock(async () => withFileLock(this.#getFilePath(userId), async () => {
      const user = await this.#readUser(userId);
      if (!user) return null;

      await mutator(user);
      await this.#writeUser(userId, user);
      return user;
    }));
  }

  async withLocks(ids, callback) {
    const uniqueIds = [...new Set((Array.isArray(ids) ? ids : [ids]).map(String))].sort();
    const lockedIds = new Set(uniqueIds);

    const assertLocked = id => {
      if (!lockedIds.has(String(id))) {
        throw new Error(`Пользователь ${id} не захвачен текущей транзакцией`);
      }
    };

    const transaction = {
      read: async id => {
        assertLocked(id);
        return this.#readUser(String(id));
      },
      write: async (id, data) => {
        assertLocked(id);
        await this.#writeUser(String(id), data);
      }
    };

    return withStorageLock(async () => {
      const acquire = async index => {
        if (index >= uniqueIds.length) return callback(transaction);
        return withFileLock(this.#getFilePath(uniqueIds[index]), () => acquire(index + 1));
      };
      return acquire(0);
    });
  }

  async update(id, updates) {
    try {
      return await this.modify(id, user => {
        const sanitizedUpdates = { ...updates };
        delete sanitizedUpdates.id;

        if (sanitizedUpdates.money !== undefined &&
            (typeof sanitizedUpdates.money !== 'number' || !Number.isFinite(sanitizedUpdates.money) || sanitizedUpdates.money < 0)) {
          throw new Error('Некорректное значение для money');
        }

        if (sanitizedUpdates.money !== undefined) {
          sanitizedUpdates.money = Number(sanitizedUpdates.money.toFixed(2));
        }

        Object.assign(user, sanitizedUpdates);
      });
    } catch (error) {
      console.error(`Ошибка обновления пользователя ${id}:`, error.message);
      throw error;
    }
  }

  async delete(id) {
    const userId = String(id);

    return withStorageLock(async () => withFileLock(this.#getFilePath(userId), async () => {
      const user = await this.#readUser(userId);
      if (!user) return false;

      await unlink(this.#getFilePath(userId));
      return true;
    }));
  }
}

const users = new Database('storage/json/users');

export { Database, users, UserTemplate };
