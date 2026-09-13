import { withEconomyContext } from './economy-transaction.js';
import { getCommandList, loadCommand } from './command-loader.js';
import { users } from './db.js';

/**
 * Executes a command using the common BotContext contract. Commands are run in
 * an economy transaction so user and bank changes can be recovered together.
 *
 * @param {import('./types.d.ts').BotContext} context
 * @returns {Promise<string|void>}
 */
const executeCommand = async (context) => {
  const commands = await getCommandList();

  if (!commands.includes(context.cmd)) return;

  const command = await loadCommand(context.cmd);

  try {
    if (command) {
      return await withEconomyContext(context, async () => command(context));
    }

    return await users.withLocks([
      context.account.id,
      context.reply?.account?.id
    ].filter(id => id !== undefined && id !== null), async ({ read, write }) => {
      const account = await read(context.account.id);
      if (!account) return;

      context.account = account;

      if (context.reply?.account?.id !== undefined) {
        context.reply.account = await read(context.reply.account.id);
      }

      const originalUserAccount = JSON.stringify(context.account);
      const originalReplyAccount = context.reply?.account
        ? JSON.stringify(context.reply.account)
        : null;

      const response = await command(context);

      if (JSON.stringify(context.account) !== originalUserAccount) {
        await write(context.account.id, context.account);
      }

      if (context.reply?.account && JSON.stringify(context.reply.account) !== originalReplyAccount) {
        await write(context.reply.account.id, context.reply.account);
      }

      return response;
    });
  } catch (error) {
    console.error(`Ошибка в команде ${context.cmd}:`, error);
    return 'Произошла ошибка в транзакции команды';
  }
};

export { executeCommand };
