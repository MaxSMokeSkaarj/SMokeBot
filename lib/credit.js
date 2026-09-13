import { bank } from './bank.js';
import { users } from './db.js';

export const processCreditPayments = async () => {
  setInterval(async () => {
    const userList = await users.readAll();

    for (const user of userList) {
      if (!user.id) continue;

      await users.modify(user.id, async currentUser => {
        if (currentUser.credit.length === 0) return;

        for (let i = 0; i < currentUser.credit.length; i++) {
          const credit = currentUser.credit[i];
          if (new Date(credit.nextPaymentDate) > new Date()) continue;

          const paymentAmount = Number(credit.dailyPayment);
          currentUser.money -= paymentAmount;
          credit.amountPaid += paymentAmount;
          credit.daysLeft -= 1;

          if (credit.daysLeft <= 0) {
            currentUser.credit.splice(i, 1);
            i--;
          } else {
            const nextPaymentDate = new Date(credit.nextPaymentDate);
            nextPaymentDate.setDate(nextPaymentDate.getDate() + 1);
            credit.nextPaymentDate = nextPaymentDate.toISOString();
          }

          await bank.addMoney(paymentAmount);
        }
      });
    }
  }, 10000);
};
