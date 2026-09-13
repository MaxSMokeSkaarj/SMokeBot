import { bank } from './bank.js';
import { users } from './db.js';
import { withEconomyTransaction } from './economy-transaction.js';

export const getTax = async () => {
  setInterval(async () => {
    const userList = await users.readAll();

    for (const user of userList) {
      if (!user.id) continue;

      await withEconomyTransaction([user.id], async ({ users: accounts }) => {
        const currentUser = accounts[String(user.id)];
        if (!currentUser || currentUser.money < 10000) return;
        if (new Date(currentUser.taxTimeout) > new Date()) return;

        let taxPercent = 0;
        if (currentUser.money >= 1000000) taxPercent = 0.01;

        const tax = Number((currentUser.money * taxPercent).toFixed(2));
        if (tax <= 0) return;

        const timeout = new Date();
        timeout.setDate(timeout.getDate() + 1);
        timeout.setHours(0, 0, 0, 0);

        currentUser.money -= tax;
        currentUser.taxTimeout = timeout.toISOString();

        await bank.addMoney(tax);
      });
    }
  }, 10000);
};
