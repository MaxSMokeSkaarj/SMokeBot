import { readFile } from 'fs/promises';
import { bank } from '../bank.js';

// Определение типов имущества
const itemTypes = {
  дом: { file: 'storage/json/houses.json', field: 'houses', isArrayOfIndexes: true },
  транспорт: { file: 'storage/json/cars.json', field: 'cars', isArrayOfIndexes: true },
  телефон: { file: 'storage/json/phones.json', field: 'phones', isArrayOfIndexes: true },
  бизнес: { file: 'storage/json/buisnesses.json', field: 'buisnesses', isArrayOfIndexes: false },
  питомец: { file: 'storage/json/pets.json', field: 'pets', isArrayOfIndexes: true },
};

// Кэш для хранения данных из JSON-файлов
const itemCache = {};

// Сообщения для пользователя
const messages = {
  insufficientFunds: 'Не хватает денег',
  unknownProperty: 'Неизвестное имущество!',
  unknownCommand: 'Неизвестная команда',
  purchased: (itemName) => `Вы купили ${itemName}`,
  sold: (itemName) => `Вы продали ${itemName}`,
  itemNotFound: 'Такой предмет не найден!',
  noItem: 'У вас нет этого имущества!',
  invalidNumber: 'Укажите корректный номер предмета (начиная с 1)!',
  fileError: 'Ошибка при загрузке данных! Проверьте формат JSON-файла.',
  bankInsufficientFunds: 'Банк не может выплатить стоймость продажи, попробуйте позже',
  commandHelp: 'Команды для магазина:\n1. Купить имущество: "купить [тип имущества] [номер]"\n2. Продать имущество: "продать [тип имущества] [номер]"\n3. Показать список товаров: "список [тип имущества]"\n4. Показать ваше имущество: "имущество [тип имущества]"\nТипы имущества: дом, транспорт, телефон, бизнес, питомец'
};

// Загрузка данных из JSON-файла
const loadItems = async (file) => {
  if (itemCache[file]) {
    return itemCache[file];
  }
  try {
    const data = await readFile(file, 'utf8');
    const items = JSON.parse(data);
    itemCache[file] = items;
    return items;
  } catch (error) {
    console.error(`Ошибка при загрузке файла ${file}:`, error);
    throw new Error(messages.fileError);
  }
}

// Генерация списка товаров
const generateShop = async (file) => {
  const items = await loadItems(file);
  return items
    .map((item, index) => `Номер: ${index + 1}, ${item.name}, Цена: ${item.price}`)
    .join('\n') || 'Список пуст';
}

// Генерация списка имущества пользователя
const generateUserItems = async (user, itemType) => {
  const { file, field, isArrayOfIndexes } = itemTypes[itemType];
  const items = await loadItems(file);

  if (isArrayOfIndexes) {
    return user[field]
      .map((itemIndex, index) => {
        const item = items[itemIndex];
        return item
          ? `Номер: ${index + 1}, ${item.name}`
          : `Номер: ${index + 1}, Неизвестно`;
      })
      .join('\n') || 'У вас нет этого имущества';
  } else {
    return user[field]
      .map((entry, index) => {
        const item = items[entry.id];
        return item
          ? `Номер: ${index + 1}, ${item.name}, Таймаут: ${entry.timeout}`
          : `Номер: ${index + 1}, Неизвестно`;
      })
      .join('\n') || 'У вас нет этого имущества';
  }
}

/**
 * @param {BotContext} ctx
 */
export const command = async (ctx) => {

  if (ctx.args.length === 0) return messages.commandHelp;
  const text = ctx.args.join(' ');
  const [command, itemType, choice] = text.split(' ').map((s) => s.toLowerCase());
  const choiceIndex = Number.parseInt(choice);

  if (!itemTypes[itemType]) {
    return messages.unknownProperty;
  }

  try {
    if (command === 'купить') {
      if (!Number.isInteger(choiceIndex) || choiceIndex < 1) {
        return ctx.reply(messages.invalidNumber);
      }
      const { file, field, isArrayOfIndexes } = itemTypes[itemType];
      const items = await loadItems(file);
      const item = items[choiceIndex - 1];

      if (!item || !item.name || !item.price) {
        return messages.itemNotFound;
      }

      if (ctx.account.money < item.price) {
        return messages.insufficientFunds;
      }

      // пренебрежение округлением из-за круглых цен
      ctx.account.money -= item.price;
      await bank.addMoney(item.price);

      if (isArrayOfIndexes) {
          if (itemType === 'бизнес') {
            const timeout = new Date();
            timeout.setDate(timeout.getDate() + 1);
            ctx.account[field].push({ id: choiceIndex - 1, timeout });
          } else {
            ctx.account[field].push(choiceIndex - 1);
          }
      } else {
        ctx.account[field].push({ id: choiceIndex - 1});
      }
      return messages.purchased(item.name);
    } else if (command === 'продать') {
      const { file, field, isArrayOfIndexes } = itemTypes[itemType];
      const items = await loadItems(file);

      if (!Number.isInteger(choiceIndex) || choiceIndex < 1 || choiceIndex > ctx.account[field].length) {
        return messages.invalidNumber;
      }

      let itemIndex;
      if (isArrayOfIndexes) {
        itemIndex = ctx.account[field][choiceIndex - 1];
      } else {
        itemIndex = ctx.account[field][choiceIndex - 1].id;
      }

      const item = items[itemIndex];
      if (!item || !item.price) {
        return messages.itemNotFound;
      }

      ctx.account[field].splice(choiceIndex - 1, 1);
      const sellPrice = Number((item.price * 0.8).toFixed(2)); // 80% от цены покупки

      const bankBalance = await bank.getBalance();
      if (bankBalance < sellPrice) {
        return messages.bankInsufficientFunds;
      }

      ctx.account.money += sellPrice;
      await bank.removeMoney(sellPrice);

      return messages.sold(item.name);
    } else if (command === 'список') {
      const shop = await generateShop(itemTypes[itemType].file);
      return shop;
    } else if (command === 'имущество') {
      const userItems = await generateUserItems(user, itemType);
      return userItems;
    } else {
      return messages.unknownCommand;
    }
  } catch (error) {
    console.error(error);
    return messages.fileError;
  }
};