// discord_chatbase_bot/index.js
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHATBASE_API_KEY = process.env.CHATBASE_API_KEY;
const CHATBASE_BOT_ID = process.env.CHATBASE_BOT_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const app = express();

client.on('messageCreate', async (message) => {
if (message.author.bot || message.webhookId) return;
console.log('Sending to Chatbase:', message.content);

  try {
    const res = await axios.post(
      'https://www.chatbase.co/api/v1/chat',
      {
        messages: [{ role: 'user', content: message.content }],
        chatbotId: CHATBASE_BOT_ID,
      },
      {
        headers: {
          Authorization: `Bearer ${CHATBASE_API_KEY}`,
        },
      }
    );

    const reply = res.data?.text || 'すみません、うまく返答できませんでした。';
    await message.reply(reply);
  } catch (error) {
    console.error('Chatbase API error:', error);
    await message.reply('エラーが発生しました。');
  }
});

client.login(DISCORD_TOKEN);

app.get('/', (_, res) => res.send('Bot is running'));
app.listen(process.env.PORT || 3000);
