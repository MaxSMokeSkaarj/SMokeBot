import * as process from 'process';
import { users } from './lib/db.js';
import { executeCommand } from './lib/command-runner.js';
// eslint-disable-next-line no-unused-vars
import { MessageContext as VKContext, VK } from 'vk-io';
import { HearManager } from '@vk-io/hear';

const vk = new VK({
  token: process.env.VK_BOT_TOKEN || ''
});

const hearManager = new HearManager();

vk.updates.on('message_new', hearManager.middleware);

console.log('bot running');

const ensureUser = async userID => {
  const existing = await users.read(userID);
  if (existing) return existing;

  const created = await users.create(userID);
  return created || users.read(userID);
};

/**
 * @param {VKContext} params.ctx
 */
hearManager.hear(/\/.*/gmi, async (ctx) => {
  if (ctx.senderId < 0) return;

  const userID = ctx.senderId.toString();
  const userAccount = await ensureUser(userID);
  if (!userAccount) return;

  const inText = ctx.text || '';
  const params = inText.split(' ');
  const cmd = params[0].replace(/^\//, '').replace('@smokeofanarchy_bot', '').toLowerCase();

  const isReplyed = Boolean(ctx.replyMessage);
  const replyedUserID = isReplyed ? ctx.replyMessage.senderId.toString() : params[1];
  const replyedInText = isReplyed ? ctx.replyMessage.text : null;

  let replyedUserAccount = replyedUserID ? await users.read(replyedUserID) : null;
  if (isReplyed && !replyedUserAccount) {
    const created = await users.create(replyedUserID);
    replyedUserAccount = created || await users.read(replyedUserID);
  }

  if (userAccount.isBanned || replyedUserAccount?.isBanned) return;

  console.log({
    id: userID,
    nick: userAccount.nick,
    text: params.join(' '),
    targetUserID: replyedUserID,
    targetUser: replyedUserAccount?.nick
  });

  const context = {
    platform: 'vk',
    send: async (text) => await ctx.send(text),
    text: inText,
    cmd,
    args: params.slice(1),
    account: userAccount,
    reply: {
      text: replyedInText,
      account: replyedUserAccount
    }
  };

  const response = await executeCommand(context);

  if (response) {
    await ctx.send(response);
  }
});

vk.updates.start().catch(console.error);
