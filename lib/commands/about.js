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

  const targetUser = ctx.reply.account
  if (!targetUser) return 'Укажите пользователя';
  
  const haveBuisness = groupAndCount(targetUser.buisnesses, buisness, (x) => x.id);
  const haveCars = groupAndCount(targetUser.cars, cars);
  const haveHouses = groupAndCount(targetUser.houses, houses);
  const havePets = groupAndCount(targetUser.pets, pets);
  const havePhones = groupAndCount(targetUser.phones, phones);

  return `Игрок: ${targetUser.nick},\nЕго ID: ${targetUser.id}\nНа его счету ${targetUser.money},\nЕго дома:\n\t\t${haveHouses},\nЕго машины:\n\t\t${haveCars},\nЕго телефоны:\n\t\t${havePhones},\nЕго бизнесы:\n\t\t${haveBuisness},\nЕго питомцы:\n\t\t${havePets}`;
};
