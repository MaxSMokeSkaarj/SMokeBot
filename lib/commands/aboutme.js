// eslint-disable-next-line no-unused-vars
import { Context as TelegramContext } from 'telegraf';
// eslint-disable-next-line no-unused-vars
import { MessageContext as VKContext} from 'vk-io';
// eslint-disable-next-line no-unused-vars
import { Message as DSContext } from 'discord.js';
import { readFile } from 'fs/promises';

// eslint-disable-next-line no-unused-vars
import { UserTemplate } from '../db.js';

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
 * @param { Object } params
 * @param { VKContext | TelegramContext | DSContext } params.ctx
 * @param { UserTemplate } params.user
 */

function groupAndCount(items, dict, getId = (x) => x) {
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

export const command = async ({ctx, user}) => {
  const haveBuisness = groupAndCount(user.buisnesses, buisness, (x) => x.id);
  const haveCars = groupAndCount(user.cars, cars);
  const haveHouses = groupAndCount(user.houses, houses);
  const havePets = groupAndCount(user.pets, pets);
  const havePhones = groupAndCount(user.phones, phones);

  ctx.reply(`Вы: ${user.nick},\nВаш ID: ${user.id}\nНа вашем счету ${user.money},\nВаши дома:\n\t\t${haveHouses},\nВаши машины:\n\t\t${haveCars},\nВаши телефоны:\n\t\t${havePhones},\nВаши бизнесы:\n\t\t${haveBuisness},\nВаши питомцы:\n\t\t${havePets}`);
};
