/**
 * @param {import('../types').BotContext} ctx
*/
export const command = async (ctx) => {
  function coinToss() {
    return Math.random() < 0.5 ? 0 : 1;
  }
  if (coinToss() == 1) {
    return 'Выпал орёл';
  } else if (coinToss() == 0) {
    return 'Выпала решка';
  }
};