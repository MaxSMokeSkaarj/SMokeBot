import { readFile } from 'fs/promises';
import { users } from './db.js';

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
        user.money += actualBuisness.income;

        let date = new Date();
        date.setHours(date.getHours() + 24);
        buisness.timeout = date;

        users.update(user.id, {...user});
      }
    }
  },1000);
};
