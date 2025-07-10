import { readFile,writeFile } from "fs/promises";
import { users } from "./lib/db.mjs";

const userList = await users.readAll()

userList.forEach(user => {
  console.log(user.buisnesses)
  if (!user.buisnesses) user.buisnesses = []
  writeFile(`storage/json/users/${user.id}.json`, JSON.stringify(user, null, 2))
})
