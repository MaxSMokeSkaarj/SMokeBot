import { Context as TelegramContext } from "telegraf";
import { MessageContext as VKContext} from "vk-io";

/**
 * @param {Object} params
 * @param {VKContext | TelegramContext} params.ctx
 */

export const command = ({ctx}) => {
    ctx.reply("TEST!!!");
};