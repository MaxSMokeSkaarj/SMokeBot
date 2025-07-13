import { Context as TelegramContext } from "telegraf";
import { MessageContext as VKContext } from "vk-io";
import { get } from "../net.js";



/**
 * @param {Object} params
 * @param {VKContext | TelegramContext} params.ctx
 * @param { Array<string> } params.params
 */

export const command = async ({ctx, params}) => {
  const text = params.slice(1).join(" ");

  if (!text) return ctx.reply("Напишите, что бы вы хотели найти на вики");
  
  const resp = JSON.parse(await get(`https://ru.wikipedia.org/w/api.php?action=opensearch&search=${encodeURI(text)}`));

  console.log(resp);

  if (resp[3].length === 0) return ctx.reply("Информации о вашем запросе не было найдено на странице Wikipedia");

  ctx.reply(`Информация о ${resp[0]}: ${resp[3][0]}`);
};
