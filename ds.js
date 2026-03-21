import { readdir, stat } from 'fs/promises';
import { basename, extname } from 'node:path';
// eslint-disable-next-line no-unused-vars
import { Client, GatewayIntentBits, Message as DSContext } from 'discord.js';

import { users } from './lib/db.js';

console.log('bot running');

const PREFIX = '/';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

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
 * @param {DSContext} params.ctx
*/
client.on('messageCreate', async (ctx) => {
  if (ctx.author.bot) return;

  // Получаем ID пользователя и его аккаунт из базы данных (или создаем новый, если его нет)
  const userID = ctx.author.id;
  let userAccount = await users.read(userID);
  if (!userAccount) userAccount = await users.create(userID);

  // Получаем текст команды и аргументы
  const inText = ctx.content;
  const params = inText.split(' ');
  const cmd = params[0].replace(/^\//, '').replace('@smokeofanarchy_bot', '').toLowerCase();

  // Получаем пользователя, на которого отвечает команда (если это ответ на сообщение)
  const isReplyed = (ctx.reference && ctx.reference.messageId) ? true : false;
  const replyedUserID = isReplyed ? ((await ctx.channel.messages.fetch(ctx.reference.messageId)).author.id) : params[1];
  const replyedInText = isReplyed ? (await ctx.channel.messages.fetch(ctx.reference.messageId)).content : null;
  let replyedUserAccount = await users.read(replyedUserID);
  if (isReplyed && !replyedUserAccount) replyedUserAccount = await users.create(replyedUserID);

  // не обрабатываем команды от забаненных пользователей или если цель команды - забаненный пользователь
  if (userAccount.isBanned || replyedUserAccount?.isBanned) return;

  // Логируем информацию о команде для отладки
  console.log({ id: userID, nick: userAccount.nick, text: params.join(' '), targetUserID: replyedUserID, targetUser: replyedUserAccount?.nick })

  // Проверяем, начинается ли сообщение с префикса команды
  if (inText.startsWith(PREFIX)) {
    // Получаем список доступных команд и проверяем, существует ли запрошенная команда
    const commands = await getCommandList();
    if (!commands.some((command) => command === cmd)) return;

    // Загружаем модуль команды и выполняем ее
    const modulePath = `./lib/commands/${cmd}.js`;
    const mtime = (await stat(modulePath)).mtime;
    const { command } = await import(`${modulePath}?${mtime}`);

    const originalUserAccount = JSON.stringify(userAccount);

    const context = {
      "platform": "ds",
      "text": inText,
      "cmd": cmd,
      "args": params.slice(1),
      "account": userAccount,
      "reply": {
        "text": replyedInText,
        "account": replyedUserAccount
      }
    }

    const responce = await command(context);

    // Если команда изменила аккаунт пользователя, сохраняем изменения в базе данных
    if (JSON.stringify(userAccount) !== originalUserAccount) {
      await users.update(userID, userAccount);
    }

    // Если команда изменила аккаунт пользователя, на которого отвечает, сохраняем изменения в базе данных
    if (replyedUserAccount && JSON.stringify(replyedUserAccount) !== originalReplyAccount) {
        await users.update(replyedUserAccount.id, replyedUserAccount);
    }

    // Если команда вернула текст для ответа, отправляем его
    if (responce) {
      ctx.reply(responce);
    }
    
  }
});

client.login(process.env.DS_BOT_TOKEN).catch((e) => {
  console.error('Failed to login to Discord:', e);
  process.exit(1);
});