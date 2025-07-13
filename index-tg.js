import * as process from 'process';
import { readdir,stat } from "fs/promises";
import { basename, extname } from "node:path";
import { Context as TGContext, Telegraf } from "telegraf";

import { users } from "./lib/db.js";
import { bot as IHABot } from "./lib/IHABot.js";

const bot = new Telegraf(process.env.TG_BOT_TOKEN);

console.log("bot running");



const getCommandList = async () => {
  const files = await readdir("lib/commands");
  const commands = files
    .filter((file) => {
      const ext = extname(file);
      return ext === ".mjs";
    })
    .map((file) => {
      const ext = extname(file);
      return basename(file, ext);
    });

  return commands;
};

/**
 * @param {TGContext} ctx
 */

bot.command(/.*/gmi, async (ctx) => {
  if (ctx.from.is_bot) return;
  const userID = Number(ctx.from.id);
  let user = await users.read(userID);
  
  if (!user) user = await users.create(userID);
  
  const params = ctx.text.replace(/^\//, "").replace('@smokeofanarchy_bot', '').split(' ');
  const cmd = params[0];

  const isReplyed = ctx.update.message.reply_to_message ? true : false;

  const targetUserID = isReplyed ? Number(ctx.update.message.reply_to_message?.from.id) : Number(params[1]);
  const targetUser = !isNaN(targetUserID) ? await users.read(targetUserID) : null;
  
  console.log({id: userID, nick: user.nick, text: params.join(' '), targetUserID, targetUser});
  
  if (user.isBanned || targetUser?.isBanned) return;

  const commands = await getCommandList();

  if (!commands.some((command) => command === cmd)) return;

  const modulePath = `./lib/commands/${cmd}.js`;
  const mtime = (await stat(modulePath)).mtime;
  const { command } = await import(`${modulePath}?${mtime}`);
  command({ctx,user,targetUser,params,isReplyed});
});

/**
 * @param {TGContext} ctx
 */

bot.hears(/.*/gmi, async (ctx) => {
  const id = Number(ctx.from.id);
  let user = await users.read(id);
  if (!user) user = await users.create(id);
  console.log({id, nick: user.nick, text: ctx.text});
  if (user.isBanned) return;
  const textContent = ctx.text.split(" ").slice(1).join(" ").toLowerCase();
  if (ctx.text.startsWith("смоук")) ctx.reply(IHABot(textContent));
});

bot.launch();
