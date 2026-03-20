import { readFile, writeFile, readdir, unlink, rename } from 'fs/promises';
import { join } from 'path';


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
      if (error.code === 'ENOENT') {
        return null;
      }
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
   * Создает нового пользователя с данным ID. Если пользователь уже существует, выводит ошибку в консоль и возвращает null.
   * @param {string|number} id - ID нового пользователя.
   * @returns {Promise<UserTemplate|null>} Данные нового пользователя или null, если пользователь уже существует.
  */
  async create(id) {
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
  }

  /**
   * Читает данные пользователя по ID. Если пользователь не найден, возвращает null.
   * @param {string|number} id - ID пользователя.
   * @returns {Promise<UserTemplate|null>} Данные пользователя или null, если пользователь не найден.
  */
  async read(id) {
    return await this.#readUser(id);
  }

  async readAll() {
    try {
      const files = await readdir(this.#directory);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      const users = await Promise.all(
        jsonFiles.map(async file => {
          const userId = file.replace('.json', '');
          return await this.#readUser(userId);
        })
      );

      return users.filter(user => user !== null);
    } catch (error) {
      console.error('Ошибка чтения всех пользователей:', error.message);
      return [];
    }
  }

  /**
   * Обновляет данные пользователя с данным ID. Если пользователь не найден, выводит ошибку в консоль и возвращает null. Если данные некорректные, выводит ошибку и возвращает null.
   * @param {string|number} id - ID пользователя.
   * @param {Partial<UserTemplate>} updates - Объект с обновлениями данных пользователя.
   * @returns {Promise<UserTemplate|null>} Обновленные данные пользователя или null, если пользователь не найден или данные некорректные.
  */
  async update(id, updates) {
    let user = await this.#readUser(id);
    if (!user) {
      console.error(`Пользователь с ID ${id} не найден`);
      return null;
    }

    delete updates.id;

    // Валидация
    if (updates.money !== undefined && (typeof updates.money !== 'number' || updates.money < 0)) {
      console.error('Некорректное значение для money');
      return null;
    }
    if (updates.credit) {
      for (const credit of updates.credit) {
        if (!credit.amount || !credit.startDate || !credit.endDate) {
          console.error('Некорректная структура кредита');
          return null;
        }
      }
    }

    if (updates.money) updates.money = Number(updates.money.toFixed(2));

    user = { ...user, ...updates };
    await this.#writeUser(id, user);
    return user;
  }

  /**
   * Удаляет пользователя с данным ID. Если пользователь не найден, выводит ошибку в консоль и возвращает false.
   * @param {string|number} id - ID пользователя.
   * @returns {Promise<boolean>} true, если пользователь успешно удален, false в противном случае.
  */
  async delete(id) {
    const user = await this.#readUser(id);
    if (!user) {
      console.error(`Пользователь с ID ${id} не найден`);
      return false;
    }

    try {
      const filePath = this.#getFilePath(id);
      await unlink(filePath); // Удаляем файл
      return true;
    } catch (error) {
      console.error(`Ошибка удаления пользователя ${id}:`, error.message);
      return false;
    }
  }
}

const users = new Database('storage/json/users');

export { Database, users, UserTemplate };