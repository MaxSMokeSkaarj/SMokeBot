import { readFile, writeFile, readdir } from 'fs/promises';
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
 * @property {number} id - ID бизнеса.
 * @property {string} timeout - Время таймаута.
 */

/**
 * @typedef {Object} UserTemplate - Объект с данными пользователя.
 * @property {number} id - ID пользователя в соцсети (Discord, Telegram, VK etc).
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

  /**
   * Создаёт экземпляр базы данных.
   * @param {string} directory - Путь к папке, где хранятся файлы пользователей.
   */
  constructor(directory) {
    this.#directory = directory;
  }

  /**
   * Формирует путь к файлу пользователя по ID.
   * @param {number} id - ID пользователя.
   * @returns {string} Путь к файлу пользователя.
   * @private
   */
  #getFilePath(id) {
    return join(this.#directory, `${id}.json`);
  }

  /**
   * Читает данные пользователя по ID.
   * @param {number} id - ID пользователя.
   * @returns {Promise<UserTemplate|null>} Данные пользователя или null, если файл не найден.
   * @private
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
   * Записывает данные пользователя в файл.
   * @param {number} id - ID пользователя.
   * @param {UserTemplate} data - Данные пользователя.
   * @returns {Promise<void>}
   * @private
   */
  async #writeUser(id, data) {
    try {
      const filePath = this.#getFilePath(id);
      await writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Ошибка записи данных пользователя ${id}:`, error.message);
    }
  }

  /**
   * Создаёт нового пользователя в базе данных.
   * @param {number} id - ID пользователя.
   * @returns {Promise<UserTemplate|null>} Созданный пользователь или null, если пользователь уже существует.
   */
  async create(id) {
    const existingUser = await this.#readUser(id);
    if (existingUser) {
      console.error(`Пользователь с ID ${id} уже существует`);
      return null;
    }

    /** @type {UserTemplate} */
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
   * Читает данные пользователя по ID.
   * @param {number} id - ID пользователя.
   * @returns {Promise<UserTemplate|null>} Данные пользователя или null, если пользователь не найден.
   */
  async read(id) {
    return await this.#readUser(id);
  }

  /**
   * Читает всех пользователей из базы данных.
   * @returns {Promise<Array<UserTemplate>>} Массив всех пользователей.
   */
  async readAll() {
    try {
      const files = await readdir(this.#directory);
      const users = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const userId = parseInt(file.replace('.json', ''), 10);
          const user = await this.#readUser(userId);
          if (user) {
            users.push(user);
          }
        }
      }

      return users;
    } catch (error) {
      console.error('Ошибка чтения всех пользователей:', error.message);
      return [];
    }
  }

  /**
   * Обновляет данные пользователя по ID.
   * @param {number} id - ID пользователя.
   * @param {Partial<UserTemplate>} updates - Объект с обновляемыми полями.
   * @returns {Promise<UserTemplate|null>} Обновлённый пользователь или null, если пользователь не найден.
   */
  async update(id, updates) {
    let user = await this.#readUser(id);
    if (!user) {
      console.error(`Пользователь с ID ${id} не найден`);
      return null;
    }

    // Защита от изменения id
    delete updates.id;
    user = { ...user, ...updates };

    await this.#writeUser(id, user);
    return user;
  }

  /**
   * Удаляет пользователя по ID.
   * @param {number} id - ID пользователя.
   * @returns {Promise<boolean>} true, если пользователь удалён, false, если не найден.
   */
  async delete(id) {
    const user = await this.#readUser(id);
    if (!user) {
      console.error(`Пользователь с ID ${id} не найден`);
      return false;
    }

    try {
      const filePath = this.#getFilePath(id);
      await writeFile(filePath, ''); // Очищаем файл
      return true;
    } catch (error) {
      console.error(`Ошибка удаления пользователя ${id}:`, error.message);
      return false;
    }
  }
}

const users = new Database('storage/json/users');

export { Database, users, UserTemplate };