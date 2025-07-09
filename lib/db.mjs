import { readFile, writeFile } from 'fs/promises';

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
 * @property {number} id - ID пользователя в соцсети(Discord, Telegram, VK etc).
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
  #filePath;

  /**
   * Создаёт экземпляр базы данных.
   * @param {string} filePath - Путь к JSON DB.
   */
  constructor(filePath) {
    this.#filePath = filePath;
  };

  /**
   * Читает данные из JSON файла.
   * @returns {Promise<Array<UserTemplate>>} Массив пользователей или пустой массив в случае ошибки.
   * @private
   */
  async #readDb() {
    try {
      const data = await readFile(this.#filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      };
      console.error('Ошибка чтения базы данных:', error.message);
      return [];
    };
  };

  /**
   * Записывает данные в JSON файл.
   * @param {Array} data - Массив пользователей для записи.
   * @returns {Promise<void>}
   * @private
   */
  async #writeDb(data) {
    try {
      await writeFile(this.#filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Ошибка записи в базу данных:', error.message);
    };
  };

  /**
   * Создаёт нового пользователя в базе данных.
   * @param {number} id - ID пользователя.
   * @returns {Promise<UserTemplate> | null} Созданный пользователь или null в случае ошибки.
   */
  async create(id) {
    const db = await this.#readDb();

    /** @type {UserTemplate} */
    const newUser = {
      id: id,
      nick: 'Новичок',
      money: 0,
      cars: [],
      houses: [],
      phones: [],
      pets: [],
      buisnesses: [],
      credit: [],
      deposit: [],
      isBotAdmin: false,
      isBanned: false,
      banReason: ''
    };

    db.push(newUser);
    await this.#writeDb(db);
    return newUser;
  };

  /**
   * Читает данные пользователя по ID.
   * @param {number} id - ID пользователя.
   * @returns {Promise<UserTemplate|null>} Данные пользователя или null, если пользователь не найден.
   */
  async read(id) {
    const db = await this.#readDb();
    const user = db.find(user => user.id === id);

    if (!user) return null;

    return user;
  };

  /**
   * Читает всех пользователей из базы данных.
   * @returns {Promise<Array<UserTemplate>>} Массив всех пользователей.
   */
  async readAll() {
    return await this.#readDb();
  };

  /**
   * Обновляет данные пользователя по ID.
   * @param {UserTemplate.id} id - ID пользователя.
   * @param {UserTemplate} updates - Объект с обновляемыми полями.
   * @returns {Promise<UserTemplate|null>} Обновлённый пользователь или null, если пользователь не найден.
   */
  async update(id, updates) {
    const db = await this.#readDb();
    let user = db.find(user => user.id === id);

    if (!user) return null;

    //preserve id
    delete updates.id;
    Object.assign(user, updates);

    await this.#writeDb(db);
    return user;
  };

  /**
   * Удаляет пользователя по ID.
   * @param {number} id - ID пользователя.
   * @returns {Promise<boolean>} true, если пользователь удалён, false, если не найден.
   */
  async delete(id) {
    const db = await this.#readDb();
    const userIndex = db.findIndex(user => user.id === id);

    if (userIndex === -1) {
      console.error(`Пользователь с ID ${id} не найден`);
      return false;
    };

    db.splice(userIndex, 1);
    await this.#writeDb(db);
    return true;
  };
};

const users = new Database('json/users.json');

export { Database, users, UserTemplate};