import * as readline from "node:readline";
import * as fs from "fs";
import { Telegraf } from "telegraf";
import { cmds } from "./lib/cmds.mjs";

import { db } from "./lib/modules/db.mjs";

const bot = new Telegraf(process.env.TG_BOT_TOKEN);

console.log("bot running");

let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

/**
 * Safely stringifies an object, handling circular references.
 * @param {any} obj - The object to stringify.
 * @param {Function} [replacer] - JSON.stringify replacer function.
 * @param {string|number} [space] - JSON.stringify space parameter.
 * @returns {string} - Stringified result with circular references replaced by "[Circular]".
 */
const safeStringify = (obj, replacer, space) => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
    }
    return replacer ? replacer(key, value) : value;
  }, space);
};

const typeHandlers = {
  string: (result) => `Type: string\nResult: ${result}\n`,
  number: (result) => `Type: number\nResult: ${result}\n`,
  boolean: (result) => `Type: boolean\nResult: ${result}\n`,
  bigint: (result) => `Type: bigint\nResult: ${result}n\n`,
  symbol: (result) => `Type: symbol\nResult: ${result.toString()}\n`,
  undefined: () => `Type: undefined\nResult: undefined\n`,
  object: (result) => {
    if (result === null) return `Type: null\nResult: null\n`;
    if (result instanceof Date) return `Type: Date\nResult: ${result.toISOString()}\n`;
    if (result instanceof RegExp) return `Type: RegExp\nResult: ${result.toString()}\n`;
    return `Type: object\nResult: ${safeStringify(result, null, "\t")}\n`;
  },
  function: () => `Type: function\nResult: [Function]\n`,
  default: (result) => `Type: ${typeof result}\nResult: ${safeStringify(result, null, "\t")}\n`,
};

rl.on("line", function (line) {
  process.stdout.write("\n>");
  try {
    // это внутреняя консоль, здесть eval используется специально!!!
    const result = eval(line);
    const handler = typeHandlers[typeof result] || typeHandlers.default;
    process.stdout.write(handler(result));
  } catch (e) {
    console.error(`Error: ${e.name}\nMessage: ${e.message}\nStack: ${e.stack}\n`);;
  }
});

fs.watch("./index.mjs", (err, edited) => {
  if (edited) {
    console.log("Restart!!!!");
    process.exit(0);
  }
});

bot.start((ctx) => ctx.reply("Welcome"));
bot.help((ctx) => ctx.reply("Send me a sticker"));
for (let cmd of cmds) bot.command(cmd.regexp, async (ctx) => await cmd.command(ctx));

bot.on("text", (ctx) => {
  console.log(ctx.text);
});
bot.launch();

// tests
