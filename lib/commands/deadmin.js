/**
 * @param {BotContext} ctx
*/
export const command = async (ctx) => {
  
  if (!ctx.account.isBotAdmin) return '🚫 Доступ к команде запрещен.';

  if (!ctx.reply.account) return 'Упомяните или напишите id того, кого вы хотите снять с администратора';
  if (!ctx.reply.account.isBotAdmin) return 'Не админ';
  ctx.reply.account.isBotAdmin = false
  return `${ctx.reply.account.nick} более не администратор бота`;
};
