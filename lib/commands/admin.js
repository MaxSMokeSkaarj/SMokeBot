import { Context as TelegramContext } from "telegraf";
import { MessageContext as VKContext } from "vk-io";

import { users,UserTemplate } from "../db.js";

/**
 * @param {Object} params
 * @param { VKContext | TelegramContext } params.ctx
 * @param { UserTemplate } params.user
 * @param { UserTemplate } params.targetUser
 */

export const command = async ({ctx, user,targetUser}) => {

  if (!user.isBotAdmin) return ctx.reply("🚫 Доступ к команде запрещен.");

  if (!targetUser) return ctx.reply("Упомяните или напишите id того, кого вы хотите назначить на администратора");
  if (targetUser.isBotAdmin) return ctx.reply("Уже админ");
  users.update(targetUser.id, {isBotAdmin: true});
  ctx.reply(`${targetUser.nick} теперь администратор бота`);

};
