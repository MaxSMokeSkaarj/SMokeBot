import { Context as TelegramContext } from "telegraf"
import { MessageContext as VKContext} from "vk-io"
import { readFile } from 'fs/promises'

import { UserTemplate } from "../db.mjs";

/**@type {Array<JSON>} */
const buisness = JSON.parse(await readFile('json/buisnesses.json'))
/**@type {Array<JSON>} */
const cars = JSON.parse(await readFile('json/cars.json'))
/**@type {Array<JSON>} */
const houses = JSON.parse(await readFile('json/houses.json'))
/**@type {Array<JSON>} */
const pets = JSON.parse(await readFile('json/pets.json'))
/**@type {Array<JSON>} */
const phones = JSON.parse(await readFile('json/phones.json'))

/**
 * @param {Object} params
 * @param {VKContext | TelegramContext} params.ctx
 * @param { UserTemplate } params.user
 */

export const command = async ({ctx, user}) => {
  const haveBuisness = user.buisnesses.map(idx => buisness[idx.id].name).join(',\n\t\t') || 'Нет'
  const haveCars = user.cars.map(idx => cars[idx].name).join(',\n\t\t') || 'Нет'
  const haveHouses = user.houses.map(idx => houses[idx].name).join(',\n\t\t') || 'Нет'
  const havePets = user.pets.map(idx => pets[idx].name).join(',\n\t\t') || 'Нет'
  const havePhones = user.phones.map(idx => phones[idx].name).join(',\n\t\t') || 'Нет'

  ctx.reply(`Вы: ${user.nick},\nВаш ID: ${user.id}\nНа вашем счету ${user.money},\nВаши дома:\n\t\t${haveHouses},\nВаши машины:\n\t\t${haveCars},\nВаши телефоны:\n\t\t${havePhones},\nВаши бизнесы:\n\t\t${haveBuisness},\nВаши питомцы:\n\t\t${havePets}`)
}