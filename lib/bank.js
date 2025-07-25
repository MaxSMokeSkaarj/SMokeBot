import { readFile, writeFile, rename } from 'fs/promises';
import { join } from 'path';

import { users } from './db.js';

class Bank {
  #filePath = join('storage/json/users', 'bank.json');
  #isWriting = false;
  #writeQueue = [];

  constructor() {
    this.initializeBank();
  }

  async initializeBank() {
    try {
      const data = await readFile(this.#filePath, 'utf8');
      const bank = JSON.parse(data);
      if (!bank.balance || typeof bank.balance !== 'number') {
        throw new Error('Invalid bank data');
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        const allMoney = (await users.readAll()).map(user => user.money || 0).reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        await this.#writeBank({ balance: Number.MAX_SAFE_INTEGER - allMoney }); // Начальный баланс банка
      } else {
        console.error('Ошибка инициализации банка:', error.message);
      }
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
    if (this.#isWriting) {
      this.#writeQueue.push(data);
      return;
    }
    this.#isWriting = true;
    try {
      const tempFilePath = `${this.#filePath}.tmp`;
      await writeFile(tempFilePath, JSON.stringify(data, null, 2));
      await rename(tempFilePath, this.#filePath);
    } catch (error) {
      console.error('Ошибка записи банка:', error.message);
    }
    this.#isWriting = false;
    if (this.#writeQueue.length > 0) {
      const nextData = this.#writeQueue.shift();
      await this.#writeBank(nextData);
    }
  }

  async getBalance() {
    const bank = await this.#readBank();
    return bank.balance;
  }

  async addMoney(amount) {
    if (typeof amount !== 'number' || amount < 0) {
      throw new Error('Некорректная сумма для добавления');
    }
    const bank = await this.#readBank();
    bank.balance += amount;
    await this.#writeBank(bank);
    return bank.balance;
  }

  async removeMoney(amount) {
    if (typeof amount !== 'number' || amount < 0) {
      throw new Error('Некорректная сумма для списания');
    }
    const bank = await this.#readBank();
    if (bank.balance < amount) {
      throw new Error('Недостаточно средств в банке');
    }
    bank.balance -= amount;
    await this.#writeBank(bank);
    return bank.balance;
  }
}

export const bank = new Bank();