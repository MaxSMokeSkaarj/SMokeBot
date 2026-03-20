import * as process from 'process';
import { readdir, stat } from 'fs/promises';
import { basename, extname } from 'node:path';
// eslint-disable-next-line no-unused-vars
import { MessageContext as VKContext, VK } from 'vk-io';
import { HearManager } from '@vk-io/hear';

import { users } from './lib/db.js';
import { bot as IHABot } from './lib/IHABot.js';

const vk = new VK({
  token: process.env.VK_BOT_TOKEN || ''
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
  * @param {VKContext} params.ctx
*/
hearManager.hear(/\/.*/gmi, async (ctx) => {
  if (ctx.senderId < 0) return;

  const userID = ctx.senderId.toString();

  let userAccount = await users.read(userID);  
  if (!userAccount) userAccount = await users.create(userID);

  const inText = ctx.text || '';
  const params = inText.split(' ');
  const cmd = params[0].replace(/^\//, '').replace('@smokeofanarchy_bot', '').toLowerCase();

  const isReplyed = ctx.replyMessage ? true : false;
  const replyedUserID = isReplyed ? ctx.replyMessage?.senderId.toString() : params[1];
  const replyedInText = isReplyed ? ctx.replyMessage?.text : null;
  
  let replyedUserAccount = replyedUserID ? await users.read(replyedUserID) : null;
  if (isReplyed && !replyedUserAccount) replyedUserAccount = await users.create(replyedUserID);
  
  if (userAccount.isBanned || replyedUserAccount?.isBanned) return;
  
  console.log({ id: userID, nick: userAccount.nick, text: params.join(' '), targetUserID: replyedUserID, targetUser: replyedUserAccount?.nick });
  
  const commands = await getCommandList();
  if (!commands.some((command) => command === cmd)) return;

  const modulePath = `./lib/commands/${cmd}.js`;
  const mtime = (await stat(modulePath)).mtime;
  const { command } = await import(`${modulePath}?${mtime}`);

  const originalUserAccount = JSON.stringify(userAccount);
  const originalReplyAccount = replyedUserAccount ? JSON.stringify(replyedUserAccount) : null;

  const context = {
    platform: "vk",
    send: async (text) => await ctx.send(text),
    text: inText,
    cmd: cmd,
    args: params.slice(1),
    account: userAccount,
    reply: {
      text: replyedInText,
      account: replyedUserAccount
    }
  };

  try {
    const response = await command(context);

    if (JSON.stringify(userAccount) !== originalUserAccount) {
      await users.update(userID, userAccount);
    }

    if (replyedUserAccount && JSON.stringify(replyedUserAccount) !== originalReplyAccount) {
      await users.update(replyedUserAccount.id, replyedUserAccount);
    }

    if (response) {
      await ctx.send(response);
    }
  } catch (error) {
    console.error(`Ошибка в команде ${cmd}:`, error);
  }
});

hearManager.hear(/.*/gmi, async (ctx) => {
  const userID = ctx.senderId.toString();
  if (ctx.senderId < 0) return;

  let user = await users.read(userID);
  if (!user) user = await users.create(userID);
  
  if (user.isBanned) return;
  const textContent = ctx.text?.split(' ').slice(1).join(' ').toLowerCase() || '';
  if (ctx.text?.startsWith('смоук')) ctx.send(IHABot(textContent));
});

vk.updates.start().catch(console.error);