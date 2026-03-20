// eslint-disable-next-line no-unused-vars
import { users, UserTemplate } from '../db.js';

/**
 * @param {BotContext} ctx
 */
export const command = async (ctx) => {

  if (!ctx.reply.account) return 'У ответчика нет аккаунта';
  let count;
  if (ctx.reply) {
    count = Number(params.slice(1,2)[0]);
  } else {
    count = Number(params.slice(2,3)[0]);
  }
  if (ctx.account.money - count < 0) return 'Недостаточно средств для транзакции';
  if (count < 0 || typeof(count) !== 'number' || isNaN(count)) return 'Введи число больше 0';
  if (ctx.account.id === ctx.reply.account.id) return 'Нельзя переводить самому себе(какой смысл?)';
  ctx.account.money - count
  ctx.reply.account.money + count
  return `${user.nick}, вы передали ${targetUser.nick} ${count}`;
};