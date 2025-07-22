import * as process from 'process';
import { readdir,stat } from 'fs/promises';
import { basename, extname } from 'node:path';
// eslint-disable-next-line no-unused-vars
import { MessageContext as VKContext, VK } from 'vk-io';
import { HearManager } from '@vk-io/hear';

import { users } from './lib/db.js';
import { bot as IHABot } from './lib/IHABot.js';

const vk = new VK({
  token: process.env.VK_GROUP_TOKEN
});

const hearManager = new HearManager();

vk.updates.on('message_new', hearManager.middleware);

console.log('bot running');

const getCommandList = async () => {
  const files = await readdir('lib/commands');
  const commands = files
    .filter((file) => {
      const ext = extname(file);
      return ext === '.js';
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

  const userID = ctx.senderId.toString();

  let user = await users.read(userID);  
  if (!user) user = await users.create(userID);

  const params = ctx.text.split(' ');
  const cmd = params[0].replace(/^\//, '').replace('@smokeofanarchy_bot', '').toLowerCase();

  const isReplyed = ctx.replyMessage ? true : false;
  const targetUserID = isReplyed ? ctx.replyMessage?.senderId.toString() : params[1];
  const targetUser = await users.read(targetUserID);
  
  if (user.isBanned || targetUser?.isBanned) return;
  
  console.log({id: userID, nick: user.nick, text: params.join(' '), targetUserID, targetUser});
  
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
  const userID = ctx.senderId;
  if (userID < 0) return;

  let user = await users.read(userID);
  if (!user) user = await users.create(userID);
  if (user.isBanned) return;

  console.log({id:userID, nick: user.nick, text: ctx.text});
  const textContent = ctx.text.split(' ').slice(1).join(' ').toLowerCase();
  if (ctx.text.startsWith('смоук')) ctx.reply(IHABot(textContent));
});

vk.updates.start().catch(console.error);
