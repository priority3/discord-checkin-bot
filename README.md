# Discord 签到脚本

通过 Discord REST API 直接完成签到，无需 Bot。

## 使用

```bash
cp .env.example .env
# 编辑 .env 填写你的 Token
npm install
npm run build
npm start
```

## 配置

在 `.env` 中填写：

| 变量 | 说明 |
|------|------|
| `DISCORD_USER_TOKEN` | 用户 Token（浏览器 DevTools -> Application -> Local Storage -> token） |
| `DISCORD_GUILD_ID` | 服务器 ID |
| `DISCORD_CHECKIN_CHANNEL_ID` | 签到按钮所在频道 ID |
| `DISCORD_CHECKIN_MESSAGE_ID` | 包含签到按钮的消息 ID |
| `DISCORD_BOT_APPLICATION_ID` | 签到 Bot 的 Application ID |
| `DISCORD_CHECKIN_CUSTOM_ID` | 签到按钮的 custom_id（默认 `hub:checkin`） |

## 定时任务

用系统 cron 每天 9:00 自动执行：

```bash
crontab -e
```

添加：

```
0 9 * * * cd /Users/tangyang/Documents/p/discord-checkin-bot && node dist/index.js >> /tmp/discord-checkin.log 2>&1
```
