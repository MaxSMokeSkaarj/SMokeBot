// eslint-disable-next-line no-unused-vars
import { Context as TelegramContext } from 'telegraf';
// eslint-disable-next-line no-unused-vars
import { MessageContext as VKContext} from 'vk-io';
// eslint-disable-next-line no-unused-vars
import { Message as DSContext } from 'discord.js';

/**
 * @param { Object } params
 * @param { VKContext | TelegramContext | DSContext } params.ctx
 */

export const command = ({ctx}) => {
  let rand = Math.floor(Math.random() * (6 - 1) + 1);
  ctx.reply(`Выпало ${rand}`);
};