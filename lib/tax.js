import { bank } from './bank.js';
import { users } from './db.js';

export const getTax = async () => {
  setInterval(async () => {
    const userList = await users.readAll();
    for (const user of userList) {
      if (!user.id) continue;
      if (user.money < 10000) continue;
      if (new Date(user.taxTimeout) > new Date()) continue;

      let taxPercent = 0;
      if (user.money >= 10000 && user.money <= 1000000) taxPercent = 0.02;
      if (user.money >= 1000000) taxPercent = 0.06;

      const tax = Number((user.money * taxPercent).toFixed(2));
      const timeout = new Date();
      timeout.setDate(timeout.getDate() + 1);
      timeout.setHours(0, 0, 0, 0);

      await bank.addMoney(tax)
      await users.update(user.id, { money: user.money - tax, taxTimeout: timeout.toISOString()});

    }

  },1000);
}