import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCallback);

/**
 * @param {import('../types').BotContext} ctx
 */
export const command = async (ctx) => {
  const command = ctx.args.join(' ');

  if (!ctx.account.isBotAdmin) return 'Доступ запрещён';
  if (!command) return 'введите команду в команду(каламбур :))';

  try {
    const { stdout, stderr } = await exec(command, {
      encoding: 'utf8',
      timeout: 10_000,
      maxBuffer: 1024 * 1024
    });

    if (stdout) return `stdout:\n${stdout}`;
    if (stderr) return `stderr:\n${stderr}`;
    return 'Команда выполнена без вывода';
  } catch (error) {
    console.error(error);
    const output = error.stderr || error.stdout || error.message;
    return `exec error:\n${output}`;
  }
};
