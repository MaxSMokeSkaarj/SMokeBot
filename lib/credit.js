import { users } from './db.js';
import { bank } from './bank.js';
import { withEconomyTransaction } from './economy-transaction.js';

const runCreditCycle = async () => {
  const userList = await users.readAll();

  for (const user of userList) {
    if (!user.id) continue;

    await withEconomyTransaction([user.id], async ({ users: accounts }) => {
      const currentUser = accounts[String(user.id)];
      if (!currentUser?.credit?.length) return;

      for (let i = 0; i < currentUser.credit.length; i++) {
        const credit = currentUser.credit[i];
        if (new Date(credit.nextPaymentDate) > new Date()) continue;

        const scheduledPayment = Number(credit.dailyPayment);
        const amountLeft = Number(credit.amountLeft ?? credit.amountTotal ?? 0);
        const paymentAmount = Math.min(scheduledPayment, amountLeft);

        if (!Number.isFinite(paymentAmount) || paymentAmount <= 0 || amountLeft <= 0) {
          currentUser.credit.splice(i, 1);
          i--;
          continue;
        }

        if (currentUser.money < paymentAmount) {
          console.error(`Недостаточно средств для платежа по кредиту пользователя ${user.id}`);
          continue;
        }

        currentUser.money -= paymentAmount;
        credit.amountPaid = Number(credit.amountPaid || 0) + paymentAmount;
        credit.amountLeft = Math.max(0, amountLeft - paymentAmount);
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
};

export const processCreditPayments = async () => {
  const tick = () => runCreditCycle().catch(error => {
    console.error('Ошибка обработки платежей по кредитам:', error);
  });

  setInterval(tick, 10000);
};
