import { readFile, writeFile, readdir, unlink, rename } from 'fs/promises';
import { join } from 'path';

import { withFileLock } from './file-lock.js';

/**
 * @type {UserTemplate}
 */
const UserTemplate = {};

/**
 * Класс для работы с JSON DB.
 */
class Database {
  #directory;
  #writeQueue = [];
  #isWriting = false;

  /**
   * Создает экземпляр базы данных, указывая директорию для хранения JSON файлов пользователей.
   * @constructor
   * @param {string} directory - Путь к директории, где будут храниться JSON файлы пользователей.
   */
  constructor(directory) {
    this.#directory = directory;
  }

  /**
   * Возвращает путь к файлу пользователя с данным ID.
   * @param {string|number} id
   * @returns {string} Путь к файлу пользователя с данным ID.
   * @private
   */
  #getFilePath(id) {
    return join(this.#directory, `${id}.json`);
  }

  /**
   * Читает данные пользователя по ID. Если пользователь не найден, возвращает null.
   * @private
   * @param {string|number} id
   * @returns {Promise<UserTemplate|null>} Данные пользователя или null, если пользователь не найден.
   */
  async #readUser(id) {
    try {
      const filePath = this.#getFilePath(id);
      const data = await readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      console.error(`Ошибка чтения данных пользователя ${id}:`, error.message);
      return null;
    }
  }

  /**
   * Обрабатывает очередь на запись, записывая данные пользователей по очереди.
   * @private
   * @returns {Promise<void>}
   */
  async #processWriteQueue() {
    if (this.#isWriting) return;
    this.#isWriting = true;

    while (this.#writeQueue.length > 0) {
      const { filePath, data } = this.#writeQueue.shift();
      try {
        const tempFilePath = `${filePath}.tmp`;
        await writeFile(tempFilePath, JSON.stringify(data, null, 2));
        await rename(tempFilePath, filePath);
      } catch (error) {
        console.error(`Ошибка записи файла ${filePath}:`, error.message);
      }
    }

    this.#isWriting = false;
  }

  /**
   * Записывает данные пользователя в файл. Если данных нет, выводит ошибку в консоль.
   * @private
   * @param {string|number} id - ID пользователя.
   * @param {UserTemplate} data - Данные пользователя для записи.
   * @returns {Promise<void>}
   */
  async #writeUser(id, data) {
    if (!data) {
      console.error(`Попытка записи пустых данных для пользователя ${id}`);
      return;
    }

    const filePath = this.#getFilePath(id);
    this.#writeQueue.push({ filePath, data });
    await this.#processWriteQueue();
  }

  /**
   * Создает нового пользователя с данным ID. Если пользователь уже существует, возвращает null.
   * @param {string|number} id - ID нового пользователя.
   * @returns {Promise<UserTemplate|null>} Данные нового пользователя или null, если пользователь уже существует.
   */
  async create(id) {
    return withFileLock(this.#getFilePath(id), async () => {
      const existingUser = await this.#readUser(id);
      if (existingUser) {
        console.error(`Пользователь с ID ${id} уже существует`);
        return null;
      }

      const newUser = {
        id,
        nick: 'Новичок',
        money: 0,
        workTimeout: null,
        cars: [],
        houses: [],
        phones: [],
        pets: [],
        buisnesses: [],
        credit: [],
        deposit: [],
        isBotAdmin: false,
        isBanned: false,
        banReason: []
      };

      await this.#writeUser(id, newUser);
      return newUser;
    });
  }

  /**
   * Читает данные пользователя по ID. Если пользователь не найден, возвращает null.
   * @param {string|number} id - ID пользователя.
   * @returns {Promise<UserTemplate|null>} Данные пользователя или null, если пользователь не найден.
   */
  async read(id) {
    return this.#readUser(id);
  }

  async readAll() {
    try {
      const files = await readdir(this.#directory);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      const users = await Promise.all(
        jsonFiles.map(async file => {
          const userId = file.replace('.json', '');
          return this.#readUser(userId);
        })
      );

      return users.filter(user => user !== null);
    } catch (error) {
      console.error('Ошибка чтения всех пользователей:', error.message);
      return [];
    }
  }

  /**
   * Атомарно изменяет данные пользователя внутри межпроцессной блокировки.
   * @param {string|number} id - ID пользователя.
   * @param {(user: UserTemplate) => void|Promise<void>} mutator - Функция изменения пользователя.
   * @returns {Promise<UserTemplate|null>} Обновленный пользователь или null, если пользователь не найден.
   */
  async modify(id, mutator) {
    return withFileLock(this.#getFilePath(id), async () => {
      const user = await this.#readUser(id);
      if (!user) {
        console.error(`Пользователь с ID ${id} не найден`);
        return null;
      }

      await mutator(user);
      await this.#writeUser(id, user);
      return user;
    });
  }

  /**
   * Выполняет callback, удерживая блокировку одного или нескольких пользователей.
   * Callback получает операции чтения и записи, которые не пытаются захватить блокировку повторно.
   * ID всегда блокируются в одном порядке, чтобы не допускать deadlock при работе с двумя аккаунтами.
   *
   * @param {string|number|string[]|number[]} ids
   * @param {(transaction: {read: (id: string|number) => Promise<UserTemplate|null>, write: (id: string|number, data: UserTemplate) => Promise<void>}) => Promise<any>} callback
   * @returns {Promise<any>}
   */
  async withLocks(ids, callback) {
    const uniqueIds = [...new Set(Array.isArray(ids) ? ids : [ids])]
      .map(String)
      .sort();
    const lockedIds = new Set(uniqueIds);

    const assertLocked = (id) => {
      if (!lockedIds.has(String(id))) {
        throw new Error(`Пользователь ${id} не захвачен текущей транзакцией`);
      }
    };

    const transaction = {
      read: async id => {
        assertLocked(id);
        return this.#readUser(id);
      },
      write: async (id, data) => {
        assertLocked(id);
        await this.#writeUser(id, data);
      }
    };

    const acquire = async (index) => {
      if (index >= uniqueIds.length) return callback(transaction);
      return withFileLock(this.#getFilePath(uniqueIds[index]), () => acquire(index + 1));
    };

    return acquire(0);
  }

  /**
   * Обновляет данные пользователя с данным ID. Обновление выполняется атомарно.
   * @param {string|number} id - ID пользователя.
   * @param {Partial<UserTemplate>} updates - Объект с обновлениями данных пользователя.
   * @returns {Promise<UserTemplate|null>} Обновленные данные пользователя или null, если пользователь не найден или данные некорректные.
   */
  async update(id, updates) {
    return this.modify(id, user => {
      const sanitizedUpdates = { ...updates };
      delete sanitizedUpdates.id;

      if (sanitizedUpdates.money !== undefined && (typeof sanitizedUpdates.money !== 'number' || sanitizedUpdates.money < 0)) {
        throw new Error('Некорректное значение для money');
      }

      if (sanitizedUpdates.money !== undefined) {
        sanitizedUpdates.money = Number(sanitizedUpdates.money.toFixed(2));
      }

      Object.assign(user, sanitizedUpdates);
    }).catch(error => {
      console.error(`Ошибка обновления пользователя ${id}:`, error.message);
      return null;
    });
  }

  /**
   * Удаляет пользователя с данным ID.
   * @param {string|number} id - ID пользователя.
   * @returns {Promise<boolean>} true, если пользователь успешно удален, false в противном случае.
   */
  async delete(id) {
    return withFileLock(this.#getFilePath(id), async () => {
      const user = await this.#readUser(id);
      if (!user) {
        console.error(`Пользователь с ID ${id} не найден`);
        return false;
      }

      try {
        await unlink(this.#getFilePath(id));
        return true;
      } catch (error) {
        console.error(`Ошибка удаления пользователя ${id}:`, error.message);
        return false;
      }
    });
  }
}

const users = new Database('storage/json/users');

export { Database, users, UserTemplate };
