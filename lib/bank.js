import { readFile, writeFile, rename } from 'fs/promises';
import { join } from 'path';

import { users } from './db.js';
import { getActiveEconomyTransaction, withStorageLock } from './economy-transaction.js';

const MAXBALANCE = Number.MAX_SAFE_INTEGER / 100;

class Bank {
  #filePath = join('storage/json/users', 'bank.json');
  #ready;
  #initializationError = null;

  constructor() {
    this.#ready = this.initializeBank().catch(error => {
      this.#initializationError = error;
      console.error('Ошибка инициализации банка:', error.message);
    });
  }

  async #waitReady() {
    await this.#ready;
    if (this.#initializationError) throw this.#initializationError;
  }

  async initializeBank() {
    await withStorageLock(async () => {
      try {
        const data = JSON.parse(await readFile(this.#filePath, 'utf8'));
        if (typeof data.balance !== 'number' || !Number.isFinite(data.balance)) {
          throw new Error('Некорректный bank.json');
        }
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;

        const allMoney = (await users.readAll())
          .map(user => user.money)
          .reduce((total, money) => total + money, 0);
        await this.#writeBank({ balance: MAXBALANCE - allMoney });
      }
    });
  }

  async #readBank() {
    const data = JSON.parse(await readFile(this.#filePath, 'utf8'));
    if (typeof data.balance !== 'number' || !Number.isFinite(data.balance)) {
      throw new Error('Некорректный bank.json');
    }
    return data;
  }

  async #writeBank(data) {
    const tempFilePath = `${this.#filePath}.tmp-${process.pid}-${Date.now()}`;
    await writeFile(tempFilePath, JSON.stringify(data, null, 2), 'utf8');
    await rename(tempFilePath, this.#filePath);
  }

  async getBalance() {
    await this.#waitReady();
    const transaction = getActiveEconomyTransaction();
    if (transaction) return transaction.bank.balance;
    return withStorageLock(async () => (await this.#readBank()).balance);
  }

  async addMoney(amount) {
    await this.#waitReady();
    const transaction = getActiveEconomyTransaction();
    if (transaction) {
      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
        throw new Error('Некорректная сумма для добавления');
      }
      transaction.bank.balance += amount;
      return transaction.bank.balance;
    }

    return withStorageLock(async () => {
      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
        throw new Error('Некорректная сумма для добавления');
      }
      const bank = await this.#readBank();
      bank.balance += amount;
      await this.#writeBank(bank);
      return bank.balance;
    });
  }

  async removeMoney(amount) {
    await this.#waitReady();
    const transaction = getActiveEconomyTransaction();
    if (transaction) {
      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
        throw new Error('Некорректная сумма для списания');
      }
      transaction.bank.balance -= amount;
      return transaction.bank.balance;
    }

    return withStorageLock(async () => {
      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
        throw new Error('Некорректная сумма для списания');
      }
      const bank = await this.#readBank();
      bank.balance -= amount;
      await this.#writeBank(bank);
      return bank.balance;
    });
  }

  async tryRemoveMoney(amount) {
    await this.#waitReady();
    const transaction = getActiveEconomyTransaction();
    if (transaction) {
      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
        throw new Error('Некорректная сумма для списания');
      }
      if (transaction.bank.balance < amount) return false;
      transaction.bank.balance -= amount;
      return true;
    }

    return withStorageLock(async () => {
      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
        throw new Error('Некорректная сумма для списания');
      }
      const bank = await this.#readBank();
      if (bank.balance < amount) return false;
      bank.balance -= amount;
      await this.#writeBank(bank);
      return true;
    });
  }

  async tryTransferMoney(inAmount, outAmount) {
    await this.#waitReady();
    const transaction = getActiveEconomyTransaction();
    if (transaction) {
      if (typeof inAmount !== 'number' || !Number.isFinite(inAmount) || inAmount < 0 ||
          typeof outAmount !== 'number' || !Number.isFinite(outAmount) || outAmount < 0) {
        throw new Error('Некорректная сумма для перевода');
      }
      if (transaction.bank.balance + inAmount < outAmount) return false;
      transaction.bank.balance += inAmount - outAmount;
      return true;
    }

    return withStorageLock(async () => {
      if (typeof inAmount !== 'number' || !Number.isFinite(inAmount) || inAmount < 0 ||
          typeof outAmount !== 'number' || !Number.isFinite(outAmount) || outAmount < 0) {
        throw new Error('Некорректная сумма для перевода');
      }
      const bank = await this.#readBank();
      if (bank.balance + inAmount < outAmount) return false;
      bank.balance += inAmount - outAmount;
      await this.#writeBank(bank);
      return true;
    });
  }

  async isValid() {
    await this.#waitReady();

    return withStorageLock(async () => {
      const balance = (await this.#readBank()).balance;
      const userList = await users.readAll();
      const allMoney = Number(userList
        .map(user => user.money || 0)
        .reduce((accumulator, currentValue) => accumulator + currentValue, 0)
        .toFixed(2));
      const balanceDiff = Number((MAXBALANCE - balance).toFixed(2));
      const diff = allMoney - balanceDiff;
      const inaccuracy = userList.length * 0.005;
      console.log({ balance, allMoney, balanceDiff, diff, userCount: userList.length, inaccuracy });
      return !(diff > inaccuracy || diff < -inaccuracy);
    });
  }
}

export const bank = new Bank();
