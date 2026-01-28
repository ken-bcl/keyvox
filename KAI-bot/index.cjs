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

// リトライ付きAPI呼び出し（指数バックオフ）
async function fetchChatbaseWithRetry(payload, headers, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await axios.post(
        'https://www.chatbase.co/api/v1/chat',
        payload,
        { headers, timeout: 30000 }
      );
      return res;
    } catch (error) {
      const isRetryable = !error.response || error.response.status >= 500 || error.code === 'ECONNABORTED';
      if (isRetryable && attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000; // 1秒, 2秒
        console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

const SUPPORT_LINK = '\n\n問題が続く場合はこちらのKAIもお試しください。\nhttps://keyvox.co/support';

// エラータイプに応じたメッセージを返す
function getErrorMessage(error) {
  if (error.code === 'ECONNABORTED') {
    return '応答に時間がかかっています。しばらくしてから再度お試しください。' + SUPPORT_LINK;
  }
  if (error.response?.status === 429) {
    return '現在リクエストが集中しています。少々お待ちいただいてから再度お試しください。' + SUPPORT_LINK;
  }
  if (error.response?.status >= 500) {
    return '現在サービスが混み合っています。しばらくしてから再度お試しください。' + SUPPORT_LINK;
  }
  return '予期せぬエラーが発生しました。しばらくしてから再度お試しください。' + SUPPORT_LINK;
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.webhookId) return;
  if (message.channel.id !== TARGET_CHANNEL_ID) return;
  if (!message.content || typeof message.content !== 'string') return;
  if (message.mentions.everyone) return;

  console.log('Sending to Chatbase:', message.content);

  // Typing Indicatorを表示（処理中であることをユーザーに伝える）
  let typingInterval;
  try {
    await message.channel.sendTyping();
    // 10秒ごとにTyping状態をリフレッシュ（長時間処理対応）
    typingInterval = setInterval(() => {
      message.channel.sendTyping().catch(() => {});
    }, 9000);

    const res = await fetchChatbaseWithRetry(
      {
        messages: [{ role: 'user', content: message.content }],
        chatbotId: CHATBASE_BOT_ID,
        conversationId: message.author.id,
      },
      { Authorization: `Bearer ${CHATBASE_API_KEY}` }
    );

    console.log('Chatbase Response:', res.data);
    const reply = res.data?.text || 'すみません、うまく返答できませんでした。' + SUPPORT_LINK;
    await message.reply(reply);
  } catch (error) {
    console.error('Chatbase API error:', error.response?.data || error.message);
    const errorMessage = getErrorMessage(error);
    await message.reply(errorMessage);
  } finally {
    if (typingInterval) {
      clearInterval(typingInterval);
    }
  }
});

client.login(DISCORD_TOKEN);

app.get('/', (_, res) => res.send('Bot is running'));
app.listen(process.env.PORT || 3000);
