import http from 'http';
import process from 'process';
import { timingSafeEqual } from 'crypto';

import { users } from './lib/db.js';
import { executeCommand } from './lib/command-runner.js';

const MAX_BODY_SIZE = 1024 * 1024;
const REQUEST_TIMEOUT = 15_000;

const sendJson = (res, statusCode, body) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const secretsEqual = (left, right) => {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

const server = http.createServer(async (req, res) => {
  req.setTimeout(REQUEST_TIMEOUT, () => req.destroy());

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Метод не поддерживается' });
    return;
  }

  let body = '';
  let bodyTooLarge = false;

  req.on('data', chunk => {
    if (bodyTooLarge) return;

    body += chunk.toString();
    if (Buffer.byteLength(body, 'utf8') > MAX_BODY_SIZE) {
      bodyTooLarge = true;
      req.destroy();
    }
  });

  req.on('end', async () => {
    if (bodyTooLarge) return;

    try {
      const data = JSON.parse(body);
      const { id, text, secret } = data;

      if (id === undefined || typeof text !== 'string' || !text || typeof secret !== 'string' || !secret) {
        sendJson(res, 400, { error: 'Некорректные поля: id, text или secret' });
        return;
      }

      const userID = id.toString();
      const userAccount = await users.read(userID);

      if (!userAccount) {
        sendJson(res, 404, { error: 'Пользователь не найден' });
        return;
      }

      if (!secretsEqual(userAccount.secret, secret)) {
        sendJson(res, 401, { error: 'Неверный secret' });
        return;
      }

      if (userAccount.isBanned) {
        sendJson(res, 403, { error: 'Пользователь заблокирован' });
        return;
      }

      const params = text.trim().split(/\s+/);
      const cmd = params[0].replace(/^\//, '').toLowerCase();
      const replyedUserID = params[1] || null;
      const replyedUserAccount = replyedUserID ? await users.read(replyedUserID) : null;
      let responseBody = {};

      console.log({ id: userID, nick: userAccount.nick, text: params.join(' ') });

      const context = {
        platform: 'web',
        send: async message => {
          responseBody = { message };
        },
        text,
        cmd,
        args: params.slice(1),
        account: userAccount,
        reply: {
          text: null,
          account: replyedUserAccount
        }
      };

      const responseText = await executeCommand(context);

      if (responseText) responseBody = { message: responseText };
      sendJson(res, 200, responseBody);
    } catch (error) {
      console.error(error);
      if (!res.headersSent) sendJson(res, 500, { error: 'Внутренняя ошибка сервера' });
    }
  });
});

const PORT = Number(process.env.PORT) || 3333;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
