/**
 * @param {BotContext} ctx
*/
export const command = async (ctx) => {
  const newNick = ctx.args.slice(1).join(' ');

  const regex = /^[a-zA-Zа-яА-ЯёЁ0-9_-\s]{3,20}$/;
  const isNickNormal = regex.test(newNick);
  if (!newNick) return ctx.reply('Введите ник в команду');
  if (!isNickNormal) return ctx.reply('Никнейм может содержать только буквы (a-z, A-Z, а-я, А-Я), цифры (0-9) и дефис/нижнее подчёркивание, длина от 3 до 20 символов.');
  const oldNick = ctx.account.nick;

  ctx.account.nick = newNick;
  return `${oldNick}, теперь вы ${newNick}`;
};