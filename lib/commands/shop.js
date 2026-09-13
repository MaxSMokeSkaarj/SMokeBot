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
  bankInsufficientFunds: 'Банк не может выплатить стоимость продажи, попробуйте позже',
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
};

const getItemPrice = (item, tier = 1) => {
  if (typeof item?.price === 'number') return item.price;

  const tierData = item?.tiers?.[tier - 1];
  return typeof tierData?.price === 'number' ? tierData.price : null;
};

// Генерация списка товаров
const generateShop = async (file) => {
  const items = await loadItems(file);
  return items
    .map((item, index) => {
      const price = getItemPrice(item);
      return price === null
        ? `Номер: ${index + 1}, ${item.name}, Цена: не указана`
        : `Номер: ${index + 1}, ${item.name}, Цена: ${price}`;
    })
    .join('\n') || 'Список пуст';
};

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
  }

  return user[field]
    .map((entry, index) => {
      const item = items[entry.id];
      return item
        ? `Номер: ${index + 1}, ${item.name}, Таймаут: ${entry.timeout}`
        : `Номер: ${index + 1}, Неизвестно`;
    })
    .join('\n') || 'У вас нет этого имущества';
};

const buy = async (ctx, itemType, choiceIndex) => {
  if (!Number.isInteger(choiceIndex) || choiceIndex < 1) {
    return messages.invalidNumber;
  }

  const { file, field } = itemTypes[itemType];
  const items = await loadItems(file);
  const item = items[choiceIndex - 1];
  const price = getItemPrice(item);
  const firstTier = itemType === 'бизнес' ? item?.tiers?.[0] : null;

  if (!item || !item.name || price === null || price <= 0) {
    return messages.itemNotFound;
  }

  if (itemType === 'бизнес' && (!firstTier || typeof firstTier.income !== 'number')) {
    return messages.itemNotFound;
  }

  if (ctx.account.money < price) {
    return messages.insufficientFunds;
  }

  await bank.addMoney(price);
  ctx.account.money -= price;

  if (itemType === 'бизнес') {
    const timeout = new Date();
    timeout.setDate(timeout.getDate() + 1);
    ctx.account[field].push({
      id: choiceIndex - 1,
      timeout: timeout.toISOString(),
      tier: 1,
      income: firstTier.income,
    });
  } else {
    ctx.account[field].push(choiceIndex - 1);
  }

  return messages.purchased(item.name);
};

const sell = async (ctx, itemType, choiceIndex) => {
  const { file, field, isArrayOfIndexes } = itemTypes[itemType];
  const items = await loadItems(file);

  if (!Number.isInteger(choiceIndex) || choiceIndex < 1 || choiceIndex > ctx.account[field].length) {
    return messages.invalidNumber;
  }

  const entry = ctx.account[field][choiceIndex - 1];
  const itemIndex = isArrayOfIndexes ? entry : entry?.id;
  const item = items[itemIndex];
  const tier = isArrayOfIndexes ? 1 : entry?.tier ?? 1;
  const price = getItemPrice(item, tier);

  if (!item || price === null || price <= 0) {
    return messages.itemNotFound;
  }

  const sellPrice = Number((price * 0.6).toFixed(2)); // 60% от цены покупки

  if (!await bank.tryRemoveMoney(sellPrice)) {
    return messages.bankInsufficientFunds;
  }

  ctx.account[field].splice(choiceIndex - 1, 1);
  ctx.account.money += sellPrice;

  return messages.sold(item.name);
};

/**
 * @param {import('../types').BotContext} ctx
 */
export const command = async (ctx) => {
  if (ctx.args.length === 0) return messages.commandHelp;

  const text = ctx.args.join(' ');
  const [command, itemType, choice] = text.split(' ').map((s) => s.toLowerCase());
  const choiceIndex = Number(choice);

  if (!itemTypes[itemType]) {
    return messages.unknownProperty;
  }

  try {
    if (command === 'купить') {
      return await buy(ctx, itemType, choiceIndex);
    }
    if (command === 'продать') {
      return await sell(ctx, itemType, choiceIndex);
    }
    if (command === 'список') {
      return generateShop(itemTypes[itemType].file);
    }
    if (command === 'имущество') {
      return generateUserItems(ctx.account, itemType);
    }
    return messages.unknownCommand;
  } catch (error) {
    console.error(error);
    return messages.fileError;
  }
};