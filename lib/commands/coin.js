import { Context as TelegramContext } from "telegraf";
import { MessageContext as VKContext} from "vk-io";

/**
 * @param {Object} params
 * @param {VKContext | TelegramContext} params.ctx
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