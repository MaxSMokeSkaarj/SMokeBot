// eslint-disable-next-line no-unused-vars
import { Context as TelegramContext } from 'telegraf';
// eslint-disable-next-line no-unused-vars
import { MessageContext as VKContext } from 'vk-io';
// eslint-disable-next-line no-unused-vars
import { Message as DSContext } from 'discord.js';

import { bank } from '../bank.js';

/**
 * @param { Object } params
 * @param { VKContext | TelegramContext | DSContext } params.ctx
 */

export const command = async ({ctx}) => {

  const isValid = await bank.isValid();
  if (!isValid) return ctx.reply('Банк не валиден!');
  return ctx.reply('Банк валиден!');
};
