import crypto from 'crypto';

import { bank } from '../bank.js';

const getRandomInt = (min, max) => {
  // Треугольное распределение: сумма двух равномерных
  const range = max - min + 1;
  const r1 = crypto.randomBytes(4).readUInt32BE(0) / 0xffffffff;
  const r2 = crypto.randomBytes(4).readUInt32BE(0) / 0xffffffff;
  const avg = (r1 + r2) / 2;
  return min + Math.floor(avg * range);
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

  let rand = getRandomInt(1, 20) / 10;

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

  if (rand < 1) {
    ctx.send(`${ctx.account.nick}, Вы проиграли, выпало ${rand}! У вас ${ctx.account.money}`);
  } else if (rand == 1) {
    ctx.send(`${ctx.account.nick}, Вы остались при своём`);
  } else if (rand > 1) {
    ctx.send(`${ctx.account.nick}, Вы выиграли, выпало ${rand}! У вас ${ctx.account.money}`);
  }

  let date = new Date();
  let currentSeconds = date.getSeconds();
  date.setSeconds(currentSeconds + 1);
  ctx.account.jackpotTimeout = date;
};
