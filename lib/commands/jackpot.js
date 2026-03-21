import crypto from 'crypto';

import { bank } from '../bank.js';

const WEIGHT_MAP = {
  0.1: 0.06, 0.2: 0.06, 0.3: 0.06, 0.4: 0.06, 0.5: 0.06,
  0.6: 0.05, 0.7: 0.05, 0.8: 0.05, 0.9: 0.05, 1.0: 0.05,
  1.1: 0.05, 1.2: 0.05, 1.3: 0.05, 1.4: 0.05, 1.5: 0.05,
  1.6: 0.04, 1.7: 0.04, 1.8: 0.04, 1.9: 0.04, 2.0: 0.04
};

/**
 * Получить случайное число на основе весов
 */
function getRandomByWeight(map) {
  const r = Math.random();
  let cumulative = 0;

  for (const [value, weight] of Object.entries(map)) {
    cumulative += weight;
    if (r <= cumulative) return parseFloat(value);
  }

  return 2.0; // На случай погрешности округления
}

/**
 * @param {BotContext} ctx
*/
export const command = async (ctx) => {

  if (ctx.account.jackpotTimeout && new Date(ctx.account.jackpotTimeout) > new Date()) return 'Притормози немного';
	
  let bet = ctx.args.join(' ').toLowerCase();
  
  if (bet == 'всё' || bet == 'все' || bet == 'all') {
    bet = Number(ctx.account.money.toFixed(2));
  } else {
    bet = Number(Number(bet).toFixed(2));
  }
  if (!bet || isNaN(bet)) `${ctx.account.nick}, сделайте ставку`;
  if (bet <= 0) return `${ctx.account.nick}, ставка не может быть ниже 0!`;
  if ((ctx.account.money - bet) < 0) return `${ctx.account.nick}, не хватает денег!`;

  let rand = getRandomByWeight(WEIGHT_MAP);

  ctx.account.money -= bet;
  await bank.addMoney(bet);

  const winnings = bet * rand;
  const bankMoney = await bank.getBalance();
  if (bankMoney < winnings) {
    ctx.account.money += bet;
    await bank.removeMoney(bet);
    return ctx.reply(`${ctx.account.nick}, банк не может выплатить выигрыш, попробуйте позже`);
  }

  ctx.account.money += winnings;
  await bank.removeMoney(winnings);

  let date = new Date();
  let currentSeconds = date.getSeconds();
  date.setSeconds(currentSeconds + 1);
  ctx.account.jackpotTimeout = date;

  if (rand < 1) {
    return `${ctx.account.nick}, Вы проиграли, выпало ${rand}! У вас ${ctx.account.money}`;
  } else if (rand == 1) {
    return `${ctx.account.nick}, Вы остались при своём`;
  } else if (rand > 1) {
    return `${ctx.account.nick}, Вы выиграли, выпало ${rand}! У вас ${ctx.account.money}`;
  }


};
