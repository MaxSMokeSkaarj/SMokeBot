import { readFile } from 'fs/promises';

/**@type {Array<JSON>} */
const buisness = JSON.parse(await readFile('storage/json/buisnesses.json'));
/**@type {Array<JSON>} */
const cars = JSON.parse(await readFile('storage/json/cars.json'));
/**@type {Array<JSON>} */
const houses = JSON.parse(await readFile('storage/json/houses.json'));
/**@type {Array<JSON>} */
const pets = JSON.parse(await readFile('storage/json/pets.json'));
/**@type {Array<JSON>} */
const phones = JSON.parse(await readFile('storage/json/phones.json'));

/**
 * Группирует и подсчитывает количество каждого предмета в массиве, используя словарь для получения названий предметов. Если массив пустой, возвращает 'Нет'.
 * @param {Business[]|Car[]|House[]|Pet[]|Phone[]} items - Массив предметов пользователя.
 * @param {Array<JSON>} dict - Словарь с данными всех предметов данного типа, где ключ - ID предмета, а значение - объект с данными предмета.
 * @param {Function} [getId] - Функция для получения ID предмета из элемента массива items. По умолчанию возвращает элемент массива как есть.
 * @returns {string} Строка с перечислением предметов и их количеством, или 'Нет', если массив пустой.
*/
const groupAndCount = (items, dict, getId = (x) => x) => {
  if (!Array.isArray(items) || items.length === 0) return 'Нет';
  const counts = {};
  for (const idx of items) {
    const id = getId(idx);
    if (dict[id]) {
      const name = dict[id].name;
      counts[name] = (counts[name] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([name, count]) => count > 1 ? `${name} x${count}` : name)
    .join(',\n\t\t') || 'Нет';
}

/**
 * @param {BotContext} ctx
*/
export const command = async (ctx) => {
  const user = ctx.account;
  const haveBuisness = groupAndCount(user.buisnesses, buisness, (x) => x.id);
  const haveCars = groupAndCount(user.cars, cars);
  const haveHouses = groupAndCount(user.houses, houses);
  const havePets = groupAndCount(user.pets, pets);
  const havePhones = groupAndCount(user.phones, phones);

  return `Вы: ${user.nick},\nВаш ID: ${user.id}\nНа вашем счету ${user.money},\nВаши дома:\n\t\t${haveHouses},\nВаши машины:\n\t\t${haveCars},\nВаши телефоны:\n\t\t${havePhones},\nВаши бизнесы:\n\t\t${haveBuisness},\nВаши питомцы:\n\t\t${havePets}`;
};
