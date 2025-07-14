// eslint-disable-next-line no-unused-vars
import { Context as TelegramContext } from "telegraf";
// eslint-disable-next-line no-unused-vars
import { MessageContext as VKContext} from "vk-io";
// eslint-disable-next-line no-unused-vars
import { Message as DSContext } from 'discord.js';

// eslint-disable-next-line no-unused-vars
import { users, UserTemplate } from "../db.js";

/**
 * @param { Object } params
 * @param { VKContext | TelegramContext | DSContext } params.ctx
 * @param { UserTemplate } params.user
 * @param { Array<string> } params.params
 */

export const command = async ({ctx, user}) => {

	if (user.workTimeout && new Date(user.workTimeout) > new Date()) return ctx.reply(`Вы уже работали недавно, осталось ${new Date(user.workTimeout).getMinutes() - new Date().getMinutes()} минут`);
	
	let rand = Math.floor(Math.random() * (10000 - 100) + 100);

	let date = new Date();
	let currentMinutes = date.getMinutes();
	date.setMinutes(currentMinutes + 10);

	users.update(user.id,{money: user.money + rand, workTimeout: date.toISOString()});
	ctx.reply(`${user.nick}, вы заработали ${rand}, у вас ${user.money + rand}`);
};