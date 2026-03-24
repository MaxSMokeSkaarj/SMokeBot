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
      if (!user.buisnesses) continue;
      for (const buisness of user.buisnesses) {
        const actualBuisness = buisnessesList[buisness.id];
        if (!actualBuisness) continue;
        if (new Date(buisness.timeout) > new Date()) continue;

        const bankBalance = await bank.getBalance();
        if (bankBalance < actualBuisness.income) {
          console.error('Банк не может выплатить деньги, попробуйте позже');
          continue;
        }

        user.money += actualBuisness.income;
        await bank.removeMoney(actualBuisness.income);

        let date = new Date();
        date.setHours(date.getHours() + 24);
        buisness.timeout = date;

        users.update(user.id, {...user});
      }
    }
  },10000);
};
