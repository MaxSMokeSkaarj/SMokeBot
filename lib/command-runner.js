import { users } from './db.js';
import { withEconomyContext, withUserTransaction } from './economy-transaction.js';
import { getCommandList, loadCommand } from './command-loader.js';

const ECONOMY_COMMANDS = new Set([
  'credit',
  'jackpot',
  'shop',
  'transfer',
  'work'
]);

const READ_ONLY_COMMANDS = new Set([
  'about',
  'aboutme',
  'clck',
  'coin',
  'dice',
  'top',
  'verify'
]);

/**
 * Executes a command using the common BotContext contract.
 * Economy commands hold the economy transaction for their entire execution;
 * other mutating commands use user-only transactions. Read-only commands are
 * deliberately executed without storage locks so network calls cannot block writes.
 *
 * @param {import('./types.d.ts').BotContext} context
 * @returns {Promise<string|void>}
 */
const executeCommand = async (context) => {
  const commands = await getCommandList();

  if (!commands.includes(context.cmd)) return;

  const command = await loadCommand(context.cmd);

  try {
    if (READ_ONLY_COMMANDS.has(context.cmd)) {
      return await command(context);
    }

    if (context.cmd === 'eval') {
      const originalAccount = JSON.stringify(context.account);
      const response = await command(context);

      if (JSON.stringify(context.account) !== originalAccount) {
        await users.update(context.account.id, context.account);
      }
      return response;
    }

    if (ECONOMY_COMMANDS.has(context.cmd)) {
      return await withEconomyContext(context, async () => command(context));
    }

    return await withUserTransaction(
      [context.account.id, context.reply?.account?.id],
      async accounts => {
        context.account = accounts[String(context.account.id)];

        if (context.reply?.account?.id !== undefined) {
          context.reply.account = accounts[String(context.reply.account.id)];
        }

        return command(context);
      }
    );
  } catch (error) {
    console.error(`Ошибка в команде ${context.cmd}:`, error);
    return 'Произошла ошибка при выполнении команды';
  }
};

export { executeCommand };
