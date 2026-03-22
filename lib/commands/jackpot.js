import crypto from 'crypto';

import { bank } from '../bank.js';

function getDriftingMean() {
  const center = 0.95 + Math.random() * 0.10;
  const value  = center + (Math.random() - 0.5) * 0.10;
  return Math.max(0.9, Math.min(1.1, value));
}

function randomWideWithDriftingMean() {
  const mean = getDriftingMean();
  const spread = 1.85;
  let value = mean + (Math.random() - 0.5) * spread;
  return Math.max(0.1, Math.min(2.0, value));
}

console.log("Примеры значений (с плавающей средней):");
for (let i = 0; i < 20; i++) {
  console.log(randomWideWithDriftingMean().toFixed(4));
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
  if (bet <= 1) return `${ctx.account.nick}, ставка не может быть ниже 1!`;
  if ((ctx.account.money - bet) < 0) return `${ctx.account.nick}, не хватает денег!`;

  let rand = randomWideWithDriftingMean().toFixed(2);

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
