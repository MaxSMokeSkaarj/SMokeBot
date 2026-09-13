import { bank } from '../bank.js';

/**
 * @param {import('../types').BotContext} ctx
 */
export const command = async (ctx) => {

  if (ctx.account.workTimeout && new Date(ctx.account.workTimeout) > new Date()) return `Вы уже работали недавно, осталось ${new Date(ctx.account.workTimeout).getMinutes() - new Date().getMinutes()} минут`;

  const rand = Number((Math.random() * (2500 - 100) + 100).toFixed(2));

  if (!await bank.tryRemoveMoney(rand)) {
    return 'Банк не может выплатить деньги, попробуйте позже';
  }

  ctx.account.money += rand;

  const date = new Date();
  date.setMinutes(date.getMinutes() + 10);
  ctx.account.workTimeout = date.toISOString();

  return `${ctx.account.nick}, вы заработали ${rand}, у вас ${ctx.account.money}`;
};
