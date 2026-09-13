import { Client, GatewayIntentBits, Message as DSContext } from 'discord.js';

import { users } from './lib/db.js';
import { executeCommand } from './lib/command-runner.js';

console.log('bot running');

const PREFIX = '/';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const ensureUser = async userID => {
  const existing = await users.read(userID);
  if (existing) return existing;

  const created = await users.create(userID);
  return created || users.read(userID);
};

/**
 * @param {DSContext} ctx
 */
client.on('messageCreate', async (ctx) => {
  if (ctx.author.bot || !ctx.content.startsWith(PREFIX)) return;

  const userID = ctx.author.id;
  const userAccount = await ensureUser(userID);
  if (!userAccount) return;

  const inText = ctx.content;
  const params = inText.split(' ');
  const cmd = params[0].replace(/^\//, '').replace('@smokeofanarchy_bot', '').toLowerCase();

  const isReplyed = Boolean(ctx.reference?.messageId);
  const replyMessage = isReplyed
    ? await ctx.channel.messages.fetch(ctx.reference.messageId)
    : null;
  const replyedUserID = isReplyed ? replyMessage.author.id : params[1];
  const replyedInText = isReplyed ? replyMessage.content : null;

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
    platform: 'ds',
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

client.login(process.env.DS_BOT_TOKEN).catch((e) => {
  console.error('Failed to login to Discord:', e);
  process.exit(1);
});
