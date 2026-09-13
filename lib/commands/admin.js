/**
 * @param {import('../types').BotContext} ctx
*/
export const command = async (ctx) => {

  if (!ctx.account.isBotAdmin) return '🚫 Доступ к команде запрещен.';
  if (!ctx.reply) return 'Упомяните или напишите id того, кого вы хотите назначить на администратора';
  if (ctx.reply.account.isBotAdmin) return 'Уже админ';

  ctx.account.isBotAdmin = true;
  return `${ctx.reply.account.nick} теперь администратор бота`;
};
