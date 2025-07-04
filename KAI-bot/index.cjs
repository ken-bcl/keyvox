// discord_chatbase_bot/index.cjs
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHATBASE_API_KEY = process.env.CHATBASE_API_KEY;
const CHATBASE_BOT_ID = process.env.CHATBASE_BOT_ID;

// KAIに質問するチャンネル専用
const TARGET_CHANNEL_ID = '1385051535322517525';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const app = express();

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.webhookId) return;
  if (message.channel.id !== TARGET_CHANNEL_ID) return;
  if (!message.content || typeof message.content !== 'string') return;
  if (message.mentions.everyone) return;

  console.log('Sending to Chatbase:', message.content);

  try {
    const res = await axios.post(
      'https://www.chatbase.co/api/v1/chat',
      {
        messages: [{ role: 'user', content: message.content }],
        chatbotId: CHATBASE_BOT_ID,
        conversationId: message.author.id, // 💥 これでユーザーごとの会話ログを保存
      },
      {
        headers: {
          Authorization: `Bearer ${CHATBASE_API_KEY}`,
        },
      }
    );
    console.log('Chatbase Response:', res.data);
    const reply = res.data?.text || 'すみません、うまく返答できませんでした。';
    await message.reply(reply);
  } catch (error) {
    console.error('Chatbase API error:', error.response?.data || error.message);
    await message.reply('エラーが発生しました。');
  }
});

client.login(DISCORD_TOKEN);

app.get('/', (_, res) => res.send('Bot is running'));
app.listen(process.env.PORT || 3000);
