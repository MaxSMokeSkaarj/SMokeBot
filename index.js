import * as process from 'process';
import * as readline from 'node:readline';
import { spawn } from 'child_process';
import { createWriteStream } from 'fs';

import { buisnessIncome } from './lib/buisnesses.js';

// eslint-disable-next-line no-unused-vars
import { users } from './lib/db.js';

const botLog = createWriteStream('bot.log', { flags: 'a' });
const botProcesses = new Map();

let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

/**
 * Safely stringifies an object, handling circular references.
 * @param {any} obj - The object to stringify.
 * @param {Function} [replacer] - JSON.stringify replacer function.
 * @param {string|number} [space] - JSON.stringify space parameter.
 * @returns {string} - Stringified result with circular references replaced by "[Circular]".
 */
const safeStringify = (obj, replacer, space) => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }
    return replacer ? replacer(key, value) : value;
  }, space);
};

const typeHandlers = {
  string: (result) => `Type: string\nResult: ${result}\n`,
  number: (result) => `Type: number\nResult: ${result}\n`,
  boolean: (result) => `Type: boolean\nResult: ${result}\n`,
  bigint: (result) => `Type: bigint\nResult: ${result}n\n`,
  symbol: (result) => `Type: symbol\nResult: ${result.toString()}\n`,
  undefined: () => `Type: undefined\nResult: undefined\n`,
  object: (result) => {
    if (result === null) return `Type: null\nResult: null\n`;
    if (result instanceof Date) {
      return `Type: Date\nResult: ${result.toISOString()}\n`;
    }
    if (result instanceof RegExp) {
      return `Type: RegExp\nResult: ${result.toString()}\n`;
    }
    return `Type: object\nResult: ${safeStringify(result, null, '\t')}\n`;
  },
  function: () => `Type: function\nResult: [Function]\n`,
  default: (result) =>
    `Type: ${typeof result}\nResult: ${safeStringify(result, null, '\t')}\n`,
};

rl.on('line', function (line) {
  console.log('\n>');
  try {
    const result = eval(line);
    const handler = typeHandlers[typeof result] || typeHandlers.default;
    console.log(handler(result));
  } catch (e) {
    console.error(
      `Error: ${e.name}\nMessage: ${e.message}\nStack: ${e.stack}\n`,
    );
  }
});

buisnessIncome();

// Список файлов ботов
const botFiles = [
  'index-tg.js',
  'index-ds.js',
  'index-vk.js',
];

// Функция для запуска одного бота
function startBot(file) {
  const botProcess = spawn('node', ['--env-file=.env', file], {
    stdio: ['inherit', 'inherit', 'inherit'],
  });

  botProcesses.set(file, botProcess);
  const startMessage = `${new Date().toISOString()} - Запущен ${file} с PID ${botProcess.pid}\n`;
  console.log(startMessage);
  botLog.write(startMessage);

  botProcess.on('error', (error) => {
    const errorMessage = `${new Date().toISOString()} - Ошибка при запуске ${file}: ${error.message}\n`;
    console.error(errorMessage);
    botLog.write(errorMessage);
    setTimeout(() => startBot(file), 5000); // Перезапуск через 5 секунд
  });

  botProcess.on('exit', (code) => {
    const exitMessage = `${new Date().toISOString()} - ${file} завершился с кодом ${code}\n`;
    console.log(exitMessage);
    botLog.write(exitMessage);
    botProcesses.delete(file);
    setTimeout(() => startBot(file), 5000); // Перезапуск через 5 секунд
  });
}

// Запускаем все боты
botFiles.forEach(file => {
  startBot(file);
});

/*
// Обработка завершения процесса
process.on('SIGINT', () => {
  console.log('Завершение работы...\n');
  botProcesses.forEach((proc, file) => {
    const stopMessage = `${new Date().toISOString()} - Остановка ${file}...\n`;
    console.log(stopMessage);
    botLog.write(stopMessage);
    proc.kill('SIGTERM');
  });
  botLog.end();
  process.exit(0);
});
*/