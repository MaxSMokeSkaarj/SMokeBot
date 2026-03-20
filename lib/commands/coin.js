/**
 * @param {BotContext} ctx
*/
export const command = (ctx) => {
  function coinToss() {
    return Math.random() < 0.5 ? 0 : 1;
  }
  coinToss();
  if (coinToss() == '1') {
    return 'Выпал орёл';
  } else if (coinToss() == '0') {
    return 'Выпала решка';
  }
};