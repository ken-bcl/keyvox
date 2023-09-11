//AketeDoorのNode.js用スクリプト
const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Repl is alive!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent]
});
const fetch = require('node-fetch');


client.once('ready', () => {
  console.log('Bot is online and ready!');
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
  console.log(`Received message from ${message.author.tag}: ${message.content}`);

  console.log('Before checking the message content.');
  // ここでメッセージの内容をログに出力
  console.log(`Message content: "${message.content}"`);

  if (message.content === '開けて' && !message.author.bot) {
    console.log('Inside the condition.');

    // GASのWeb APIのURL
    const GAS_API_URL = process.env.GAS_API_URL;

    try {
      console.log('Sending request to GAS endpoint...');
      const response = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'unlock',
          deviceId: 'ENTRY_DEVICE_ID'  // 入り口のDeviceID
        })
      });
      console.log('Received response from GAS endpoint.');

      // レスポンスの内容をログに出力
      const responseBody = await response.text();
      console.log('Response body:', responseBody);

      const result = JSON.parse(responseBody);
      if (result.success) {
        message.reply('ドアを開けました！');
      } else {
        message.reply('エラーが発生しました。');
      }
    } catch (error) {
      console.error('Error:', error);
      message.reply('エラーが発生しました。');
    }

  }
  console.log('After checking the message content.');
});

client.login(process.env.DISCORD_TOKEN);
