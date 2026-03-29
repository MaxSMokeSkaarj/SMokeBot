import { readFile } from 'fs/promises';

const buisness = JSON.parse(await readFile('storage/json/buisnesses.json'));
const cars = JSON.parse(await readFile('storage/json/cars.json'));
const houses = JSON.parse(await readFile('storage/json/houses.json'));
const pets = JSON.parse(await readFile('storage/json/pets.json'));
const phones = JSON.parse(await readFile('storage/json/phones.json'));

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
 * @param {import('../types').BotContext} ctx
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
