import * as process from 'process';
import { readdir, stat } from 'fs/promises';
import { basename, extname } from 'node:path';
// eslint-disable-next-line no-unused-vars
import { Context as TGContext, Telegraf } from 'telegraf';

import { users } from './lib/db.js';
import { bot as IHABot } from './lib/IHABot.js';

const bot = new Telegraf(process.env.TG_BOT_TOKEN);

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
 * @param {TGContext} ctx
*/
bot.command(/.*/gmi, async (ctx) => {
  if (ctx.from.is_bot) return;

  const userID = ctx.from.id.toString();

  let userAccount = await users.read(userID);  
  if (!userAccount) userAccount = await users.create(userID);

  const inText = ctx.text;
  const params = inText.split(' ');
  const cmd = params[0].replace(/^\//, '').replace('@smokeofanarchy_bot', '').toLowerCase();

  const isReplyed = ctx.update.message.reply_to_message ? true : false;
  const replyedUserID = isReplyed ? ctx.update.message.reply_to_message.from.id.toString() : params[1];
  const replyedInText = isReplyed ? ctx.update.message.reply_to_message.text : null;
  
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
    platform: "tg",
    send: async (text) => await ctx.reply(text),
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
      await ctx.reply(response);
    }
  } catch (error) {
    console.error(`Ошибка в команде ${cmd}:`, error);
  }
});

/**
 * @param {TGContext} ctx
 */
bot.hears(/.*/gmi, async (ctx) => {
  if (ctx.from.is_bot) return;
  
  const userID = ctx.from.id.toString();

  let user = await users.read(userID);
  if (!user) user = await users.create(userID);

  if (user.isBanned) return;
  const textContent = ctx.text.split(' ').slice(1).join(' ').toLowerCase();
  if (ctx.text.startsWith('смоук')) ctx.reply(IHABot(textContent));
});

bot.launch();