/**
 * @typedef {Object} Credit
 * @property {number} amountTotal - Сумма займа.
 * @property {number} amountPaid - Сумма оплаченного долга.
 * @property {string} dailyPayment - Сумма ежедневного платежа.
 * @property {number} daysLeft - Количество дней до полного погашения.
 * @property {string} nextPaymentDate - Дата следующего платежа.
*/

/**
 * @typedef {Object} Deposit
 * @property {number} amount - Сумма вклада.
 * @property {string} startDate - Дата открытия вклада.
 * @property {number} interestRate - Процентная ставка.
*/

/**
 * @typedef {Object} Business
 * @property {string} id - ID бизнеса.
 * @property {string} timeout - Время таймаута.
 * @property {number} profit - Прибыль от бизнеса.
*/

/**
 * @typedef {Array<Business>} BusinessShop - Список бизнесов в магазине.
*/

/**
 * @typedef {Object} UserTemplate - Объект с данными пользователя.
 * @property {string} id - ID пользователя в соцсети (Discord, Telegram, VK etc).
 * @property {string} nick - Никнейм пользователя.
 * @property {number} money - Количество денег.
 * @property {string} workTimeout - Таймаут на работу.
 * @property {Array<number>} cars - Машины во владении.
 * @property {Array<number>} houses - Дома во владении.
 * @property {Array<number>} phones - Телефоны во владении.
 * @property {Array<number>} pets - Имеющиеся питомцы.
 * @property {Array<Business>} buisnesses - Имеющиеся бизнесы.
 * @property {Array<Credit>} credit - Список займов.
 * @property {Array<Deposit>} deposit - Список вкладов.
 * @property {boolean} isBotAdmin - Флаг администратора бота.
 * @property {boolean} isBanned - Флаг бана.
 * @property {Array<string>} banReason - Причины бана.
 * @property {string} taxTimeout - Таймаут на налог.
 * @property {string} jackpotTimeout - Таймаут на джекпот.
 * @property {string} secret - Секрет для доступа к аккаунту через API.
*/

/**
 * @typedef {Object} BotContext
 * @property {string} platform - Платформа (vk, telegram, discord).
 * @property {function(string): Promise<void>} send - Функция для отправки сообщений.
 * @property {string} text - Текст сообщения.
 * @property {string} cmd - Команда, извлеченная из текста.
 * @property {Array<string>} args - Аргументы команды.
 * @property {UserTemplate} account - Данные пользователя, которому отправляется ответ.
 * @property {Object} [reply] - Данные о сообщении, на которое отвечает пользователь.
 * @property {string} [reply.text] - Текст ответа, чьё сообщение переслали
 * @property {UserTemplate} [reply.account] - Данные пользователя, кого упомянул пользователь.
 * @returns {Promise<string>} - Результат выполнения команды.
*/

/**
 * @typedef {Object} Command
 * @property {BotContext} context - Контекст выполнения команды.
 * @returns {Promise<string|void>} - Результат выполнения команды.
*/

/**
 * @typedef {Object} CarShopItem
 * @property {string} name - Название машины.
 * @property {number} price - Цена машины. 
*/

/**
 * @typedef {Array<CarShopItem>} CarShop - Список машин в магазине.
*/

/**
 * @typedef {Object} HouseShopItem
 * @property {string} name - Название дома.
 * @property {number} price - Цена дома. 
*/

/**
 * @typedef {Array<HouseShopItem>} HouseShop - Список домов в магазине.
*/

/**
 * @typedef {Object} PetShopItem
 * @property {string} name - Название питомца.
 * @property {number} price - Цена питомца. 
*/

/**
 * @typedef {Array<PetShopItem>} PetShop - Список питомцев в магазине.
*/

/**
 * @typedef {Object} PhoneShopItem
 * @property {string} name - Название телефона.
 * @property {number} price - Цена телефона. 
*/

/**
 * @typedef {Array<PhoneShopItem>} PhoneShop - Список телефонов в магазине.
*/

export {
  BotContext,
  UserTemplate,
  Credit,
  Deposit,
  Business,
  BusinessShop,
  UserTemplate,
  BotContext,
  Command,
  CarShopItem,
  CarShop,
  HouseShopItem,
  HouseShop,
  PetShopItem,
  PetShop,
  PhoneShopItem,
  PhoneShop
}