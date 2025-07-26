// eslint-disable-next-line no-unused-vars
import { Context as TelegramContext } from 'telegraf';
// eslint-disable-next-line no-unused-vars
import { MessageContext as VKContext } from 'vk-io';
// eslint-disable-next-line no-unused-vars
import { Message as DSContext } from 'discord.js';
import crypto from 'crypto';

// eslint-disable-next-line no-unused-vars
import { users, UserTemplate } from '../db.js';
import { bank } from '../bank.js';

function getRandomInt(min, max) {
  // Треугольное распределение: сумма двух равномерных
  const range = max - min + 1;
  const r1 = crypto.randomBytes(4).readUInt32BE(0) / 0xffffffff;
  const r2 = crypto.randomBytes(4).readUInt32BE(0) / 0xffffffff;
  const avg = (r1 + r2) / 2;
  return min + Math.floor(avg * range);
}

/**
 * @param { Object } params
 * @param { VKContext | TelegramContext | DSContext } params.ctx
 * @param { UserTemplate } params.user
 * @param { Array<string> } params.params
 */
export const command = async ({ctx, user, params}) => {

  if (user.jackpotTimeout && new Date(user.jackpotTimeout) > new Date()) return ctx.reply('Притормози немного');
	
  let bet = params.slice(1).join(' ').toLowerCase();
  
  if (bet == 'всё' || bet == 'все' || bet == 'all') {
    bet = Number(user.money.toFixed(2));
  } else {
    bet = Number(Number(bet).toFixed(2));
  }

  if (!bet || isNaN(bet)) return ctx.reply(`${user.nick}, сделайте ставку`);
  if (bet <= 0) return ctx.reply(`${user.nick}, ставка не может быть ниже 0!`);
  if ((user.money - bet) < 0) return ctx.reply(`${user.nick}, не хватает денег!`);

  let rand = getRandomInt(1, 20) / 10;

  user.money -= bet;
  await users.update(user.id, {money: user.money});
  await bank.addMoney(bet);

  const winnings = bet * rand;
  const bankMoney = await bank.getBalance();
  if (bankMoney < winnings) {
    user.money += bet;
    await users.update(user.id, {money: user.money});
    await bank.removeMoney(bet);
    return ctx.reply(`${user.nick}, банк не может выплатить выигрыш, попробуйте позже`);
  }

  user.money += winnings;
  await bank.removeMoney(winnings);

  if (rand < 1) {
    ctx.reply(`${user.nick}, Вы проиграли, выпало ${rand}! У вас ${user.money}`);
  } else if (rand == 1) {
    ctx.reply(`${user.nick}, Вы остались при своём`);
  } else if (rand > 1) {
    ctx.reply(`${user.nick}, Вы выиграли, выпало ${rand}! У вас ${user.money}`);
  }

  let date = new Date();
  let currentSeconds = date.getSeconds();
  date.setSeconds(currentSeconds + 1);

  await users.update(user.id, {money: user.money, jackpotTimeout: date});
  //users.update(user.id, { money: user.money });
};
