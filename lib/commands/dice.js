/**
 * @param {import('../types').BotContext} ctx
*/
export const command = async (ctx) => {
  let rand = Math.floor(Math.random() * (6 - 1) + 1);
  return `Выпало ${rand}`;
};