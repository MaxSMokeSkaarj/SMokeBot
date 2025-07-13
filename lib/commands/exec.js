import { exec } from "child_process";
import { Context as TelegramContext } from "telegraf";
import { MessageContext as VKContext } from "vk-io";

import { UserTemplate } from "../db.js";

/*
await new Promise((res, rej) =>
  exec("chcp 65001", (error) => error ? rej(error) : res())
);
*/

/**
 * @param {Object} params
 * @param {VKContext | TelegramContext} params.ctx
 * @param { UserTemplate } params.user
 * @param { Array<string> } params.params
 */

export const command = async ({ ctx, user, params }) => {
  const command = params.slice(1).join(" ");

  if (!user.isBotAdmin) return ctx.reply("Доступ запрещён");
  if (!command) return ctx.reply("введите команду в команду(каламбур :))");

  exec(command, { encoding: "utf8" }, (error, stdout, stderr) => {
    if (error) {
      ctx.reply(`exec error:\n ${error}`);
      console.error(error);
      return;
    }
    if (stdout) ctx.reply(`stdout:\n ${stdout}`);
    if (stderr) ctx.reply(`stderr:\n ${stderr}`);
  });
};
