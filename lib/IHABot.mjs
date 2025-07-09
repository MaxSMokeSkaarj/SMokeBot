import {distance} from 'fastest-levenshtein'
import {readFileSync} from 'fs'
//const leven = require('fast-levenshtein');

/**
 * реализация базы IHABot.
 * @param {string} text - Текст от пользователя
 * @returns {string} Ответ бота
 */

export const bot = (text) => {
  let IHADB = readFileSync("txt/answer_databse.bin.old", "utf-8").split("\n");
  let unfolding = [];
  for (let i of IHADB) {
    unfolding.push(i.split("\\"));
  }
  for (let i of unfolding) {
    let similarity = distance(text, i[0]);
    i[2] = similarity;
  }
  unfolding = unfolding.sort((a, b) => a[2] - b[2]).slice(0, 5);
  let rand = Math.floor(Math.random() * unfolding.length);
  if (unfolding[rand] == undefined) {
    return "Мне нечего ответить";
  } else {
    return unfolding[rand][1];
  }
};
