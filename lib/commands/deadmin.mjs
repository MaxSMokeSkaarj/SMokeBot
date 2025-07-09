import { Context as TelegramContext } from "telegraf";
import { MessageContext as VKContext } from "vk-io";

import { users,UserTemplate } from "../db.mjs";

/**
 * @param {Object} params
 * @param {VKContext | TelegramContext} params.ctx
 * @param { UserTemplate } params.user
 * @param { UserTemplate } params.targetUser
 * @param { Array<string> } params.params
 */

export const command = async ({ctx, user, targetUser, params}) => {
  const text = params.slice(1).join(" ");
  
  if (!user.isBotAdmin) return ctx.reply("🚫 Доступ к команде запрещен.");

  if (!targetUser) return ctx.reply("Упомяните или напишите id того, кого вы хотите снять с администратора")
  if (!targetUser.isBotAdmin) return ctx.reply("Не админ")
  users.update(targetUser.id, {isBotAdmin: false})
  ctx.reply(`${targetUser.nick} более не администратор бота`)

};
