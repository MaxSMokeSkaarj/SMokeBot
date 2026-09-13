import { bank } from '../bank.js';

function getDriftingMean() {
  const center = 0.95 + Math.random() * 0.10;
  const value  = center + (Math.random() - 0.5) * 0.10;
  return Math.max(0.9, Math.min(1.1, value));
}

function randomWideWithDriftingMean() {
  const mean = getDriftingMean();
  const spread = 1.85;
  const value = mean + (Math.random() - 0.5) * spread;
  return Math.max(0.1, Math.min(2.0, value));
}

/**
 * @param {import('../types').BotContext} ctx
*/
export const command = async (ctx) => {

  if (ctx.account.jackpotTimeout && new Date(ctx.account.jackpotTimeout) > new Date()) return 'Притормози немного';

  let bet = ctx.args.join(' ').toLowerCase();

  if (bet == 'всё' || bet == 'все' || bet == 'all') {
    bet = Number(ctx.account.money.toFixed(2));
  } else {
    bet = Number(Number(bet).toFixed(2));
  }
  if (!bet || isNaN(bet)) return `${ctx.account.nick}, сделайте ставку`;
  if (bet <= 1) return `${ctx.account.nick}, ставка не может быть ниже 1!`;
  if ((ctx.account.money - bet) < 0) return `${ctx.account.nick}, не хватает денег!`;

  const rand = Number(randomWideWithDriftingMean().toFixed(2));

  ctx.account.money -= bet;
  await bank.addMoney(bet);

  const winnings = bet * rand;
  if (await bank.tryRemoveMoney(winnings)) {
    ctx.account.money += winnings;
  } else {
    await bank.tryRemoveMoney(bet);
    ctx.account.money += bet;
    return `${ctx.account.nick}, банк не может выплатить выигрыш, попробуйте позже`;
  }

  const date = new Date();
  date.setSeconds(date.getSeconds() + 1);
  ctx.account.jackpotTimeout = date;

  if (rand < 1) {
    return `${ctx.account.nick}, Вы проиграли, выпало ${rand}! У вас ${ctx.account.money}`;
  } else if (rand == 1) {
    return `${ctx.account.nick}, Вы остались при своём`;
  } else if (rand > 1) {
    return `${ctx.account.nick}, Вы выиграли, выпало ${rand}! У вас ${ctx.account.money}`;
  }
};
