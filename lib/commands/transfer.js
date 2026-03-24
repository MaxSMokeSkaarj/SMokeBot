import { addMoney } from '../bank.js';

/**
 * @param {BotContext} ctx
 */
export const command = async (ctx) => {
  if (!ctx.reply.account) return 'У ответчика нет аккаунта';
  let count;
  let percent = 0;

  if (ctx.reply) {
    count = Number(ctx.args.slice(1,2)[0]);
  } else {
    count = Number(ctx.args.slice(2,3)[0]);
  }

  if (ctx.account.money - count < 0) return 'Недостаточно средств для транзакции';
  if (count < 0 || typeof(count) !== 'number' || isNaN(count)) return 'Введи число больше 0';
  if (ctx.account.id === ctx.reply.account.id) return 'Нельзя переводить самому себе(какой смысл?)';
  if (count > 10000) percent = 0.05;
  if (count > 1000000) percent = 0.08;

  let tax = Number((count * percent).toFixed(2));

  ctx.account.money -= count + tax;
  ctx.reply.account.money += count;
  addMoney(tax);

  return `${ctx.account.nick}, вы передали ${ctx.reply.account.nick} ${count}`;
};