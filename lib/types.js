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

export {
  BotContext,
  UserTemplate,
  Credit,
  Deposit,
  Business,
  UserTemplate,
  BotContext,
  Command
}