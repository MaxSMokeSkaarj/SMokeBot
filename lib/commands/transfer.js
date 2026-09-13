import { bank } from '../bank.js';

/**
 * @param {import('../types').BotContext} ctx
 */
export const command = async (ctx) => {
  if (!ctx.reply?.account) return 'Укажите пользователя для перевода';

  const count = Number(ctx.args.slice(1, 2)[0]);

  if (count <= 0 || !Number.isFinite(count)) return 'Введи число больше 0';
  if (ctx.account.id === ctx.reply.account.id) return 'Нельзя переводить самому себе(какой смысл?)';

  let percent = 0;
  if (count >= 10000) percent = 0.01;
  if (count >= 1000000) percent = 0.03;
  const tax = Number((count * percent).toFixed(2));
  const total = count + tax;

  if (ctx.account.money < total) return 'Недостаточно средств для транзакции';

  ctx.account.money -= total;
  ctx.reply.account.money += count;
  await bank.addMoney(tax);

  return `${ctx.account.nick}, вы передали ${ctx.reply.account.nick} ${count}`;
};
