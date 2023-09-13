const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');
const crypto = require('crypto');
const app = express();
const PORT = 3000;
const CHANNEL_ID = process.env.CHANNEL_ID;
const API_KEY = process.env.API_KEY; // Replit SecretからAPI_KEYを取得
const SECRET_KEY = process.env.SECRET_KEY; // Replit SecretからSECRET_KEYを取得
const ENTRY_DEVICE_ID = process.env.ENTRY_DEVICE_ID; // Replit SecretからENTRY_DEVICE_IDを取得

app.get('/', (req, res) => {
  res.send('Repl is alive!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log('Bot is online and ready!');
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
  console.log(`Received message from ${message.author.tag}: ${message.content}`);

  if (message.channel.id === CHANNEL_ID && message.content === '開けて' && !message.author.bot) {
    console.log('Inside the condition.');

    try {
      console.log('Sending unlock request...');
      const startTime = Date.now();
      const result = await unlockLock();

      const endTime = Date.now();
      const elapsedTime = endTime - startTime;

      if (result.code === "0" && result.msg === "success") {
        message.reply(`ドアを開けました！（かかった時間：${elapsedTime}ミリ秒）`);
      } else {
        message.reply('エラーが発生しました。');
      }
    } catch (error) {
      console.error('Error:', error);
      message.reply('エラーが発生しました。');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

async function unlockLock() {
  const apiName = "unlock";
  const postParam = JSON.stringify({
    "lockId": ENTRY_DEVICE_ID,
    "flag": "1"
  });

  const date = new Date().toUTCString();
  const digestHash = crypto.createHash('sha256').update(postParam).digest('base64');
  const digest = "SHA-256=" + digestHash;

  const stringToSign = `date: ${date}\nPOST /api/eagle-pms/v1/${apiName} HTTP/1.1\ndigest: ${digest}`;
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(stringToSign).digest('base64');

  const headers = {
    "date": date,
    "authorization": `hmac username="${API_KEY}", algorithm="hmac-sha256", headers="date request-line digest", signature="${signature}"`,
    "x-target-host": "default.pms",
    "digest": digest,
    "Content-Type": "application/json"
  };

  const url = "https://eco.blockchainlock.io/api/eagle-pms/v1/" + apiName;
  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: postParam
  });

  return await response.json();
}
