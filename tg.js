import * as process from 'process';
import { users } from './lib/db.js';
import { executeCommand } from './lib/command-runner.js';
// eslint-disable-next-line no-unused-vars
import { Context as TGContext, Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TG_BOT_TOKEN);

console.log('bot running');

const ensureUser = async userID => {
  const existing = await users.read(userID);
  if (existing) return existing;

  const created = await users.create(userID);
  return created || users.read(userID);
};

/**
 * @param {TGContext} ctx
 */
bot.command(/.*/gmi, async (ctx) => {
  if (ctx.from.is_bot) return;

  const userID = ctx.from.id.toString();
  const userAccount = await ensureUser(userID);
  if (!userAccount) return;

  const inText = ctx.text;
  const params = inText.split(' ');
  const cmd = params[0].replace(/^\//, '').replace('@smokeofanarchy_bot', '').toLowerCase();

  const isReplyed = Boolean(ctx.update.message.reply_to_message);
  const replyedUserID = isReplyed
    ? ctx.update.message.reply_to_message.from.id.toString()
    : params[1];
  const replyedInText = isReplyed ? ctx.update.message.reply_to_message.text : null;

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
    platform: 'tg',
    send: async (text) => await ctx.reply(text),
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
    await ctx.reply(response);
  }
});

bot.launch();
