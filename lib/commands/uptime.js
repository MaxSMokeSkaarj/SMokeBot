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
  ctx.reply('TEST!!!');
};