// eslint-disable-next-line no-unused-vars
import { Context as TelegramContext } from "telegraf";
// eslint-disable-next-line no-unused-vars
import { MessageContext as VKContext } from "vk-io";
// eslint-disable-next-line no-unused-vars
import { Message as DSContext } from 'discord.js';

// eslint-disable-next-line no-unused-vars
import { UserTemplate } from "../db.js";

/**
 * @param { Object } params
 * @param { VKContext | TelegramContext | DSContext } params.ctx
 * @param { UserTemplate } params.user
 * @param { Array<string> } params.params
 */

export const command = async ({ ctx, user, params }) => {
  const command = params.slice(1).join(" ");

  if (!user.isBotAdmin) return ctx.reply("Доступ запрещён");
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
