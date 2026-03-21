import http from 'http';
import { readdir, stat } from 'fs/promises';
import process from 'process';
import { basename, extname } from 'path';
import { users } from './lib/db.js';
import { bot as IHABot } from './lib/IHABot.js';

const getCommandList = async () => {
  const files = await readdir('lib/commands');
  const commands = files
    .filter((file) => {
      const ext = extname(file);
      return ext === '.js';
    })
    .map((file) => {
      const ext = extname(file);
      return basename(file, ext);
    });

  return commands;
};

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
      let responseBody = {};

      if (cmd.startsWith('смоук')) {
        const textContent = params.slice(1).join(' ').toLowerCase();
        responseBody = { message: IHABot(textContent) };
      } else {
        const commands = await getCommandList();
        
        if (!commands.some(command => command === cmd)) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Команда не найдена' }));
          return;
        }

        const replyedUserID = params[1] || null;
        let replyedUserAccount = replyedUserID ? await users.read(replyedUserID) : null;

        console.log({ id: userID, nick: userAccount.nick, text: params.join(' ') });

        const modulePath = `./lib/commands/${cmd}.js`;
        const mtime = (await stat(modulePath)).mtime;
        const { command } = await import(`${modulePath}?${mtime}`);

        const originalUserAccount = JSON.stringify(userAccount);
        const originalReplyAccount = replyedUserAccount ? JSON.stringify(replyedUserAccount) : null;

        const context = {
          platform: "web",
          text: inText,
          cmd: cmd,
          args: params.slice(1),
          account: userAccount,
        };

        const responseText = await command(context);

        if (JSON.stringify(userAccount) !== originalUserAccount) {
          await users.update(userID, userAccount);
        }

        if (replyedUserAccount && JSON.stringify(replyedUserAccount) !== originalReplyAccount) {
          await users.update(replyedUserAccount.id, replyedUserAccount);
        }

        if (responseText) {
          responseBody = { message: responseText };
        }
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