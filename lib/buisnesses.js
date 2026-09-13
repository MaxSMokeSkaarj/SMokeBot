import { readFile } from 'fs/promises';

import { users } from './db.js';
import { bank } from './bank.js';
import { withEconomyTransaction } from './economy-transaction.js';

/**
 * @type {Array<object>}
 */
const buisnessesList = JSON.parse(await readFile('storage/json/buisnesses.json'));

const getBusinessIncome = business => {
  const tier = Number.isInteger(business.tier) && business.tier > 0 ? business.tier : 1;
  const tierData = buisnessesList[business.id]?.tiers?.[tier - 1];
  if (typeof tierData?.income === 'number' && Number.isFinite(tierData.income)) {
    return tierData.income;
  }

  return typeof business.income === 'number' && Number.isFinite(business.income)
    ? business.income
    : null;
};

export const buisnessIncome = () => {
  setInterval(async () => {
    const userList = await users.readAll();

    for (const user of userList) {
      if (!user.id) continue;

      await withEconomyTransaction([user.id], async ({ users: accounts }) => {
        const currentUser = accounts[String(user.id)];
        if (!currentUser?.buisnesses) return;

        for (const buisness of currentUser.buisnesses) {
          if (!buisnessesList[buisness.id]) continue;
          if (new Date(buisness.timeout) > new Date()) continue;

          const income = getBusinessIncome(buisness);
          if (income === null || income <= 0) {
            console.error(`Некорректный доход бизнеса ${buisness.id}`);
            continue;
          }

          if (!await bank.tryRemoveMoney(income)) {
            console.error('Банк не может выплатить деньги, попробуйте позже');
            continue;
          }

          currentUser.money += income;
          buisness.income = income;

          const date = new Date();
          date.setHours(date.getHours() + 24);
          buisness.timeout = date.toISOString();
        }
      });
    }
  }, 10000);
};
