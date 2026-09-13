import { users } from './db.js';
import { bank } from './bank.js';
import { withEconomyTransaction } from './economy-transaction.js';

export const processCreditPayments = async () => {
  setInterval(async () => {
    const userList = await users.readAll();

    for (const user of userList) {
      if (!user.id) continue;

      await withEconomyTransaction([user.id], async ({ users: accounts }) => {
        const currentUser = accounts[String(user.id)];
        if (!currentUser?.credit?.length) return;

        for (let i = 0; i < currentUser.credit.length; i++) {
          const credit = currentUser.credit[i];
          if (new Date(credit.nextPaymentDate) > new Date()) continue;

          const paymentAmount = Number(credit.dailyPayment);
          if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
            console.error(`Некорректный платёж по кредиту пользователя ${user.id}`);
            continue;
          }

          if (currentUser.money < paymentAmount) {
            console.error(`Недостаточно средств для платежа по кредиту пользователя ${user.id}`);
            continue;
          }

          currentUser.money -= paymentAmount;
          credit.amountPaid = Number(credit.amountPaid || 0) + paymentAmount;
          credit.amountLeft = Math.max(0, Number(credit.amountLeft || credit.amountTotal) - paymentAmount);
          credit.daysLeft -= 1;

          if (credit.daysLeft <= 0 || credit.amountLeft <= 0) {
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
