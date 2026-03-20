import { exec } from 'child_process';

/* костыль для шизды(майки должны гореть в аду!)
await new Promise((res, rej) =>
  exec("chcp 65001", (error) => error ? rej(error) : res())
);
*/

/**
 * @param {BotContext} ctx
*/
export const command = async (ctx) => {
  const command = ctx.args.slice(1).join(' ');

  if (!ctx.account.isBotAdmin) return ctx.reply('Доступ запрещён');
  if (!command) return ctx.reply('введите команду в команду(каламбур :))');

  exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
    if (error) {
      console.error(error);
      return `exec error:\n ${error}`;
    }
    if (stdout) return `stdout:\n ${stdout}`;
    if (stderr) return `stderr:\n ${stderr}`;
  });
};
