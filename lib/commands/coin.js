// eslint-disable-next-line no-unused-vars
import { Context as TelegramContext } from "telegraf";
// eslint-disable-next-line no-unused-vars
import { MessageContext as VKContext} from "vk-io";
// eslint-disable-next-line no-unused-vars
import { Message as DSContext } from 'discord.js';

/**
 * @param { Object } params
 * @param { VKContext | TelegramContext | DSContext } params.ctx
 */

export const command = ({ctx}) => {
    function coinToss() {
      return Math.random() < 0.5 ? 0 : 1;
    }
    coinToss();
    if (coinToss() == "1") {
      ctx.reply("Выпал орёл");
    } else if (coinToss() == "0") {
      ctx.reply("Выпала решка");
    }
};