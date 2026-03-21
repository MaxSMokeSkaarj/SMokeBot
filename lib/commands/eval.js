// eslint-disable-next-line no-unused-vars
import { UserTemplate, users } from '../db.js';
// eslint-disable-next-line no-unused-vars
import { bank } from '../bank.js';

/**
 * @param {BotContext} ctx
*/
export const command = async (ctx) => {
  const command = ctx.args.join(' ');

  if (!ctx.account.isBotAdmin) return 'Доступ запрещён';
  if (!command) return 'введите команду в команду(каламбур :))';

  try {
    const result = eval(command);
    if (typeof result === 'string') {
      return `Type: string\nResult: ${result}`;
    } else if (typeof result === 'number') {
      return `Type: number\nResult: ${result}`;
    } else if (typeof result === 'boolean') {
      return `Type: boolean\nResult: ${result}`;
    } else {
      return `${typeof result}: ${JSON.stringify(result, null, ' \t')}`;
    }
  } catch (e) {
    console.error(e);
    return `Error:\n${e.toString()}`;
  }
};
