import { bank } from './bank.js';
import { users } from './db.js';

export const processCreditPayments = async () => {
  setInterval(async () => {
    const userList = await users.readAll();
    for (const user of userList) {
      if (!user.id) continue;
      if (user.credit.length === 0) continue;
      for (let i = 0; i < user.credit.length; i++) {
        const credit = user.credit[i];
        if (new Date(credit.nextPaymentDate) > new Date()) continue;

        const paymentAmount = credit.dailyPayment;
        user.money -= paymentAmount;
        credit.amountPaid += paymentAmount;
        credit.daysLeft -= 1;
        
        if (credit.daysLeft <= 0) {
          user.credit.splice(i, 1);
          i--;
        } else {
          const nextPaymentDate = new Date(credit.nextPaymentDate);
          nextPaymentDate.setDate(nextPaymentDate.getDate() + 1);
          credit.nextPaymentDate = nextPaymentDate.toISOString();
        }
        
        await users.update(user.id, { money: user.money, credit: user.credit });
        bank.addMoney(paymentAmount);
      }
    }
  }, 10000);
}
