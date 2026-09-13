import { readdir, stat } from 'fs/promises';
import { basename, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const commandsDirectory = new URL('./commands/', import.meta.url);

/**
 * Returns the names of all JavaScript commands available to the bot.
 *
 * The directory is scanned on every call intentionally: commands are a
 * hot-pluggable part of the bot and may be added or removed at runtime.
 *
 * @returns {Promise<string[]>}
 */
const getCommandList = async () => {
  const files = await readdir(commandsDirectory);

  return files
    .filter((file) => extname(file) === '.js')
    .map((file) => basename(file, extname(file)));
};

/**
 * Loads a command module and invalidates the import cache whenever the file
 * changes. This preserves the HotPlug behaviour of the original adapters.
 *
 * @param {string} commandName
 * @returns {Promise<Function>}
 */
const loadCommand = async (commandName) => {
  const commandUrl = new URL(`./${commandName}.js`, commandsDirectory);
  const fileStat = await stat(commandUrl);
  const moduleUrl = `${pathToFileURL(commandUrl.pathname).href}?${fileStat.mtimeMs}`;
  const { command } = await import(moduleUrl);

  if (typeof command !== 'function') {
    throw new TypeError(`Команда ${commandName} не экспортирует функцию command`);
  }

  return command;
};

export { getCommandList, loadCommand };
