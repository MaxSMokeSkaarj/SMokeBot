// eslint-disable-next-line no-unused-vars
import { Context as TelegramContext } from 'telegraf';
// eslint-disable-next-line no-unused-vars
import { MessageContext as VKContext} from 'vk-io';
// eslint-disable-next-line no-unused-vars
import { Message as DSContext } from 'discord.js';

import { readFile } from 'fs/promises';

// eslint-disable-next-line no-unused-vars
import { UserTemplate } from '../db.js';

/**@type { Array<JSON> } */
const buisness = JSON.parse(await readFile('storage/json/buisnesses.json'));
/**@type { Array<JSON> } */
const cars = JSON.parse(await readFile('storage/json/cars.json'));
/**@type { Array<JSON> } */
const houses = JSON.parse(await readFile('storage/json/houses.json'));
/**@type { Array<JSON> } */
const pets = JSON.parse(await readFile('storage/json/pets.json'));
/**@type { Array<JSON> } */
const phones = JSON.parse(await readFile('storage/json/phones.json'));

/**
 * @param { Object } params
 * @param { VKContext | TelegramContext | DSContext } params.ctx
 * @param { UserTemplate } params.targetUser
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

export const command = async ({ctx, targetUser}) => {
  const haveBuisness = groupAndCount(targetUser.buisnesses, buisness, (x) => x.id);
  const haveCars = groupAndCount(targetUser.cars, cars);
  const haveHouses = groupAndCount(targetUser.houses, houses);
  const havePets = groupAndCount(targetUser.pets, pets);
  const havePhones = groupAndCount(targetUser.phones, phones);

  ctx.reply(`Игрок: ${targetUser.nick},\nЕго ID: ${targetUser.id}\nНа его счету ${targetUser.money},\nЕго дома:\n\t\t${haveHouses},\nЕго машины:\n\t\t${haveCars},\nЕго телефоны:\n\t\t${havePhones},\nЕго бизнесы:\n\t\t${haveBuisness},\nЕго питомцы:\n\t\t${havePets}`);
};
