// eslint-disable-next-line no-unused-vars
import { Context as TelegramContext } from "telegraf";
// eslint-disable-next-line no-unused-vars
import { MessageContext as VKContext} from "vk-io";
// eslint-disable-next-line no-unused-vars
import { Message as DSContext } from 'discord.js';

import { get } from "../net.js";

/**
 * @param { Object } params
 * @param { VKContext | TelegramContext | DSContext } params.ctx
 * @param { Array<string> } params.params
 */

export const command = async ({ctx,params}) => {
  const reqText = params.slice(1).join(' ');

  if (!reqText) return ctx.reply("Введите ссылку в комманду!");
  const res = await get(`https://clck.ru/--?url=${reqText}`);
  ctx.reply(res);
};