import { bank } from '../bank.js';

/**
 * @param {import('../types').BotContext} ctx
*/
export const command = async (ctx) => {
  if (ctx.args.length === 0) return 'Команда кредит:\nкредит [сумма] [cрок] - взять кредит\nсумма от 1.000.000 до 1.000.000.000 SM,\nсрок от 10 до 30 дней, по умолчанию 30 дней';
  if (ctx.account.credit.length > 2) return 'У вас уже есть 3 кредита, погасите их, чтобы взять новый';

  const amount = Number(ctx.args[0]);
  const time = Number(ctx.args[1]) || 30;
  if (time < 10 || time > 30) return 'Срок кредита должен быть от 10 до 30 дней';
  if (!Number.isFinite(amount) || amount <= 0) return 'Введи число больше 0';
  if (amount > 1000000000 || amount < 1000000) return 'Сумма кредита должна быть от 1.000.000 до 1.000.000.000 SM';

  const percent = 0.1;
  const totalAmount = amount * (1 + percent);

  if (!await bank.tryRemoveMoney(amount)) {
    return 'Банк не может выдать кредит, попробуйте позже';
  }

  const dailyPayment = Number((totalAmount / time).toFixed(2));

  ctx.account.credit.push({
    amountTotal: totalAmount,
    amountPaid: 0,
    amountLeft: totalAmount,
    daysLeft: time,
    nextPaymentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    dailyPayment: dailyPayment.toFixed(2),
  });

  ctx.account.money += amount;

  return `Вы успешно взяли кредит на ${amount} SM . Ежедневный платеж: ${dailyPayment}. Количество дней до полного погашения: ${time} дней.`;
};
