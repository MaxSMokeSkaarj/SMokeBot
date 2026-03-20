import { users } from '../db.js';

/**
 * @param {BotContext} ctx
 */
export const command = async (ctx) => {
  let text = 'Топ игроков:\n';
  let count = params.slice(1).join(' ');
  count = Number(count);
  if (count <= 0 || !count) count = 10;
  
  let userList = await users.readAll();

  let top = userList.sort((a, b) => b.money - a.money).slice(0, count);
  for (let i = 0; i < top.length; i++) {
    text += `${i+1}. ${top[i].nick}: ${top[i].money}\n`;
  }
  return text;
};