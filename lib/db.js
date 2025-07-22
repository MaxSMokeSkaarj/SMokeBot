import { readFile, writeFile, readdir, unlink } from 'fs/promises';
import { join } from 'path';

/**
 * @typedef {Object} Credit
 * @property {number} amount - Сумма займа.
 * @property {string} startDate - Дата выдачи займа.
 * @property {string} endDate - Дата погашения займа.
 * @property {number} [interestRate=0] - Процентная ставка.
 */

/**
 * @typedef {Object} Deposit
 * @property {number} amount - Сумма вклада.
 * @property {string} startDate - Дата открытия вклада.
 * @property {number} [interestRate=0] - Процентная ставка.
 */

/**
 * @typedef {Object} Business
 * @property {string} id - ID бизнеса.
 * @property {string} timeout - Время таймаута.
 */

/**
 * @typedef {Object} UserTemplate - Объект с данными пользователя.
 * @property {string} id - ID пользователя в соцсети (Discord, Telegram, VK etc).
 * @property {string} [nick='Новичок'] - Никнейм пользователя.
 * @property {number} [money=0] - Количество денег.
 * @property {string|null} [workTimeout=null] - Таймаут на работу.
 * @property {Array<number>} [cars=[]] - Машины во владении.
 * @property {Array<number>} [houses=[]] - Дома во владении.
 * @property {Array<number>} [phones=[]] - Телефоны во владении.
 * @property {Array<number>} [pets=[]] - Имеющиеся питомцы.
 * @property {Array<Business>} [buisnesses=[]] - Имеющиеся бизнесы.
 * @property {Array<Credit>} [credit=[]] - Список займов.
 * @property {Array<Deposit>} [deposit=[]] - Список вкладов.
 * @property {boolean} [isBotAdmin=false] - Флаг администратора бота.
 * @property {boolean} [isBanned=false] - Флаг бана.
 * @property {Array<string>} [banReason=[]] - Причины бана.
 */

/** @type {UserTemplate} */
const UserTemplate = {};

/**
 * Класс для работы с JSON DB.
 */
class Database {
  #directory;
  #writeQueue = [];
  #isWriting = false;

  constructor(directory) {
    this.#directory = directory;
  }

  #getFilePath(id) {
    return join(this.#directory, `${id}.json`);
  }

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

  async #processWriteQueue() {
    if (this.#isWriting || this.#writeQueue.length === 0) return;

    this.#isWriting = true;
    const { filePath, data } = this.#writeQueue.shift();

    try {
      const tempFilePath = `${filePath}.tmp`;
      await writeFile(tempFilePath, JSON.stringify(data, null, 2));
      await writeFile(filePath, JSON.stringify(data, null, 2)); // Атомарная запись через временный файл
    } catch (error) {
      console.error(`Ошибка записи файла ${filePath}:`, error.message);
    }

    this.#isWriting = false;
    await this.#processWriteQueue();
  }

  async #writeUser(id, data) {
    if (!data) {
      console.error(`Попытка записи пустых данных для пользователя ${id}`);
      return;
    }
    const filePath = this.#getFilePath(id);
    this.#writeQueue.push({ filePath, data });
    await this.#processWriteQueue();
  }

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

    user = { ...user, ...updates };
    await this.#writeUser(id, user);
    return user;
  }

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