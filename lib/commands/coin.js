/**
 * @param {import('../types').BotContext} ctx
 */
export const command = async (ctx) => {
  const result = Math.random() < 0.5 ? 0 : 1;
  return result === 1 ? 'Выпал орёл' : 'Выпала решка';
};
