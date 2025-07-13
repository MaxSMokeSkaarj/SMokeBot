
import { readdir,stat } from "fs/promises";
import { basename, extname } from "node:path";
import { Client, GatewayIntentBits, Message } from 'discord.js';

import { users } from "./lib/db.js";
import { bot as IHABot } from "./lib/IHABot.js";

console.log("bot running");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

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



client.on('messageCreate', async (/** @type {Message} */ ctx) => {
  if (ctx.author.bot) return;

  const userID = Number(ctx.author.id);
  let user = await users.read(userID);
  
  if (!user) user = await users.create(userID);
  
  const params = ctx.content.replace(/^\//, "").replace('@smokeofanarchy_bot', '').split(' ');
  const cmd = params[0]

  const isReplyed = (ctx.reference && ctx.reference.messageId) ? true : false;

  const targetUserID = isReplyed ? Number(((await ctx.channel.messages.fetch(ctx.reference.messageId)).author.id)) : Number(params[1]);
  const targetUser = !isNaN(targetUserID) ? await users.read(targetUserID) : null;
  
  console.log({id: userID, nick: user.nick, text: params.join(' '), targetUserID, targetUser});
  
  if (user.isBanned || targetUser?.isBanned) return;

  // Обработка команд с префиксом /
  const prefix = '/';
  if (ctx.content.startsWith(prefix)) {

      const commands = await getCommandList()
    
      if (!commands.some((command) => command === cmd)) return;
    
      const modulePath = `./lib/commands/${cmd}.js`;
      const mtime = (await stat(modulePath)).mtime;
    
      const { command } = await import(`${modulePath}?${mtime}`);
    
      command({ctx,user,targetUser,params,isReplyed});
  }

});


client.login(process.env.DISCORD_BOT_TOKEN);
