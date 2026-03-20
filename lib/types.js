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
*/

/**
 * @typedef {Object} Command
 * @property {BotContext} context - Контекст выполнения команды.
 * @returns {Promise<string|void>} - Результат выполнения команды.
*/