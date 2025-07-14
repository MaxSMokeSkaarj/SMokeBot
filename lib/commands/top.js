// eslint-disable-next-line no-unused-vars
import { Context as TelegramContext } from "telegraf";
// eslint-disable-next-line no-unused-vars
import { MessageContext as VKContext} from "vk-io";
// eslint-disable-next-line no-unused-vars
import { Message as DSContext } from 'discord.js';

import { users } from "../db.js";

/**
 * @param { Object } params
 * @param { VKContext | TelegramContext | DSContext } params.ctx
 * @param { Array<string> } params.params
 */

export const command = async ({ctx,params}) => {
  let text = "Топ игроков:\n";
	let count = params.slice(1).join(" ");
	count = Number.parseInt(count);
	if (count <= 0 || !count) count = 10;
  
  let userList = await users.readAll();
	let top = userList.sort((a, b) => b.money - a.money).slice(0, count);
	for (let i = 0; i < top.length; i++) {
		text += `${i+1}. ${top[i].nick}: ${top[i].money}\n`;
	}
  ctx.reply(text);
};