import { bank } from '../bank.js';

/**
 * @param {BotContext} ctx
 */
export const command = async (ctx) => {

  const isValid = await bank.isValid();
  if (!isValid) return 'Банк не валиден!';
  return 'Банк валиден!';
};
