import http from 'http';
import process from 'process';

import { users } from './lib/db.js';
import { executeCommand } from './lib/command-runner.js';

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Метод не поддерживается' }));
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const data = JSON.parse(body);
      const { id, text, secret } = data;

      if (!id || !text || !secret) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Отсутствуют обязательные поля: id, text или secret' }));
        return;
      }

      const userID = id.toString();
      let userAccount = await users.read(userID);

      if (!userAccount) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Пользователь не найден' }));
        return;
      }

      if (userAccount.secret !== secret) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Неверный secret' }));
        return;
      }

      if (userAccount.isBanned) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Пользователь заблокирован' }));
        return;
      }

      const inText = text;
      const params = inText.split(' ');
      const cmd = params[0].replace(/^\//, '').toLowerCase();
      const replyedUserID = params[1] || null;
      const replyedUserAccount = replyedUserID ? await users.read(replyedUserID) : null;
      let responseBody = {};

      console.log({ id: userID, nick: userAccount.nick, text: params.join(' ') });

      const context = {
        platform: 'web',
        send: async (message) => {
          responseBody = { message };
        },
        text: inText,
        cmd,
        args: params.slice(1),
        account: userAccount,
        reply: {
          text: null,
          account: replyedUserAccount
        }
      };

      const responseText = await executeCommand(context);

      if (responseText) {
        responseBody = { message: responseText };
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(responseBody));
    } catch (error) {
      console.error(error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Внутренняя ошибка сервера' }));
    }
  });
});

const PORT = process.env.PORT || 3333;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
