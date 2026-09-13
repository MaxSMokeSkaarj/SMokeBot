import { get } from '../../net.js';



/**
 * @param {import('../../types.js').BotContext} ctx
 */
export const command = async (ctx) => {
  const text = ctx.args.join(' ');

  if (!text) return 'Напишите, что бы вы хотели найти на вики';

  console.log(await get(`https://ru.wikipedia.org/w/api.php?action=opensearch&search=${encodeURI(text)}`));  
  const resp = JSON.parse(await get(`https://ru.wikipedia.org/w/api.php?action=opensearch&search=${encodeURI(text)}`)); 
  
  if (resp[3].length === 0) return 'Информации о вашем запросе не было найдено на странице Wikipedia';

  return `Информация о ${resp[0]}: ${resp[3][0]}`;
};
