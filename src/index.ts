import { config as loadEnv } from "dotenv";
import { z } from "zod";
import { logger } from "./logger.js";

loadEnv();

const schema = z.object({
  DISCORD_USER_TOKEN: z.string().min(1),
  DISCORD_GUILD_ID: z.string().min(1),
  DISCORD_CHECKIN_CHANNEL_ID: z.string().min(1),
  DISCORD_CHECKIN_MESSAGE_ID: z.string().min(1),
  DISCORD_BOT_APPLICATION_ID: z.string().min(1),
  DISCORD_CHECKIN_CUSTOM_ID: z.string().default("hub:checkin"),
});

const config = schema.parse(process.env);

function generateNonce(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000000)}`;
}

function generateSessionId(): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function checkin() {
  const payload = {
    type: 3,
    nonce: generateNonce(),
    guild_id: config.DISCORD_GUILD_ID,
    channel_id: config.DISCORD_CHECKIN_CHANNEL_ID,
    message_flags: 0,
    message_id: config.DISCORD_CHECKIN_MESSAGE_ID,
    application_id: config.DISCORD_BOT_APPLICATION_ID,
    session_id: generateSessionId(),
    data: {
      component_type: 2,
      custom_id: config.DISCORD_CHECKIN_CUSTOM_ID,
    },
  };

  const formData = new FormData();
  formData.append("payload_json", JSON.stringify(payload));
  formData.append("files[0]", new Blob([""]), "");

  const response = await fetch("https://discord.com/api/v9/interactions", {
    method: "POST",
    headers: {
      accept: "*/*",
      authorization: config.DISCORD_USER_TOKEN,
      origin: "https://discord.com",
      referer: "https://discord.com/channels/@me",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
      "x-super-properties": "eyJvcyI6Ik1hY09TIiwiYnJvd3NlciI6IkNocm9tZSIsImRldmljZSI6IiIsInN5c3RlbV9sb2NhbGUiOiJ6aC1DTiIsImJyb3dzZXJfdXNlcl9hZ2VudCI6IiIsImJyb3dzZXJfdmVyc2lvbiI6IjEzOC4wLjAuMCIsIm9zX3ZlcnNpb24iOiIyMy42LjAiLCJyZWZlcnJlciI6IiIsInJlZmVycmluZ19kb21haW4iOiIiLCJyZWZlcnJlcl9jdXJyZW50IjoiIiwicmVmZXJyaW5nX2RvbWFpbl9jdXJyZW50IjoiIiwicmVsZWFzZV9jaGFubmVsIjoic3RhYmxlIiwiY2xpZW50X2J1aWxkX251bWJlciI6NjE2NDQ5LCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==",
    },
    body: formData,
  });

  if (response.ok || response.status === 204) {
    logger.info(`签到成功 (status: ${response.status})`);
    // 等待 bot 回复
    await new Promise((r) => setTimeout(r, 2000));
    await fetchLatestMessages();
  } else {
    const text = await response.text();
    logger.error(`签到失败 (status: ${response.status}): ${text.slice(0, 200)}`);
    process.exit(1);
  }
}

await checkin();

async function fetchLatestMessages() {
  const res = await fetch(
    `https://discord.com/api/v9/channels/${config.DISCORD_CHECKIN_CHANNEL_ID}/messages?limit=5`,
    {
      headers: {
        authorization: config.DISCORD_USER_TOKEN,
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    }
  );

  if (!res.ok) {
    logger.error(`获取消息失败: ${res.status}`);
    return;
  }

  const messages = await res.json();
  for (const msg of messages) {
    // 只显示 bot 的消息（author.bot === true）
    if (msg.author?.bot) {
      const content = msg.content || "(embed)";
      const ts = new Date(msg.timestamp).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
      logger.info(`[${ts}] ${msg.author.username}: ${content}`);
      // 显示 embeds
      if (msg.embeds?.length) {
        for (const embed of msg.embeds) {
          if (embed.title) logger.info(`  标题: ${embed.title}`);
          if (embed.description) logger.info(`  内容: ${embed.description}`);
        }
      }
      break; // 只显示最新一条 bot 消息
    }
  }
}
