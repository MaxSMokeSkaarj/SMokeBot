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
    // eval intentionally has unrestricted direct DB access and may manipulate
    // arbitrary users, so it must not run while managed user locks are held.
    if (context.cmd === 'eval') return await command(context);

    return await withEconomyContext(context, async () => command(context));
  } catch (error) {
    console.error(`Ошибка в команде ${context.cmd}:`, error);
    return 'Произошла ошибка при выполнении команды';
  }
};

export { executeCommand };
