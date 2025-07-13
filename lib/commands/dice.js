import { Context as TelegramContext } from "telegraf";
import { MessageContext as VKContext} from "vk-io";

/**
 * @param {Object} params
 * @param {VKContext | TelegramContext} params.ctx
 */

export const command = ({ctx}) => {
	let rand = Math.floor(Math.random() * (6 - 1) + 1);
  ctx.reply(`Выпало ${rand}`);
};