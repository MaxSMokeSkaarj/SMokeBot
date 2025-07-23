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

      let user = await users.read(id.toString());
      if (!user) user = await users.create(id.toString());

      // Проверка secret
      // Предполагается, что в объекте user есть поле secret.
      // Если его нет, нужно реализовать механизм хранения и проверки secret в базе данных.
      if (user.secret !== secret) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Неверный secret' }));
        return;
      }

      if (user.isBanned) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Пользователь заблокирован' }));
        return;
      }

      const params = text.split(' ');
      const cmd = params[0].replace(/^\//, '').toLowerCase();
      let response = {};

      if (cmd.startsWith('смоук')) {
        const textContent = params.slice(1).join(' ').toLowerCase();
        response = { message: IHABot(textContent) };
      } else {
        const commands = await getCommandList();
        
        if (!commands.some(command => command === cmd)) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Команда не найдена' }));
          return;
        }

        const modulePath = `./lib/commands/${cmd}.js`;
        const mtime = (await stat(modulePath)).mtime;
        const { command } = await import(`${modulePath}?${mtime}`);

        console.log({ id, nick: user.nick, text: params.join(' ') });

        // Выполнение команды и захват ответа
        const ctx = {
          reply: (message) => {
            response = { message };
          }
        };

        await command({ ctx, user, params });
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(response));
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