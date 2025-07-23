// eslint-disable-next-line no-unused-vars
import { Context as TelegramContext } from 'telegraf';
// eslint-disable-next-line no-unused-vars
import { MessageContext as VKContext } from 'vk-io';
// eslint-disable-next-line no-unused-vars
import { Message as DSContext } from 'discord.js';
import crypto from 'crypto';

// eslint-disable-next-line no-unused-vars
import { users, UserTemplate } from '../db.js';

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

  //if (user.jackpotTimeout && new Date(user.jackpotTimeout) > new Date()) return ctx.reply('Притормози немного');
	
  //let date = new Date();
  //let currentSeconds = date.getSeconds();
  //date.setSeconds(currentSeconds + 10);

  let bet = (params.slice(1).join(' ')).toLowerCase();
  
  if (bet == 'всё' || bet == 'все' || bet == 'all') {
    bet = user.money;
  }

  let cmb = user.money - Number(bet);
  if (!bet || isNaN(bet)) return ctx.reply(`${user.nick}, сделайте ставку`);
  if (bet <= 0) return ctx.reply(`${user.nick}, ставка не может быть ниже 0!`);
  if (cmb < 0) return ctx.reply(`${user.nick}, не хватает денег!`);
  user.money -= bet;
  let rand = getRandomInt(1, 20);

  if (rand < 10) {
    user.money += Math.floor(bet * (rand / 10));
    ctx.reply(`${user.nick}, Вы проиграли, выпало ${rand / 10}! У вас ${user.money}`);
  } else if (rand == 10) {
    user.money += bet * (rand / 10);
    ctx.reply(`${user.nick}, Вы остались при своём`);
  } else if (rand > 10) {
    user.money += Math.floor(bet * (rand / 10));
    ctx.reply(`${user.nick}, Вы выиграли, выпало ${rand / 10}! У вас ${user.money}`);
  } else {
    ctx.reply(
      `${user.nick}, произошел сбой. Ваша ставка будет вам возвращена.`,
    );
    user.money += bet;
  }
  user.money = Math.floor(user.money);
  //users.update(user.id, {money: user.money, jackpotTimeout: date});
  users.update(user.id, { money: user.money });
};
