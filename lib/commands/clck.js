import { get } from '../net.js';

/**
 * @param {BotContext} ctx
*/
export const command = async (ctx) => {
  const reqText = ctx.args.join(' ');

  if (!reqText) return 'Введите ссылку в комманду!';
  const res = await get(`https://clck.ru/--?url=${reqText}`);
  return res;
};