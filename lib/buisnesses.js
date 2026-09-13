import { readFile } from 'fs/promises';

import { users } from './db.js';
import { bank } from './bank.js';
/**
 * @type {Array<object>}
 */
const buisnessesList = JSON.parse(await readFile('storage/json/buisnesses.json'));

export const buisnessIncome = () => {

  setInterval(async () => {
    const userList = await users.readAll();

    for (const user of userList) {
      if (!user.id) continue;

      await users.modify(user.id, async currentUser => {
        if (!currentUser.buisnesses) return;

        for (const buisness of currentUser.buisnesses) {
          const actualBuisness = buisnessesList[buisness.id];
          if (!actualBuisness) continue;
          if (new Date(buisness.timeout) > new Date()) continue;

          if (!await bank.tryRemoveMoney(actualBuisness.income)) {
            console.error('Банк не может выплатить деньги, попробуйте позже');
            continue;
          }

          currentUser.money += actualBuisness.income;

          const date = new Date();
          date.setHours(date.getHours() + 24);
          buisness.timeout = date.toISOString();
        }
      });
    }
  }, 10000);
};
