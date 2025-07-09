import { promises as fs } from 'fs';
import path from 'path';































/**
 * Добавляет кредит пользователю.
 * @param {number} userId - ID пользователя.
 * @param {Object} creditData - Данные кредита { amount, interestRate, days }.
 * @param {string} dbPath - Путь к файлу users.json.
 * @returns {Promise<void>}
 */
async function addCredit(userId, { amount, interestRate, days }, dbPath = path.join(process.cwd(), 'users.json')) {
  const users = JSON.parse(await fs.readFile(dbPath, 'utf-8'));
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error('Пользователь не найден');
  if (user.money < amount) throw new Error('Недостаточно средств');
  if (user.credit.length >= 3) throw new Error('Слишком много активных кредитов');

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);

  user.credit.push({
    amount,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    interestRate,
    lastInterestUpdate: Date.now()
  });
  user.money += amount; // Выдаём кредит
  await fs.writeFile(dbPath, JSON.stringify(users, null, 2));
}

/**
 * Добавляет вклад пользователю.
 * @param {number} userId - ID пользователя.
 * @param {Object} depositData - Данные вклада { amount, interestRate, days }.
 * @param {string} dbPath - Путь к файлу users.json.
 * @returns {Promise<void>}
 */
async function addDeposit(userId, { amount, interestRate, days }, dbPath = path.join(process.cwd(), 'users.json')) {
  const users = JSON.parse(await fs.readFile(dbPath, 'utf-8'));
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error('Пользователь не найден');
  if (user.money < amount) throw new Error('Недостаточно средств');
  if (amount < 10000) throw new Error('Минимальная сумма вклада 10,000');

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);

  user.deposit.push({
    amount,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    interestRate,
    accruedInterest: 0,
    lastInterestUpdate: Date.now()
  });
  user.money -= amount; // Списываем сумму вклада
  await fs.writeFile(dbPath, JSON.stringify(users, null, 2));
}

export { updateInterests, addCredit, addDeposit };
