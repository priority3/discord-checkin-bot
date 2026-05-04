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
    "x-super-properties":
      "eyJvcyI6Ik1hY09TIiwiYnJvd3NlciI6IkNocm9tZSIsImRldmljZSI6IiIsInN5c3RlbV9sb2NhbGUiOiJ6aC1DTiIsImJyb3dzZXJfdXNlcl9hZ2VudCI6IiIsImJyb3dzZXJfdmVyc2lvbiI6IjEzOC4wLjAuMCIsIm9zX3ZlcnNpb24iOiIyMy42LjAiLCJyZWZlcnJlciI6IiIsInJlZmVycmluZ19kb21haW4iOiIiLCJyZWZlcnJlcl9jdXJyZW50IjoiIiwicmVmZXJyaW5nX2RvbWFpbl9jdXJyZW50IjoiIiwicmVsZWFzZV9jaGFubmVsIjoic3RhYmxlIiwiY2xpZW50X2J1aWxkX251bWJlciI6NjE2NDQ5LCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==",
  },
  body: formData,
});

if (response.ok || response.status === 204) {
  logger.info("签到成功 ✓");
} else {
  const text = await response.text();
  logger.error(`签到失败 (status: ${response.status}): ${text.slice(0, 200)}`);
  process.exit(1);
}
