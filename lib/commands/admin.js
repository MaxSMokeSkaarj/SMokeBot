// eslint-disable-next-line no-unused-vars
import { Context as TelegramContext } from "telegraf";
// eslint-disable-next-line no-unused-vars
import { MessageContext as VKContext } from "vk-io";
// eslint-disable-next-line no-unused-vars
import { Message as DSContext } from 'discord.js';

// eslint-disable-next-line no-unused-vars
import { users,UserTemplate } from "../db.js";

/**
 * @param { Object } params
 * @param { VKContext | TelegramContext | DSContext } params.ctx
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
