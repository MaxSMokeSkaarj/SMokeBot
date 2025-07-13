import { Context as TelegramContext } from "telegraf";
import { MessageContext as VKContext} from "vk-io";

import { users, UserTemplate } from "../db.js";

/**
 * @param {Object} params
 * @param {VKContext | TelegramContext} params.ctx
 * @param { UserTemplate } params.user
 * @param { UserTemplate } params.targetUser
 * @param { Array<string> } params.params
 * @param { boolean } params.isReplyed
 */

export const command = async ({ctx, user, params, targetUser, isReplyed}) => {

  if (!targetUser) return ctx.reply("У ответчика нет аккаунта");
  let count;
  if (isReplyed) {
    count = Number(params.slice(1,2)[0]);
  } else {
    count = Number(params.slice(2,3)[0]);
  }
  if (user.money - count < 0) return ctx.reply("Недостаточно средств для транзакции");
  if (count < 0 || typeof(count) !== 'number' || isNaN(count)) return ctx.reply("Введи число больше 0");
  if (user.id === targetUser.id) return ctx.reply("Нельзя переводить самому себе(какой смысл?)");
  await users.update(user.id, {money: user.money - count});
  await users.update(targetUser.id, {money: targetUser.money + count});
  ctx.reply(`${user.nick}, вы передали ${targetUser.nick} ${count}`);
};