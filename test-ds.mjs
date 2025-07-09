import { readdir, stat } from "fs/promises";
import { basename, extname } from "node:path";
import { Client, GatewayIntentBits, Message } from 'discord.js';
import { bootstrap } from 'global-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';

import { users } from "./lib/db.mjs";
import { bot as IHABot } from "./lib/IHABot.mjs";

console.log("bot running");

// Настройка прокси
process.env.GLOBAL_AGENT_HTTP_PROXY = process.env.http_proxy || process.env.HTTP_PROXY;
process.env.GLOBAL_AGENT_HTTPS_PROXY = process.env.https_proxy || process.env.HTTPS_PROXY;
bootstrap();
const proxyUrl = process.env.https_proxy || process.env.HTTPS_PROXY;
const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : null;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  ws: {
    agent
  }
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
  const id = Number(ctx.author.id);
  const user = await users.read(id);
  console.log({ id, nick: user.nick, text: ctx.content });
  if (!user) users.create(id);
  if (user.isBanned) return;

  // Обработка команд с префиксом /
  const prefix = '/';
  if (ctx.content.startsWith(prefix)) {
    const commands = await getCommandList();
    const cmd = ctx.content.replace(/^\//, "").replace(/\s.*$/, '');
    if (!commands.some((command) => command === cmd)) {
      return;
    }
    const modulePath = `./lib/commands/${cmd}.mjs`;
    const mtime = (await stat(modulePath)).mtime;

    const { command } = await import(`${modulePath}?${mtime}`);

    command(ctx, user);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);