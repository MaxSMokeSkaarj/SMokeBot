import * as readline from "node:readline";
import { spawn } from 'child_process';
import { buisnessIncome } from "./lib/buisnesses.js";
import { users } from "./lib/db.js";

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
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return "[Circular]";
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
    return `Type: object\nResult: ${safeStringify(result, null, "\t")}\n`;
  },
  function: () => `Type: function\nResult: [Function]\n`,
  default: (result) =>
    `Type: ${typeof result}\nResult: ${safeStringify(result, null, "\t")}\n`,
};

rl.on("line", function (line) {
  process.stdout.write("\n>");
  try {
    // это внутреняя консоль, здесть eval используется специально!!!
    const result = eval(line);
    const handler = typeHandlers[typeof result] || typeHandlers.default;
    process.stdout.write(handler(result));
  } catch (e) {
    console.error(
      `Error: ${e.name}\nMessage: ${e.message}\nStack: ${e.stack}\n`,
    );
  }
});

buisnessIncome()


// Список файлов ботов
const botFiles = [
    'index-tg.js',
    'index-ds.js',
    'index-vk.js'
];

// Функция для запуска одного бота
function startBot(file) {
    const botProcess = spawn('node', ['--env-file=.env', file], {
        stdio: ['inherit', 'inherit', 'inherit']
    });

    botProcess.on('error', (error) => {
        console.error(`Ошибка при запуске ${file}:`, error);
    });

    botProcess.on('exit', (code) => {
        console.log(`${file} завершился с кодом ${code}`);
        // Можно добавить логику перезапуска
    });

    console.log(`Запущен ${file} с PID ${botProcess.pid}`);
}

// Запускаем все боты
botFiles.forEach(file => {
    startBot(file);
});

// Обработка завершения процесса
process.on('SIGINT', () => {
    console.log('Завершение работы...');
    process.exit();
});
