import { bank } from '../bank.js';

/**
 * @param {import('../types').BotContext} ctx
 */
export const command = async (ctx) => {

  if (ctx.account.workTimeout && new Date(ctx.account.workTimeout) > new Date()) return `Вы уже работали недавно, осталось ${new Date(ctx.account.workTimeout).getMinutes() - new Date().getMinutes()} минут`;

  let rand = Number((Math.random() * (2500 - 100) + 100).toFixed(2));

  const bankBalance = await bank.getBalance();
  if (bankBalance < rand) {
    return 'Банк не может выплатить деньги, попробуйте позже';
  }

  await bank.removeMoney(rand);
  ctx.account.money += rand;

  let date = new Date();
  let currentMinutes = date.getMinutes();
  date.setMinutes(currentMinutes + 10);
  ctx.account.workTimeout = date.toISOString();

  return `${ctx.account.nick}, вы заработали ${rand}, у вас ${ctx.account.money}`;
};