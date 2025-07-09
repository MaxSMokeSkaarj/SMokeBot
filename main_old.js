'use strict';
require('dotenv').config()
require('colors');
//require('log-timestamp');
console.log("Startung SMoke bot v2.3.1...");

console.log("Iniciate dependes...");

const { VK } = require('vk-io');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const leven = require('fast-levenshtein');
//const tcp = require('tcp-ping');
//const typeOf = require('typeof');
const tts = require('google-tts-api');
const rq = require('prequest');
//const imgu = require("imgur");
const Timer = require('tiny-timer');

//const newvk = require('./lib/vk.js'); 
const users = require('./json/users.json');
const buisnesses = require('./json/buisnesses.json');
const conf = require('./json/conf.json');
const cars = require('./json/cars.json');
const houses = require('./json/houses.json.bak');
const phones = require('./json/phones.json');
const pets = require('./json/pets.json');
const ts = require('./lib/addon.js');
const getStatus = require('./lib/getStatus.js');

const timer = new Timer();
timer.on('tick', (ms) => console.log('tick', ms));
timer.on('done', () => console.log('done!'));
timer.on('statusChanged', (status) => console.log('status:', status));

console.log("Getting data...");

/* const gtoken = conf[0].gtoken;
const utoken = conf[0].utoken;
const otoken = conf[0].otoken; */
const gtoken = process.env.VK_TOKEN


let help = fs.readFileSync('txt/help.txt', 'utf8');
let about = fs.readFileSync('txt/about.txt', 'utf8');
let phoneshop = fs.readFileSync('txt/phoneshop.txt', 'utf8');
let petshop = fs.readFileSync('txt/petshop.txt', 'utf8');
let carshop = fs.readFileSync('txt/carshop.txt', 'utf8');
let houseshop = fs.readFileSync('txt/houseshop.txt', 'utf8');
let buisshop = fs.readFileSync('txt/buisshop.txt', 'utf8');
const ver = conf.ver;
let group = new VK({
	token: gtoken
});

/* let user = new VK({
	token: utoken
});
let online = new VK({
	token: otoken
}); */

setInterval( () => {
	help = fs.readFileSync('txt/help.txt', 'utf8');
	about = fs.readFileSync('txt/about.txt', 'utf8');
	carshop = fs.readFileSync('txt/carshop.txt', 'utf8');
	houseshop = fs.readFileSync('txt/houseshop.txt', 'utf8');
	buisshop = fs.readFileSync('txt/buisshop.txt', 'utf8');
}, 1000);

let readline = require('readline');
let rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: true
});
rl.on('line', function (line) {
	process.stdout.write('\n>');
	try {
		const result = eval(line);
		if (typeof (result) === 'string') {
			return process.stdout.write(`Type: string\nResult: ${result}\n`);
		} else if (typeof (result) === 'number') {
			return process.stdout.write(`Type: number\nResult: ${result}\n`);
		} else if (typeof (result) === 'boolean') {
			return process.stdout.write(`Type: boolean\nResult: ${result}\n`);
		} else {
			return process.stdout.write(`${typeof (result)}: ${JSON.stringify(result, null, '\t')}\n`);
		};
	} catch (e) { console.log(e); };
});

Array.prototype.random = function () {
	return this[Math.floor(this.length * Math.random())];
};

function random2() {
	let answers = ["1", "2", "3", "4", "5", "6"];
	let rand = Math.floor(Math.random() * answers.length)
	return rand;
}

function random() {
	let answers = ["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9", "1", "1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "1.9", "2"];
	let rand = Math.floor(Math.random() * answers.length)
	return rand;
}

function checkbanned(message) {
	let id = message.senderId
	if (id < 0) return;
	let user = users.find(x => x.id === message.senderId)
	if (user && user.isBanned == true) return;
}

function bot(message) {
	let IHADB = fs.readFileSync('txt/answer_databse.bin', 'utf-8').split("\n")
	let text = message.text
	let unfolding = []
	for (let i of IHADB) {
		unfolding.push(i.split("\\"))
	}
	for (let i of unfolding) {
		let similarity = leven.get(text, i[0])
		i[2]=similarity
	}
	unfolding = unfolding.sort((a, b) => a[2] - b[2]).slice(0, 5)
	let rand = Math.floor(Math.random() * unfolding.length)
	if (unfolding[rand] == undefined) {
		message.reply("Мне нечего ответить")
	} else {
		message.reply(unfolding[rand][1])
	}
}

function buisIncome () {
	for (let i in users) {
		for (let j in buisnesses) {
			if (users[i].buisness == buisnesses[j].name) {
				users[i].cash += buisnesses[j].income
				group.api.messages.send({user_id: users[i].id, message: `Вам пришла прибыль с бизнесa: ${buisnesses[j].income} SMokeCoin'ов`})
			}
		}
	}
}

setInterval(buisIncome, 21600000)

console.log("Send message about startup....")

group.api.messages.send({ user_id: 393830101, message: "Я запущен", v: 5.81 });

console.log("bot running");

fs.watch('./main.js', (err, edited) => {
	if (edited) {
		 conf.ver = `2.3.${Number(new Date())}`
		fs.writeFileSync('json/conf.json', JSON.stringify(conf, null, '\t'));
		console.log('Restart!!!!');
		process.exit();
	}
});

/*newvk.getLongPollServer(res => {
	let text = res.object.text
	text = text.split(" ")
	if (text[0] == "!пинг") message.send("pong")//temp
})*/

group.updates.hear(/^(?:Начать)$/i, (message) => {
	let id = message.senderId
	let user = users.find(x=>x.id===id)
	if (user == undefined) {
		group.api.call('users.get', {user_ids: id}).then(res => {
		users.push({
			id: id,
			uid: users.length,
			name: res[0].first_name,
			surname: res[0].last_name,
			nick: "Новичок",
			cash: 0,
			car: "Нет",
			house: "Нет",
			phone: "Нет",
			pet: "Нет",
			isAdmin: false,
			isBanned: false,
			banReason: null
		});
		fs.writeFileSync('json/users.json', JSON.stringify(users, null, '\t'));
			message.reply(`Привет ${res[0].first_name}, Ты успешно зарегестрировался в боте SMoke bot.
Напиши !помощь чтобы узнать мои команды!`, { disable_mentions: 1 });
		})
	}
})

/*group.updates.hear(/^(?:напиши|!напиши)\s([^]+)$/i, (message) => {
	var id = message.senderId
	let user = users.find(x => x.id === id)
	let text = message.$match[1]
	rq("http://192.168.179.134:14228/api?message=" + encodeURIComponent("Напиши ") + encodeURIComponent(text)).then(res => {
		message.reply(`@id${user.id} (${user.nick}), ${res}`, { disable_mentions: 1 })
	})
})*/

group.updates.hear(/^(?:!servers|!сервера)$/i, async (message) => {
  let servers = require('./json/servers.json');
  let msg = "Сервера:\n";

  let messages;
  messages = (await Promise.allSettled(servers.map(srv => {
    return new Promise((resolve, reject) =>  getStatus(srv.port, (err, status) => {
      if (err) return reject({srv: srv.name, status: false});
      resolve({srv: srv.name, status: true});
    }) )
  })))
  .map(state => {
    if (state.status === "rejected") return `${state.reason.srv}: offline`;
    return `${state.value.srv}: online`
  })
  .join("<br>");
 message.send(messages);
})

group.updates.hear(/^(?:!inchat|!вчат)\s([^]+)$/i, (message) => {
	let id = message.senderId
	let user=users.find(x=>x.id===id)
	if (user.isAdmin == true) {
		let raw = message.$match[1]
		let cid = raw.split(" ")[0]
		let text = `*id${id} (${role}) отправил(а) сообщение в этот чат: ${raw.split(" ")[1]}`
		group.api.messages.send({ chat_id: cid, message: text, disable_mentions: 1 })
		message.reply(`Сообщение отправленно`)
	}
})

group.updates.hear(/^(?:inpm|!влс)\s([^]+)$/i, (message) => {
	let id = message.senderId
	let user=users.find(x=>x.id===id)
	if (user.isAdmin == true) {
		let raw = message.$match[1]
		let cid = raw.split(" ")[0]
		let text = `*id${id} (${role}) отправил(а) сообщение в этот чат: ${raw.split(" ")[1]}`
		group.api.messages.send({ chat_id: cid, message: text, disable_mentions: 1 })
		message.send(`Сообщение отправленно`)
	}
})

group.updates.hear(/^(?:!encode|!шифр)\s([^]+)$/i, (message) => {
	checkbanned(message)
	let text = message.$match[1];
	message.reply(`&#65534;${text}`)
})

group.updates.hear(/^(?:!unlink|!разлинк)\s([^]+)$/i, (message) => {
	checkbanned(message)
	group.api.utils.checkLink({ url: message.$match[1] }).then(res => {
		if (res.status == "processing") { message.reply("Ссылка проверяется ВКонтакте, повторите попытку позже") }
		else if (res.status == "banned") { message.reply(`Исходная ссылка:  ${message.$match[1]}, Разлинк: ${res.link}, статус : Заблокирована`, { disable_mentions: 1 }); }
		else if (res.status == "not_banned") { message.reply(`Исходная ссылка:  ${message.$match[1]}, Разлинк: ${res.link}, статус : Не заблокирована`, { disable_mentions: 1 }); }
	})
})

/*group.updates.hear(/^(?:imgur|!imgur|имгур|!имгур)$/i, (message) => {
	checkbanned(message)
	imgu.uploadFile(message.attachments[0].largePhoto)
		.then(function (json) {
			message.send(json.data.link);
		})
		.catch(function (err) {
			message.send(err.message);
		});
})*/Number(((min + mid + max) / 3).toFixed(1))

group.updates.hear(/^(?:!top|!топ)\s?([^]+)$/i, (message) => {
	checkbanned(message)
	let text = "Топ игроков:\n"
	let count = message.$match[1]
	count = Number.parseInt(count)
	if (count > 0 ) {
		let top = users.sort((a, b) => b.cash - a.cash).slice(0, count)
		for (let i = 0; i < top.length; i++) {
			text += `${i+1}. *id${top[i].id} (${top[i].nick}): ${top[i].cash}\n`
		}
		message.send(text, { disable_mentions: 1 });
		let users = users.sort((a, b) => a.uid - b.uid)
	} else {
		return;
	}
})

group.updates.hear(/^(?:!addmoney|!выдать)\s?([^]+)$/i, message => {
	checkbanned(message)
	let id1 = message.replyMessage.senderId
	let user1 = users.find(x => x.id === id1)
	let id2 = message.senderId
	let user2 = users.find(x => x.id === id2)
	let count = message.$match[1]
	count = Number.parseInt(count)
	if (user2.isAdmin == true) {
		user1.cash += count
		message.reply(`Выданно @id${id1} (${user1.nick}) ${count} SMokeKoin'ов`, { disable_mentions: 1 })
		fs.writeFileSync('json/users.json', JSON.stringify(users, null, '\t'));
	} else {
		message.reply("🚫 Доступ к команде запрещен.");
	}
})

group.updates.hear(/^(?:!removemoney|!забрать)\s?([^]+)$/i, message => {
	checkbanned(message)
	let id1 = message.replyMessage.senderId
	let user1 = users.find(x => x.id === id1)
	let id2 = message.senderId
	let user2 = users.find(x => x.id === id2)
	let count = message.$match[1]
	count = Number.parseInt(count)
	if (user2.isAdmin == true) {
		user1.cash -= count
		message.reply(`Отнято @id${id1} (${user1.nick}) ${count} SMokeKoin'ов`, { disable_mentions: 1 })
		fs.writeFileSync('json/users.json', JSON.stringify(users, null, '\t'));
	} else {
		message.reply("🚫 Доступ к команде запрещен.");
	}
})

group.updates.hear(/^(?:!мой айпи|!my ip)$/i, (message, next) => {
	checkbanned(message)
	if (message.peerId < 2000000000) message.send({ user_id: message.senderId, message: 'Вычисляем ваш Айпи Адрес. Может Занять До минуты' });
	if (message.peerId > 2000000000) message.send({ chat_id: message.chatId, message: 'Вычисляем ваш Айпи Адрес. Может Занять До минуты' });

	setTimeout( function () {
		let aipi = `192.168`
		aipi += "."
		aipi += `${random(0, 255)}`
		aipi += '.'
		aipi += `${random(0, 255)}`

		if (message.peerId < 2000000000) message.reply({ user_id: message.senderId, message: 'Ваш айпи ' + aipi });
		if (message.peerId > 2000000000) message.reply({ chat_id: message.chatId, message: 'Ваш айпи ' + aipi });

	}, random(20000, 59999));
})

group.updates.hear(/^(?:!время|!time)$/i, message => {
	checkbanned(message)
	message.reply(`Время с запуска бота: ${ts[0].w} недель, ${ts[0].d} дней, ${ts[0].h} часов, ${ts[0].m} минут, ${ts[0].s} секунд\nВсего отработал: ${ts[1].w} недель, ${ts[1].d} дней, ${ts[1].h} часов, ${ts[1].m} минут, ${ts[1].s} секунд\nЛокальное время: ${ts[2]}`)
})

group.updates.hear(/^(?:!give|!поделиться)\s?([^]+)$/i, message => {
	checkbanned(message)
	let id1 = message.senderId
	let id2 = message.replyMessage.senderId
	let user1 = users.find(x => x.id === id1)
	let user2 = users.find(x => x.id === id2)
	let add = message.$match[1]
	add = Number.parseInt(add)
	if (user1.cash - add >= 0 && add >= 0) {
		user1.cash -= add
		user2.cash += add
		message.reply(`@id${id1} (${user1.nick}) дал @id${id2} (${user2.nick}) ${add} SMokeKoin'ов`, { disable_mentions: 1 })
		fs.writeFileSync('json/users.json', JSON.stringify(users, null, '\t'))
	}
	else if (user1.cash - add < 0) { message.reply("Не хватает денег") }
	else if (add < 0) { message.reply("Нельзя передать отрицательное число") }
})


group.updates.hear(/^(?:!dice|!кости)$/i, message => {
	checkbanned(message)
	let id = message.senderId
	let user = users.find(x => x.id === id)
	let rand = Math.floor(Math.random() * (6 - 1) + 1)
	if (rand == 1) { message.reply(`@id${id} (${user.nick}), выпало 1`, { disable_mentions: 1 })}
	else if (rand == 2) { message.reply(`@id${id} (${user.nick}), выпало 2`, { disable_mentions: 1 })}
	else if (rand == 3) { message.reply(`@id${id} (${user.nick}), выпало 3`, { disable_mentions: 1 })}
	else if (rand == 4) { message.reply(`@id${id} (${user.nick}), выпало 4`, { disable_mentions: 1 })}
	else if (rand == 5) { message.reply(`@id${id} (${user.nick}), выпало 5`, { disable_mentions: 1 })}
	else if (rand == 6) { message.reply(`@id${id} (${user.nick}), выпало 6`, { disable_mentions: 1 })}
})

group.updates.hear(/^(?:!jackpot|!джекпот)\s?([^]+)$/i, (message) => {
	checkbanned(message)
	let bet = message.$match[1];
	let user = users.find(x => x.id === message.senderId);
	if (bet == "все" || bet == "Все"|| bet == "всё" || bet == "Всё") { bet = user.cash }
	let cmb = user.cash - bet;
	if (cmb >= 0 && bet > 0) {
		user.cash -= bet;
		let rand = Math.floor(Math.random() * (20 - 1) + 1)
		//if (user.id == 393830101) {rand = 20}
		if (rand < 10) {
			message.reply(`@id${user.id} (${user.nick}) Вы проиграли, выпало ${rand / 10}!`, { disable_mentions: 1 });
			user.cash += bet * (rand / 10);
		} else if (rand == 10) {
			message.reply(`@id${user.id} (${user.nick}) Вы остались при своём`);
			user.cash += bet * (rand / 10);
		} else if (rand > 10) { 
			message.reply(`@id${user.id} (${user.nick}) Вы выиграли, выпало ${rand / 10}!`, { disable_mentions: 1 });
			user.cash += bet * (rand / 10);
		} else {
			message.reply(`@id${user.id} (${user.nick}) произошел сбой. Ваша ставка будет вам возвращена.`, { disable_mentions: 1 });
			user.cash += bet;
		}
	} else if (bet < 0) {
		message.reply(`@id${user.id} (${user.nick}) ставка не может быть ниже 0!`, { disable_mentions: 1 })
	} else if (cmb < 0) {
		message.reply(`@id${user.id} (${user.nick}) не хватает денег!`, { disable_mentions: 1 })
	}
	user.cash = Math.floor(user.cash)
	fs.writeFileSync('json/users.json', JSON.stringify(users, null, '\t'));
});

group.updates.hear(/^(?:!смоук,|!смоук|!smoke|!smoke,)\s?([^]+)$/i, (message) => {
	checkbanned(message)
	bot(message)
})

group.updates.hear(/^(?:!kiss|!поцеловать)$/i, (message) => {
	checkbanned(message)
	let firstid = message.senderId
	let secondid = message.replyMessage.senderId
	let user1 = users.find(x => x.id === firstid)
	let user2= users.find(x => x.id === secondid)
	message.reply(`@id${firstid} (${user1.nick}) 💕поцеловал(а)💕 @id${secondid} (${user2.nick})`, { disable_mentions: 1 })
})

group.updates.hear(/^(?:!пожать руку|!shake hands)$/i, (message) => {
	checkbanned(message)
	let firstid = message.senderId
	let secondid = message.replyMessage.senderId
	let user1 = users.find(x => x.id === firstid)
	let user2 = users.find(x => x.id === secondid)
	message.reply(`@id${firstid} (${user1.nick}) 🤝пожал(а) руку🤝 @id${secondid} (${user2.nick})`, { disable_mentions: 1 })
})

group.updates.hear(/^(?:!ударить|!bite)$/i, (message) => {
	checkbanned(message)
	let firstid = message.senderId
	let secondid = message.replyMessage.senderId
	let user1 = users.find(x => x.id === firstid)
	let user2 = users.find(x => x.id === secondid)
	message.reply(`@id${firstid} (${user1.nick}) 👊ударил(а)👊 @id${secondid} (${user2.nick})`, { disable_mentions: 1 })
})

group.updates.hear(/^(?:!лайк|!like)$/i, (message) => {
	checkbanned(message)
	let firstid = message.senderId
	let secondid = message.replyMessage.senderId
	let user1 = users.find(x => x.id === firstid)
	let user2 = users.find(x => x.id === secondid)
	message.reply(`@id${firstid} (${user1.nick}) 👍понравились слова(фото)👍 @id${secondid} (${user2.nick})`, { disable_mentions: 1 })
})

group.updates.hear(/^(?:!дизлайк|!dislike)$/i, (message) => {
	checkbanned(message)
	let firstid = message.senderId
	let secondid = message.replyMessage.senderId
	let user1 = users.find(x => x.id === firstid)
	let user2 = users.find(x => x.id === secondid)
	message.reply(`@id${firstid} (${user1.nick}) 👎не понравились слова(фото)👎 @id${secondid} (${user2.nick})`, { disable_mentions: 1 })
})

group.updates.hear(/^(?:!обнять|!hug)$/i, (message) => {
	checkbanned(message)
	firstid = message.senderId
	secondid = message.replyMessage.senderId
	let user1 = users.find(x => x.id === firstid)
	let user2 = users.find(x => x.id === secondid)
	message.reply(`@id${firstid} (${user1.nick}) 😊обнял(а)😊 @id${secondid} (${user2.nick})`, { disable_mentions: 1 })
})

group.updates.hear(/^(?:!удалить ник|!delete nick)$/i, (message) => {
	checkbanned(message)
	let id = message.senderId
	let user = users.find(x => x.id === id)
	let old = user.nick
	user.nick = `${user.name} ${user.surname}`
	fs.writeFileSync('json/users.json', JSON.stringify(users, null, '\t'));
	message.reply(`@id${id} (${old}) Ваш ник сброшен`, { disable_mentions: 1 })
})

group.updates.hear(/^(?:!гексек|!gexec)\s([^]+)$/i, (message) => {
	checkbanned(message)
	let id = message.senderId
	let user = users.find(x => x.id === id)
	if (user.isAdmin == true) {
		exec(message.$match[1], (error, stdout, stderr) => {
			if (error) {
				message.send(`exec error: ${error}`);
				return;
			}
			if (stdout) { message.send(`stdout: ${stdout}`); }
			if (stderr) { message.send(`stderr: ${stderr}`); }
		})
	} else {
		message.send("Доступ запрещен")
	}
})

group.updates.hear(/^(?:!онлайн|!online)$/i, (message) => {
	checkbanned(message)
	let i = 0
	if (!message.isChat) message.reply(`команда работает только в беседе!`);
	group.api.messages.getConversationMembers({ peer_id: message.peerId, fields: "online", v: 5.81 })
		.then(async function (response) {
			let text = `Cейчас онлайн:\n\n`;
			await response.profiles.map(e => {

				if (e.id < 1) return;
				if (e.online != 0) { ++i; text += `*id${e.id} (${e.first_name.slice(0, 1)}. ${e.last_name})\n`; return e[1] }
			})
			group.api.messages.send({ chat_id: message.chatId, message: text, disable_mentions: 1, v: 5.81 })
		})
});

group.updates.hear(/^(?:!say|!скажи)([^]+)$/i, (message) => {
	checkbanned(message)
	tts(message.$match[1], 'ru', 1)
		.then(function (url) {
			message.sendAudioMessage(url);
		})
});

group.updates.hear(/^(?:!wiki|!вики)\s(.*)$/i, (message, bot) => {
	checkbanned(message)
	let args = message.text.match(/^(?:wiki|вики|!wiki|!вики)\s?(.*)$/i);

	function isEmpty(str) {
		if (0 == 9) return true;
		return false;
	}
	rq("https://ru.wikipedia.org/w/api.php?action=opensearch&search=" + encodeURIComponent((args[1] ? args[1] : "ВКонтакте")) + "&meta=siteinfo&rvprop=content&format=json")
		.then((res) => {
			if (isEmpty(res[2][0])) {
				if (isEmpty(res[2][1])) {
					if (isEmpty(res[2][2])) message.reply('Статья не полная, либо её нету.\n\nСсылка: ' + res[3][0]);
				} else {
					message.reply(`Информация о ${message.$match[1]}\n------------\n${res[2][0]}\n------------\nСсылка: ${res[3][1]}`);
				}
			} else {
				message.reply(`Информация о ${message.$match[1]}\n\n${res[2][0]}\n\nСсылка: ${res[3][0]}`);
			}
		});
});

group.updates.hear(/^(?:!scr|!скр)\s(.*)$/i, (message) => {
	checkbanned(message)
	if (message.$match[1] != "pornhub.com") {
		message.sendPhoto("http://mini.s-shot.ru/1920/1080/png/?" + message.$match[1])
	} else {
		message.reply("Иш какой прыткий, Порносайты не скриню!");
	}
});

group.updates.hear(/^(?:!длина|!length)$/i, (message) => {
	checkbanned(message)
	let txt = message.replyMessage.text
	let length = txt.length
	message.reply("Длина сообщения: " + length);
});

group.updates.hear(/^(?:!Version|!Ver|!V|!в|!вер|!версия)$/i, (message) => {
	checkbanned(message)
	message.reply(ver);
});

group.updates.hear(/^(?:!Help|!h|!Commands|!помощь|!команды)$/i, (message) => {
	checkbanned(message)
	message.reply(help);
});

group.updates.hear(/^(?:!About|!оботе)$/i, (message) => {
	checkbanned(message)
	message.reply(about);
});

group.updates.hear(/^(?:!Ролтон|!ролтон)$/i, (message) => {
	checkbanned(message)
	let id = message.senderId
	message.reply("Я понял, запускаю.");
	setTimeout(() => {
		message.reply(`@id${id} (@id${id}), ваш ролтон заварился, приятного аппетита)))`, "photo-185367047_457239049\nОцените ролтон!");
	}, 300000);
});

group.updates.hear(/^(?:!admin|!админ)$/i, (message) => {
	checkbanned(message)
	let id = message.senderId;
	let aid = message.replyMessage.senderId
	let user = users.find(x => x.id === aid);
	if (id == "393830101") {
		if (user.isAdmin != true && aid > 0) {
			user.isAdmin = true
			fs.writeFileSync('json/users.json', JSON.stringify(users, null, '\t'));
			message.reply("@id" + aid + "(Пользователь) теперь администратор")
		}
	} else {
		message.reply("Доступ к команде запрещен.")
	}
});

group.updates.hear(/^(?:!geval|!гевал)\s?([^]+)$/i, (message) => {
	checkbanned(message)
	const id = message.senderId;
	let user = users.find(x => x.id === id)
	if (user.isAdmin == true) {
		try {
			const result = eval(message.$match[1].replace(/token/, ''));
			if (typeof (result) === 'string') {
				message.reply(`Type: string\nResult: ${result}`);
			} else if (typeof (result) === 'number') {
				message.reply(`Type: number\nResult: ${result}`);
			} else if (typeof (result) === 'boolean') {
				message.reply(`Type: boolean\nResult: ${result}`);
			} else {
				message.reply(`${typeof (result)}: ${JSON.stringify(result, null, '\t')}`);
			}
		} catch (e) {
			return e;
			message.reply(`Error: ${e.toString()}`);
		}
	}
	else {
		message.reply("🚫 Доступ к команде запрещен.");
	}
});

/* user.updates.hear(/^(?:!ueval|!уевал)\s?([^]+)$/i, (message) => {
	checkbanned(message)
	const id = message.senderId;
	let user = users.find(x => x.id === id)
	if (user.isAdmin == true) {
		try {
			const result = eval(message.$match[1].replace(/token/, ''));
			if (typeof (result) === 'string') {
				message.reply(`Type: string\nResult: ${result}`);
			} else if (typeof (result) === 'number') {
				message.reply(`Type: number\nResult: ${result}`);
			} else if (typeof (result) === 'boolean') {
				message.reply(`Type: boolean\nResult: ${result}`);
			} else {
				message.reply(`${typeof (result)}: ${JSON.stringify(result, null, '\t')}`);
			}
		} catch (e) {
			return e;
			message.reply(`Error:
		${e.toString()}`);
		}
	}
	else {
		message.reply("🚫 Доступ к команде запрещен.");
	}
}); */

group.updates.hear(/^(?:!coin|!flip|!монетка|!флип)$/i, (message) => {
	checkbanned(message)
	function coinToss() {
		return Math.floor(Math.random() * 2);
	}
	coinToss();
	if (coinToss() == "1") {
		message.reply("Выпал орёл");
	} else if (coinToss() == "0") {
		message.reply("Выпала решка");
	}
});

group.updates.hear(/^(?:!Кик|!Kick)\s?([^]+)$/i, (message) => {
	checkbanned(message)
	let id = message.senderId
	let kid = message.replyMessage.senderId
	if (kid == 393830101 || kid == -168597885) { message.send("Нельзя кикнуть создателя или самого бота:)");return 0}
	let reason = message.$match[1]
	let role = users.find(x => x.id === id).isAdmin
	if (!message.$match[1]) { message.reply(`Использование: !кик user_id reason\n или в ответ на сообщение: !кик причина`) }
	if (role == true) {
		group.api.messages.removeChatUser({ chat_id: message.chatId, member_id: kid, v: 5.81 })
			.catch(e => message.send(`Произошла ошибка: ${e}`))
			.then(res => message.send(`[id${id}|Администратор] кикнул [id${kid}|Пользователя] по причине ${reason}`))
	}
});

group.updates.hear(/^(?:!идкик|!idkick)\s?([^]+)$/i, (message) => {
	checkbanned(message)
	let id = message.senderId
	let raw = message.text
	let kid = raw.split(" ")[1]
	let reason = raw.split(" ")[2]
	let role = users.find(x => x.id === id).isAdmin
	if (!message.$match[1]) { message.reply(`Использование: !кик user_id reason\n или в ответ на сообщение: !кик причина`) }
	if (role == true) {
		message.send(`[id${id}|Администратор] кикнул [id${kid}|Пользователя] по причине ${reason}`)
		group.api.messages.removeChatUser({ chat_id: message.chatId, member_id: kid, v: 5.81 })
			.catch(e => message.send(`Произошла ошибка: ${e}`))
			.then(res => message.send(`Выполнено`))
	}
});

group.updates.hear(/^(?:!пермбан|!permban|!pban|!пбан)\s?([^]+)$/i, (message) => {
	checkbanned(message)
	let kid = message.replyMessage.senderId;
	let id = message.senderId;
	let user = users.find(x => x.id === id)
	if (user.isAdmin == true) {
		group.api.messages.removeChatUser({ chat_id: 1, member_id: kid, v: 5.81 });
		u.api.groups.ban({ group_id: 168597885, owner_id: kid, reason: 0, comment: "PermBan от админа @id" + id, comment_visible: 1, v: 5.81 });
		message.reply(`@id${kid} (Пользователь) был забанен навечно`)
	} else {
		message.reply("🚫 Доступ к команде запрещен.");
	}
});

/* user.updates.hear(/^(?:!invite|!инвайт)\s?([^]+)$/i, (message) => {
	checkbanned(message)
	let iid = message.replyMessage.senderId
	let id = message.senderId;
	let cid = message.chatId;
	let user = users.find(x => x.id === id)
	if (user.isAdmin == true) {
		u.api.messages.addChatUser({ chat_id: cid, user_id: iid, v: 5.81 });
	} else {
		message.reply("🚫 Доступ к команде запрещен.");
	}
}); */

group.updates.hear(/^(?:!cc|!цц)\s?([^]+)$/i, (message) => {
	checkbanned(message)
	let text = message.$match[1];
	if (!text) message.reply("Введите ссыслку");
	group.api.utils.getShortLink({ url: text }).then(function (res) {
		message.reply(`Сокращенная ссылка: ${res.short_url}\n\nИсходная ссылка: ${message.$match[1]}`);
	});
});

/*group.updates.hear(/^(?:!Admins|!админы|admins|админы)$/i, (message) => {
	checkbanned(message)
	let nick = message.$match[1]
	nick = nick.replace('\n', '')
	message.reply("@id" + adm[0] + "\n" + "@id" + adm[1] + "\n" + "@id" + adm[2] + "\n" + "@id" + adm[3] + "\n" + "@id" + adm[4] + "\n");
});*/

group.updates.hear(/^(?:!ник|!nick|!никнейм|!nickname)\s?([^]+)$/i, (message) => {
	let id = message.senderId
	let user = users.find(x=>x.id===id)
	let oldnick = user.nick
	let newnick = message.$match[1]
	if (user) {
		user.nick = newnick
		fs.writeFileSync('json/users.json', JSON.stringify(users, null, '\t'));
		message.reply(`@id${id} (${oldnick}), ваш ник изменен на ${newnick}`, { disable_mentions: 1 })
	} else if (!user) {
		message.reply(`Возможно, вы не зарегистрированы. Зарегистрируйтесь в боте для работы с ним`)
	} else {
		message.reply(`Произошла ошибка, пожалуйста, обратитесь к создателю бота`)
	}
})
group.updates.hear(/^(?:!aboutme|!обомне|!профиль|!проф)$/i, (message) => {
	checkbanned(message)
	let id = message.senderId
	let user=users.find(x=>x.id===id)
	if (user) {
		message.reply("Ваш ник: " + user.nick +  "\nВаш уникальный ID: " + user.uid + "\nВаш баланс: " + user.cash + "\nВаш дом: " + user.house + "\nВаша машина: " + user.car + "\nТелефон: " + user.phone + "\nПитомец: " + user.pet);
	} else if (!user) {
		message.reply("Возможно, вы не зарегистрированы. Зарегистрируйтесь в боте для работы с ним")
	} else {
		message.reply(`Произошла ошибка, пожалуйста, обратитесь к создателю бота`)
	}
});

group.updates.hear(/^(?:!майнить|!mine)$/i, (message) => {
	checkbanned(message);
	let id = message.senderId
	let user = users.find(x=>x.id===id)
	let oldnick = user.nick
	let newnick = message.$match[1]
	if(user) {
		let rand = Math.floor(Math.random() * (1000 - 10) + 10)
		user.cash += rand
		fs.writeFileSync('json/users.json', JSON.stringify(users, null, '\t'));
		message.reply(`@id${id} (${oldnick}), вы заработали ${rand}`, { disable_mentions: 1 })
	} else if (!user) {
		message.reply(`Возможно, вы не зарегистрированы. Зарегистрируйтесь в боте для работы с ним`)
	} else {
		message.reply(`Произошла ошибка, пожалуйста, обратитесь к создателю бота`)
	}
});

group.updates.hear(/^(?:!repeat|!повтори)\s?([^]+)$/i, (message) => {
	checkbanned(message)
	message.reply(message.$match[1]);
});

group.updates.hear(/^(?:!report|!репорт)\s?([^]+)$/i, (message) => {
	checkbanned(message)
	if (message.peerId == 2000000006) {
		message.reply("Репорт для этой беседы отключен");
	} else {
		message.reply("Репорт отправлен.")
		group.api.messages.send({ user_id: 393830101, message: "Пришел репорт от @id" + message.senderId + ": " + message.$match[1], v: 5.81 });
	}
});

group.updates.hear(/^(?:!clck|clck)\s?([^]+)$/i, (message) => {
	checkbanned(message)
	let text = message.$match[1];
	if (!text) message.reply("Введите ссылку");
	rq(`https://clck.ru/--?url=${text}`).then(res => {
		if (res) { message.reply(res); }
		else { message.reply(err) }
	})
});

group.updates.hear(/^(?:bitly)\s?([^]+)$/i, (message) => {
	checkbanned(message)
	let text = message.$match[1];
	if (!text) return message.send("Введите ссылку");
	rq("https://api-ssl.bitly.com/v3/shorten?access_token=5b4f6a981ac4becbd03981133081f00ffb96fa83&format=txt&longUrl=https://" + text).then(res => {
		message.send(res);
	})
});
/*
group.updates.hear(/^(?:!pets|!питомцы|pets|питомцы)$/i, (message) => {
	checkbanned(message)
	message.reply(petshop)
});

group.updates.hear(/^(?:!cars|!транспорты|cars|транспорты)$/i, (message) => {
	checkbanned(message)
	message.reply(carshop)
});

group.updates.hear(/^(?:!phones|!телефоны|phones|телефоны)$/i, (message) => {
	checkbanned(message)
	message.reply(phoneshop)
});

group.updates.hear(/^(?:!houses|!дома|houses|дома)$/i, (message) => {
	checkbanned(message)
	message.reply(houseshop);
});

group.updates.hear(/^(?:!car|!транспорт|car|транспорт)\s?([^]+)$/i, (message) => {
	checkbanned(message)
	let choice = message.$match[1];
	choice = Number.parseInt(choice)
	let user = users.find(x => x.id === message.senderId);
	let car = cars.find(x => x.id === choice)
	if (user.cash - car.price >= 0) {
		user.cash -= car.price
		user.car = car.name
		fs.writeFileSync('json/users.json', JSON.stringify(users, null, '\t'));
		message.reply(`Вы приoбрели ${user.car}`)
	} else if (car.stat == "vip") { message.reply("Это ВИП машина, нельзя ее купить")
	} else if (user.cash - car.price < 0) { message.reply("Не хватает денег") }
});

group.updates.hear(/^(?:!house|!дом|house|дом)\s?([^]+)$/i, (message) => {
	checkbanned(message)
	let choice = message.$match[1];
	choice = Number.parseInt(choice)
	let user = users.find(x => x.id === message.senderId);
	let house = houses.find(x => x.id === choice)
	if (user.cash - house.price >= 0) {
		user.cash -= house.price
		user.house = house.name
		fs.writeFileSync('json/users.json', JSON.stringify(users, null, '\t'));
		message.reply(`Вы приoбрели ${user.house}`)
	} else if (user.cash - house.price < 0) { message.reply("Не хватает денег") }
});

group.updates.hear(/^(?:!pet|!питомeц|pet|питомец)\s?([^]+)$/i, (message) => {
	checkbanned(message)
	let choice = message.$match[1];
	choice = Number.parseInt(choice)
	let user = users.find(x => x.id === message.senderId);
	let pet = pets.find(x => x.id === choice)
	if (user.cash - pet.price >= 0) {
		user.cash -= pet.price
		user.pet = pet.name
		fs.writeFileSync('json/users.json', JSON.stringify(users, null, '\t'));
		message.reply(`Вы приобрели ${user.pet}`)
	} else if (user.cash - pet.price < 0) { message.reply("Не хватает денег") }
});

group.updates.hear(/^(?:!phone|!телефон|телефон|phone)\s?([^]+)$/i, (message) => {
	checkbanned(message)
	let choice = message.$match[1];
	choice = Number.parseInt(choice)
	let user = users.find(x => x.id === message.senderId);
	let phone = phones.find(x => x.id === choice)
	if (user.cash - phone.price >= 0) {
		user.cash -= phone.price
		user.phone = phone.name
		fs.writeFileSync('json/users.json', JSON.stringify(users, null, '\t'));
		message.reply(`Вы приобрели ${user.phone}`)
	} else if (user.cash - phone.price < 0) { message.reply("Не хватает денег") }
});
*/

group.updates.hear(/^(?:!shop|!магазин)\s?([^]+)$/i, (message) => {
	checkbanned(message)
	let text = message.$match[1]
	let split1 = text.split(" ")[0]
	let split2 = text.split(" ")[1]
	let choice = text.split(" ")[2]
	choice =  Number.parseInt(choice)
	let id = message.senderId
	let user = users.find(x => x.id === id)
	if (split1 == "купить") {
		if (split2 == "дом") {
			for (let i in houses) {
				if (user.cash - houses[i].price >= 0 && houses[i].id == choice) {
					user.cash -= houses[i].price
					user.house = houses[i].name
					message.reply(`Вы купили ${user.house}`)
					fs.writeFileSync('json/users.json', JSON.stringify(users, null, '\t'))
					return 0
				} else if (user.cash - houses[i].price < 0) {
					message.reply(`Не хватает денег`)
					return 0
				}
			}
		} else if (split2 == "транспорт") {
			for (let i in cars) {
				if (user.cash - cars[i].price >= 0 && cars[i].id == choice) {
					user.cash -= cars[i].price
					user.car = cars[i].name
					message.reply(`Вы купили ${user.car}`)
					fs.writeFileSync('json/users.json', JSON.stringify(users, null, '\t'))
					return 0
				} else if (user.cash - cars[i].price < 0) {
					message.reply(`Не хватает денег`)
					return 0
				}
			}
		} else if (split2 == "телефон") {
			for (let i in phones) {
				if (user.cash - phones[i].price >= 0 && phones[i].id == choice) {
					user.cash -= phones[i].price
					user.phone = phones[i].name
					message.reply(`Вы купили ${user.phone}`)
					fs.writeFileSync('json/users.json', JSON.stringify(users, null, '\t'))
					return 0
				} else if (user.cash - phones[i].price < 0) {
					message.reply(`Не хватает денег `)
					return 0
				}
			}
		} else if (split2 == "бизнес") {
			for (let i in buisnesses) {
				if (user.cash - buisnesses[i].price >= 0 && buisnesses[i].id == choice) {
					user.cash -= buisnesses[i].price
					user.buisness = buisnesses[i].name
					message.reply(`Вы купили ${user.buisness}`)
					fs.writeFileSync('json/users.json', JSON.stringify(users, null, '\t'))
					return 0
				} else if (user.cash - buisnesses[i].price < 0) {
					message.reply(`Не хватает денег`)
					return 0
				}
			}
		} else if (split2 == "питомца") {
			for (let i in pets) {
				if (user.cash - pets[i].price >= 0 && pets[i].id == choice) {
					user.cash -= pets[i].price
					user.pet = pets[i].name
					message.reply(`Вы купили ${user.pet}`)
					fs.writeFileSync('json/users.json', JSON.stringify(users, null, '\t'))
					return 0
				} else if (user.cash - pets[i].price < 0) {
					message.reply(`Не хватает денег`)
					return 0
				}
			}
		} else {
			message.send("Неизвестное имущество!")
		}
	} else if (split1 == "продать") {
		if (split2 == "дом") {
			
		} else if (split2 == "транспорт") {
			
		} else if (split2 == "телефон") {
			
		} else if (split2 == "бизнес") {
			
		} else if (split2 == "питомца") {
			
		} else {
			message.send("Неизвестное имущество!")
		}
	} else if (split1 == "список")  {
		if (split2 == "домов") {
			message.reply(houseshop);
		} else if (split2 == "транспорта") {
			message.reply(carshop)
		} else if (split2 == "телефонов") {
			message.reply(phoneshop)
		} else if (split2 == "бизнесов") {
			message.reply(buisshop)
		} else if (split2 == "питомцев") {
			message.reply(petshop)
		} else {
			message.send("Неизвестное имущество!")
		}
	} else {
		message.reply("Неизвестная команда")
	}
})

group.updates.hear(/^(?:Профиль)$/i, (message) => {
	checkbanned(message)
	let id = message.replyMessage.senderId
	if (id) {
		let user = users.find(x => x.id === id)
		message.reply("Ник юзера: " + user.nick + ".\nДенег: " + user.cash + ",\nМашина: " + user.car + "\nДом: " + user.house + "\nТелефон: " + user.phone + "\nПитомец: " + user.pet)
	} else {
		message.reply("Этот пользователь не имеет аккаунта")
	}
})

group.updates.on(['chat_kick_user'], async (message, next) => {
	let user = await group.api.call('users.get', {
		user_id: message.eventMemberId
	})
	message.reply(`@id${message.eventMemberId} (${user[0].first_name} ${user[0].last_name}), был кикнут или вышел из беседы`);
	await next();
});

group.updates.on(['chat_invite_user'], async (message, next) => {
	let user = await group.api.call('users.get', {
		user_id: message.eventMemberId
	})
	message.reply(`@id${message.eventMemberId} (${user[0].first_name} ${user[0].last_name}), добро пожаловать в беседу, чтоб узнать команды бота напиши !помощь`);
	await next();
});

group.updates.on(['chat_invite_user_by_link'], async (message, next) => {
	let user = await group.api.call('users.get', {
		user_id: message.eventMemberId
	})
	message.reply(`@id${message.eventMemberId} (${user[0].first_name} ${user[0].last_name}), добро пожаловать в беседу, чтоб узнать команды бота напиши !помощь`);
	await next();
});

group.updates.on(['block_group_user'], async (message, next) => {
	let user = await group.api.call('users.get', {
		user_id: message.eventMemberId
	})
})

group.updates.hear(/(?:)$/i, (message) => {
	let id = message.senderId
	let user = users.find(x=>x.id === id);
	if (user == undefined && message.senderId > 0) {
		 group.api.call('users.get', {user_ids: id}).then(res => {
			users.push({
				id: id,
				uid: users.length,
				name: res[0].first_name,
				surname: res[0].last_name,
				nick: "Новичок",
				cash: 0,
				car: "Нет",
				house: "Нет",
				phone: "Нет",
				pet: "Нет",
				isAdmin: false,
				isBanned: false,
				banReason: null
			});
			fs.writeFileSync('json/users.json', JSON.stringify(users, null, '\t'));
			/*message.send(`Привет ${res[0].first_name},
			Ты успешно зарегестрировался в боте SMoke bot.
			Напиши !помощь чтобы узнать мои команды!`);*/
		})
	}
	try {
		if (message.replyMessage.senderId && message.replyMessage.senderId == "-168597885") {
			checkbanned(message)
			bot(message)
		}
	} catch (e) {return e}
});

group.updates.start();
// user.updates.start();
