import { Context as TelegramContext } from "telegraf";
import { MessageContext as VKContext} from "vk-io";

import { users, UserTemplate } from "../db.js";

/**
 * @param {Object} params
 * @param {VKContext | TelegramContext} params.ctx
 * @param { UserTemplate } params.user
 * @param { Array<string> } params.params
 */

export const command = async ({ctx,user,params}) => {
  const newNick = params.splice(1).join(" ");

  const regex = /^[a-zA-Zа-яА-ЯёЁ0-9_-\s]{3,20}$/;
  const isNickNormal = regex.test(newNick);
  if (!newNick) return ctx.reply("Введите ник в команду");
  if (!isNickNormal) return ctx.reply("Никнейм может содержать только буквы (a-z, A-Z, а-я, А-Я), цифры (0-9) и дефис/нижнее подчёркивание, длина от 3 до 20 символов.");

  ctx.reply(`${user.nick}, теперь вы ${newNick}`);
  users.update(user.id, {nick: newNick});
};