import { withEconomyContext } from './economy-transaction.js';
import { getCommandList, loadCommand } from './command-loader.js';

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
    return await withEconomyContext(context, async () => command(context));
  } catch (error) {
    console.error(`Ошибка в команде ${context.cmd}:`, error);
    return 'Произошла ошибка в транзакции команды';
  }
};

export { executeCommand };
