import { Context as TelegramContext } from "telegraf";

import { MessageContext as VKContext} from "vk-io";
import { readFile } from 'fs/promises';

import { UserTemplate } from "../db.js";

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
 * @param {Object} params
 * @param {VKContext | TelegramContext} params.ctx
 * @param { UserTemplate } params.targetUser
 */

export const command = async ({ctx, targetUser}) => {
  if (!targetUser) return ctx.reply("Укажите id или упомяните игрока");
  const haveBuisness = targetUser.buisnesses?.map(idx => buisness[idx.id].name).join(',\n\t\t') || 'Нет';
  const haveCars = targetUser.cars.map(idx => cars[idx].name).join(',\n\t\t') || 'Нет';
  const haveHouses = targetUser.houses.map(idx => houses[idx].name).join(',\n\t\t') || 'Нет';
  const havePets = targetUser.pets.map(idx => pets[idx].name).join(',\n\t\t') || 'Нет';
  const havePhones = targetUser.phones.map(idx => phones[idx].name).join(',\n\t\t') || 'Нет';

  ctx.reply(`Игрок: ${targetUser.nick},\nЕго ID: ${targetUser.id}\nНа его счету ${targetUser.money},\nЕго дома:\n\t\t${haveHouses},\nЕго машины:\n\t\t${haveCars},\nЕго телефоны:\n\t\t${havePhones},\nЕго бизнесы:\n\t\t${haveBuisness},\nЕго питомцы:\n\t\t${havePets}`);
};
