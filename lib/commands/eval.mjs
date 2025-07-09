import { Context as TelegramContext } from "telegraf";
import { MessageContext as VKContext } from "vk-io";

import { users, UserTemplate } from "../db.mjs";

/**
 * @param {Object} params
 * @param {VKContext | TelegramContext} params.ctx
 * @param { UserTemplate } params.user
 * @param { Array<string> } params.params
 */

export const command = async ({ ctx, user, params }) => {
  const command = params.slice(1).join(" ");

  if (!user.isBotAdmin) return ctx.reply("Доступ запрещён")
  if (!command) return ctx.reply("введите команду в команду(каламбур :))");

  try {
    const result = eval(command);
    if (typeof result === "string") {
      return ctx.reply(`Type: string\nResult: ${result}`);
    } else if (typeof result === "number") {
      return ctx.reply(`Type: number\nResult: ${result}`);
    } else if (typeof result === "boolean") {
      return ctx.reply(`Type: boolean\nResult: ${result}`);
    } else {return ctx.reply(
        `${typeof result}: ${JSON.stringify(result, null, " \t")}`,
      );}
  } catch (e) {
    console.error(e);
    return ctx.reply(`Error:\n${e.toString()}`);
  }
};
