import { Context as TelegramContext } from "telegraf";
import { MessageContext as VKContext} from "vk-io";
import { get } from "../net.js";

/**
 * @param {Object} params
 * @param {VKContext | TelegramContext} params.ctx
 * @param { Array<string> } params.params
 */

export const command = async ({ctx,params}) => {
  const reqText = params.slice(1).join(' ');

  if (!reqText) return ctx.reply("Введите ссылку в комманду!");
  const res = await get(`https://clck.ru/--?url=${reqText}`);
  ctx.reply(res);
};