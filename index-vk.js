import * as process from 'process';
import { readdir,stat } from "fs/promises";
import { basename, extname } from "node:path";
// eslint-disable-next-line no-unused-vars
import { MessageContext as VKContext, VK } from 'vk-io';
import { HearManager } from "@vk-io/hear";

import { users } from "./lib/db.js";
import { bot as IHABot } from "./lib/IHABot.js";

const vk = new VK({
  token: process.env.VK_GROUP_TOKEN
});

const hearManager = new HearManager();

vk.updates.on('message_new', hearManager.middleware);

console.log("bot running");

const getCommandList = async () => {
  const files = await readdir("lib/commands");
  const commands = files
    .filter((file) => {
      const ext = extname(file);
      return ext === ".js";
    })
    .map((file) => {
      const ext = extname(file);
      return basename(file, ext);
    });

  return commands;
};

/**
 * @param {VKContext} ctx
**/

hearManager.hear(/\/.*/gmi, async (ctx) => {
  if (ctx.senderId < 0) return;
  const userID = Number(ctx.senderId);
  let user = await users.read(userID);
  
  if (!user) user = await users.create(userID);
  
  const params = ctx.text.replace(/^\//, "").replace('@smokeofanarchy_bot', '').split(' ');
  const cmd = params[0];

  const isReplyed = ctx.replyMessage ? true : false;

  const targetUserID = isReplyed ? Number(ctx.replyMessage?.senderId) : Number(params[1]);
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
 * @param {VKContext} ctx
**/

hearManager.hear(/.*/gmi, async (ctx) => {
  const id = ctx.senderId;
  if (id < 0) return;
  let user = await users.read(id);
  if (!user) user = await users.create(id);
  if (user.isBanned) return;
  console.log({id, nick: user.nick, text: ctx.text});
  const textContent = ctx.text.split(" ").slice(1).join(" ").toLowerCase();
  if (ctx.text.startsWith("смоук")) ctx.reply(IHABot(textContent));
});

vk.updates.start().catch(console.error);
