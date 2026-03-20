const account = {
  "id": "1234",
  "nick": "Новичок",
  "money": 8670.29,
  "workTimeout": "2026-03-17T14:45:15.777Z",
  "cars": [],
  "houses": [],
  "phones": [],
  "pets": [],
  "buisnesses": [],
  "credit": [],
  "deposit": [],
  "isBotAdmin": false,
  "isBanned": false,
  "banReason": [],
  "jackpotTimeout": "2026-03-17T14:54:28.461Z"
}

const originalAccount = JSON.stringify(account);

console.log(JSON.stringify(account) === originalAccount);

const test = (acc) => {
  acc.money += 1000;
  acc.cars.push("Lada Granta");
}

console.log(JSON.stringify(account) === originalAccount);
