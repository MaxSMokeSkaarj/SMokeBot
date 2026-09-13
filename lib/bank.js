import { readFile, writeFile, rename } from 'fs/promises';
import { join } from 'path';

import { users } from './db.js';
import { withFileLock } from './file-lock.js';

const MAXBALANCE = (Number.MAX_SAFE_INTEGER / 100);

class Bank {
  #filePath = join('storage/json/users', 'bank.json');
  #isProcessing = false;
  #commandQueue = [];

  constructor() {
    this.initializeBank();
  }

  async initializeBank() {
    try {
      await withFileLock(this.#filePath, async () => {
        try {
          const data = await readFile(this.#filePath, 'utf8');
          const bank = JSON.parse(data);
          if (!bank.balance || typeof bank.balance !== 'number') {
            throw new Error('Invalid bank data');
          }
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;

          const allMoney = (await users.readAll())
            .map(user => user.money || 0)
            .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
          await this.#writeBank({ balance: MAXBALANCE - allMoney });
        }
      });
    } catch (error) {
      console.error('Ошибка инициализации банка:', error.message);
    }
  }

  async #readBank() {
    try {
      const data = await readFile(this.#filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Ошибка чтения банка:', error.message);
      return { balance: 0 };
    }
  }

  async #writeBank(data) {
    try {
      const tempFilePath = `${this.#filePath}.tmp`;
      await writeFile(tempFilePath, JSON.stringify(data, null, 2));
      await rename(tempFilePath, this.#filePath);
    } catch (error) {
      console.error('Ошибка записи банка:', error.message);
      throw error;
    }
  }

  async #processQueue() {
    if (this.#isProcessing || this.#commandQueue.length === 0) return;
    this.#isProcessing = true;

    const command = this.#commandQueue.shift();
    try {
      await withFileLock(this.#filePath, async () => {
        const bank = await this.#readBank();

        if (command.type === 'getBalance') {
          command.resolve(bank.balance);
          return;
        }

        if (command.type === 'addMoney') {
          if (typeof command.amount !== 'number' || command.amount < 0) {
            throw new Error('Некорректная сумма для добавления');
          }
          bank.balance += command.amount;
          await this.#writeBank(bank);
          command.resolve(bank.balance);
          return;
        }

        if (command.type === 'removeMoney') {
          if (typeof command.amount !== 'number' || command.amount < 0) {
            throw new Error('Некорректная сумма для списания');
          }
          bank.balance -= command.amount;
          await this.#writeBank(bank);
          command.resolve(bank.balance);
          return;
        }

        if (command.type === 'tryRemoveMoney') {
          if (typeof command.amount !== 'number' || command.amount < 0) {
            throw new Error('Некорректная сумма для списания');
          }
          if (bank.balance < command.amount) {
            command.resolve(false);
            return;
          }
          bank.balance -= command.amount;
          await this.#writeBank(bank);
          command.resolve(true);
          return;
        }

        if (command.type === 'tryTransferMoney') {
          if (typeof command.inAmount !== 'number' || command.inAmount < 0 ||
              typeof command.outAmount !== 'number' || command.outAmount < 0) {
            throw new Error('Некорректная сумма для перевода');
          }
          if (bank.balance + command.inAmount < command.outAmount) {
            command.resolve(false);
            return;
          }
          bank.balance += command.inAmount - command.outAmount;
          await this.#writeBank(bank);
          command.resolve(true);
        }
      });
    } catch (error) {
      command.reject(error);
    }

    this.#isProcessing = false;
    await this.#processQueue();
  }

  async #enqueueCommand(type, amount, extraAmount) {
    return new Promise((resolve, reject) => {
      this.#commandQueue.push({
        type,
        amount,
        inAmount: amount,
        outAmount: extraAmount,
        resolve,
        reject
      });
      this.#processQueue();
    });
  }

  async getBalance() {
    return this.#enqueueCommand('getBalance');
  }

  async addMoney(amount) {
    return this.#enqueueCommand('addMoney', amount);
  }

  async removeMoney(amount) {
    return this.#enqueueCommand('removeMoney', amount);
  }

  async tryRemoveMoney(amount) {
    return this.#enqueueCommand('tryRemoveMoney', amount);
  }

  async tryTransferMoney(inAmount, outAmount) {
    return this.#enqueueCommand('tryTransferMoney', inAmount, outAmount);
  }

  async isValid() {
    const balance = await this.getBalance();
    const allMoney = Number((await users.readAll())
      .map(user => user.money || 0)
      .reduce((accumulator, currentValue) => accumulator + currentValue, 0)
      .toFixed(2));
    const balanceDiff = Number((MAXBALANCE - balance).toFixed(2));
    const diff = allMoney - balanceDiff;
    const userCount = (await users.readAll()).length;
    const inaccuracy = userCount * 0.005;
    console.log({balance, allMoney, balanceDiff, diff, userCount, inaccuracy});
    if (diff > inaccuracy || diff < -inaccuracy) return false;
    return true;
  }
}

export const bank = new Bank();
