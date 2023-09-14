# AketeDoor　Node.js用サンプルコード

## 📌 概要

このサンプルコードでは、Discordの特定チェンネルに「開けて」と投稿すれば、Lock APIを呼んで解錠後、開場時間とともにDiscordに「ドアを開けました！」と投稿するまでを実現してます。

## 🚀 セットアップ

1. 無料で30日間利用できるKEYVOXアカウントを取得します。参照：https://keyvox.co/free
2. ロックの設定を行います。参照：https://keyvox.notion.site/2d2e09a81d274308b041f458f0992417?pvs=4
3. Web管理画面からAPIキーを取得します。参照：https://keyvox.notion.site/API-44c489d8c97a4eba8a7fa0028c3b39a1
4. Node.jsサーバーを立ち上げます（Replitなど簡単にオンラインで立ち上げ可能です）
5. このリポジトリからコードをコピーし、index.js等適切な名前で保管します。
6. .envにKEYVOX APIのAPIキー、シークレットキー、DeviceID、DiscordチャンネルIDを保管します。
7. Node.jsをRunします。

## 📝 使用方法

1. DiscordにAutoDoor用のBotを作ります。
2. メッセージの読み取り権限と、書き込み権限を与えます。
3. Node.jsのコンソールでメッセージを読み取れているか確認してください。
4. 読み取れていれば、Discordの指定したチャンネルで「開けて」と投稿してください。
5. ドアが開場して、「ドアを開けました！（かかった時間：968ミリ秒）」と表示されれば成功です。

## 📞 連絡先

問題や提案がある場合は、公式コミュニティにお問い合わせください：
- https://discord.gg/QBUBmjaSj8
