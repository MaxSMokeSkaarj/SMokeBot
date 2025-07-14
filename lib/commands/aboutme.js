// eslint-disable-next-line no-unused-vars
import { Context as TelegramContext } from "telegraf";
// eslint-disable-next-line no-unused-vars
import { MessageContext as VKContext} from "vk-io";
// eslint-disable-next-line no-unused-vars
import { Message as DSContext } from 'discord.js';

// eslint-disable-next-line no-unused-vars
import { UserTemplate } from "../db.js";
import { command as aboutCommamnd } from "./about.js";

/**
 * @param { Object } params
 * @param { VKContext | TelegramContext | DSContext} params.ctx
 * @param { UserTemplate } params.user
 */

export const command = async ({ctx, user}) => {
  aboutCommamnd({ctx, targetUser: user});
};
