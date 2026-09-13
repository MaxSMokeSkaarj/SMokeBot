import { users } from './db.js';
import { getCommandList, loadCommand } from './command-loader.js';

/**
 * Executes a command using the common BotContext contract and persists any
 * account changes made by the command.
 *
 * @param {import('./types.d.ts').BotContext} context
 * @returns {Promise<string|void>}
 */
const executeCommand = async (context) => {
  const commands = await getCommandList();

  if (!commands.includes(context.cmd)) return;

  const command = await loadCommand(context.cmd);
  const originalUserAccount = JSON.stringify(context.account);
  const originalReplyAccount = context.reply?.account
    ? JSON.stringify(context.reply.account)
    : null;

  try {
    const response = await command(context);

    if (JSON.stringify(context.account) !== originalUserAccount) {
      await users.update(context.account.id, context.account);
    }

    if (context.reply?.account && JSON.stringify(context.reply.account) !== originalReplyAccount) {
      await users.update(context.reply.account.id, context.reply.account);
    }

    return response;
  } catch (error) {
    console.error(`Ошибка в команде ${context.cmd}:`, error);
    return 'Произошла ошибка при выполнении команды';
  }
};

export { executeCommand };
