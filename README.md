# KEYVOX API GAS用サンプルコード

**KEYVOX** は、IoTやブロックチェーン技術を活用したスマートロック及びスマートロッカーの製造および関連SaaSサービスを提供するプロジェクトです。本リポジトリはKEYVOX優れた性能を誰でも簡単に最大限ご利用いただくために、代表岡本がGoogle App Script（GAS）用に作成した簡単なサンプルコードです。岡本はKEYVOXサービス運営会社の代表を努めてはおりますが、本レポジトリはあくまで「誰でも簡単に使える」ことを主眼に提供されており、KEYVOXオフィシャルレポジトリではありません。アイデア次第で多彩な利用ができるKEYVOXを体験いただくためにご活用ください。

※ご参考　オフィシャル情報は下記をご参照ください。
1. KEYVOX ドキュメントポータル：　https://developers.keyvox.co
2. KEYVOX APIサンプルコード：https://gitlab.com/blockchainlock/api-demo

### "KEYVOXのブランドストーリー - 鍵は自由へのパスポート"
皆様の施設は、訪れる人々にとって新たな世界への扉です。その扉を開ける瞬間、新しい体験への期待と興奮が心を満たします。
KEYVOXはその感動的な瞬間をストレスなく始めるカギを提供します。
KEYVOXスマートロックは、施設のゲストがストレスなく扉を開けることができるようにデザインされています。暗証番号は打ちやすく、QRコードをスキャンするだけで、誰でも簡単に扉を開けることができます。
KEYVOXは鍵の取得から解錠までの全てのプロセスを徹底的に考え抜き、最高のユーザー体験を提供します。ゲストは鍵を探す手間や、鍵を失くす心配から解放され、訪れた施設を思う存分楽しむことができます。
KEYVOXは、皆様の施設を訪れる全ての人々に、新たな世界への扉を開ける喜びを提供します。私たちは、その一瞬一瞬が、訪れる人々の心に刻まれる特別な体験となるお手伝いをします。
- https://keyvox.co

## 📌 概要

このリポジトリには、主に`KEYVOX`のスマートロックシステムを制御するためのGoogle Apps Script (GAS) コードが掲載されています。このコードは、状況に適したロックやロッカーの解錠コードを生成し、適切な形でゲストに通知する機能を持っています。

## 🚀 セットアップ

1. 無料で30日間利用できるKEYVOXアカウントを取得します。参照：https://keyvox.co/free
2. ロックの設定を行います。参照：https://keyvox.notion.site/2d2e09a81d274308b041f458f0992417?pvs=4
3. Web管理画面からAPIキーを取得します。参照：https://keyvox.notion.site/API-44c489d8c97a4eba8a7fa0028c3b39a1
4. Google Apps Scriptのダッシュボードにアクセスし、新しいプロジェクトを作成します。
5. このリポジトリからコードをコピーし、GASエディタに貼り付けます。※このリポジトリのコードを使用するには、GASのプロパティサービスを使用して、これらのキーと設定をスクリプトに追加します。（通常APIキー、シークレットキー、デバイスID、ロックID、Post先URLなどを書き換えるだけで動きます。）

## 📝 使用方法

1. GASエディタで、`storeKeys`関数を一度だけ実行して、APIキーとシークレットキーを保存します。
2. 必要なサービスのWebhookを設定して、GASで指定されたエンドポイントにデータをPOSTするようにします。
3. GASをデプロイし、アプリケーションURLを取得します。取得したアプリケーションURLを各Webhookの送付先に指定します。
4. 解錠するためのコードが生成され、指定されたメールアドレスに通知されます。

## 📞 連絡先

問題や提案がある場合は、公式コミュニティにお問い合わせください：
- https://discord.gg/QBUBmjaSj8

## 📜 ライセンス

このプロジェクトは独自のライセンスで提供されています。詳細については、`LICENSE`ファイルを参照してください。

2023-09-11