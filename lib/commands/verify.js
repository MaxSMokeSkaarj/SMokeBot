import { bank } from '../bank.js';

/**
 * @param {BotContext} ctx
 */
export const command = async (ctx) => {

  const isValid = await bank.isValid();
  if (!isValid) return ctx.reply('Банк не валиден!');
  return ctx.reply('Банк валиден!');
};
