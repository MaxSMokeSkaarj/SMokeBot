import { readFile } from 'fs/promises';
// eslint-disable-next-line no-unused-vars
import { Context as TelegramContext } from 'telegraf';
// eslint-disable-next-line no-unused-vars
import { MessageContext as VKContext } from 'vk-io';
// eslint-disable-next-line no-unused-vars
import { Message as DSContext } from 'discord.js';

import { users } from '../db.js';
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
};

// Загрузка данных из JSON-файла
async function loadItems(file) {
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
async function generateShop(file) {
  const items = await loadItems(file);
  return items
    .map((item, index) => `Номер: ${index + 1}, ${item.name}, Цена: ${item.price}`)
    .join('\n') || 'Список пуст';
}

// Генерация списка имущества пользователя
async function generateUserItems(user, itemType) {
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

// Покупка объекта
async function buyItem(user, itemType, choiceIndex, ctx) {
  const { file, field, isArrayOfIndexes } = itemTypes[itemType];
  const items = await loadItems(file);
  const item = items[choiceIndex - 1];

  if (!item || !item.name || !item.price) {
    return ctx.reply(messages.itemNotFound);
  }

  if (user.money < item.price) {
    return ctx.reply(messages.insufficientFunds);
  }

  // пренебрежение округлением из-за круглых цен
  user.money -= item.price;
  await bank.addMoney(item.price);

  if (isArrayOfIndexes) {
    user[field].push(choiceIndex - 1);
  } else {
    user[field].push({ id: choiceIndex - 1, timeout: new Date() });
  }
  users.update(user.id, { ...user });
  await ctx.reply(messages.purchased(item.name));
}

// Продажа объекта
async function sellItem(user, itemType, choiceIndex, ctx) {
  const { file, field, isArrayOfIndexes } = itemTypes[itemType];
  const items = await loadItems(file);

  if (!Number.isInteger(choiceIndex) || choiceIndex < 1 || choiceIndex > user[field].length) {
    return ctx.reply(messages.invalidNumber);
  }

  let itemIndex;
  if (isArrayOfIndexes) {
    itemIndex = user[field][choiceIndex - 1];
  } else {
    itemIndex = user[field][choiceIndex - 1].id;
  }

  const item = items[itemIndex];
  if (!item || !item.price) {
    return ctx.reply(messages.itemNotFound);
  }

  user[field].splice(choiceIndex - 1, 1);
  const sellPrice = Number((item.price * 0.8).toFixed(2)); // 80% от цены покупки
  
  const bankBalance = await bank.getBalance();
  if (bankBalance < sellPrice) {
    return ctx.reply(messages.bankInsufficientFunds);
  }

  user.money += sellPrice;
  await bank.removeMoney(sellPrice);

  users.update(user.id, { ...user });
  await ctx.reply(messages.sold(item.name));
}

/**
 * @param { Object } params
 * @param { VKContext | TelegramContext | DSContext } params.ctx
 * @param { UserTemplate } params.user
 * @param { Array<string> } params.params
 */

export const command = async ({ctx, user, params}) => {

  const text = params.slice(1).join(' ');
  const [command, itemType, choice] = text.split(' ').map((s) => s.toLowerCase());
  const choiceIndex = Number.parseInt(choice);

  if (!itemTypes[itemType]) {
    return ctx.reply(messages.unknownProperty);
  }

  try {
    if (command === 'купить') {
      if (!Number.isInteger(choiceIndex) || choiceIndex < 1) {
        return ctx.reply(messages.invalidNumber);
      }
      await buyItem(user, itemType, choiceIndex, ctx);
    } else if (command === 'продать') {
      await sellItem(user, itemType, choiceIndex, ctx);
    } else if (command === 'список') {
      const shop = await generateShop(itemTypes[itemType].file);
      await ctx.reply(shop);
    } else if (command === 'имущество') {
      const userItems = await generateUserItems(user, itemType);
      await ctx.reply(userItems);
    } else {
      await ctx.reply(messages.unknownCommand);
    }
  } catch (error) {
    console.error(error);
    await ctx.reply(messages.fileError);
  }
};