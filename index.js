require("dotenv").config();
const TelegramBot = require('node-telegram-bot-api');
const { default: fetch } = require('node-fetch-cjs');
const localCommands = require('./commands');

const groupArray = (arr, size) => arr.reduce((acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);

const SERVERS = {
  txg: { name: "TXG 🇹🇼", id: "txg" },
  tyo: { name: "TYO 🇯🇵", id: "tyo", url: "http://tyo.node.cowgl.xyz:65534/api/run" },
  lax: { name: "LAX 🇺🇸", id: "lax", url: "http://lax.node.cowgl.xyz:65534/api/run" },
  ams: { name: "AMS 🇳🇱", id: "ams", url: "http://ams.node.cowgl.xyz:65534/api/run" },
  tfu: { name: "TFU 🇨🇳", id: "tfu", url: "https://tfu-lg-proxy.charliemoomoo.workers.dev/api/run" }
};

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

const commandHandlers = {
  ping: true,
  tcping: true,
  trace: true,
  route: true,
  path: true,
  whois: true,
  dig: true,
};

function generateServerButtons(command, args, currentServer) {
  const data = {
    reply_markup: {
      inline_keyboard: [
        ...groupArray(Object.values(SERVERS).map(server => ({
          text: `${server.id === currentServer ? '✅ ' : ''}${server.name}`,
          callback_data: JSON.stringify({ c: command, a: args, s: server.id })
        })), 3)
      ]
    }
  };
  console.log(JSON.stringify(data));
  return data;
}

async function runCommandOnServer(serverId, command, args) {
  if (serverId === Object.keys(SERVERS)[0]) {
    return localCommands[command](...args);
  } else {
    const server = SERVERS[serverId];
    const res = await fetch(server.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, args })
    });
    return res.status == "200"?Promise.resolve(await res.text()):Promise.reject(await res.text());
  }
}

bot.onText(/^\/(help|start)(?:@cowgl_dn42_bot|@cowgl|)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `**Command usage:**
\`/help\` Show available commands
\`/ping [ip/domain]\` Ping command
\`/trace [ip/domain]\` Traceroute
\`/route [ip]\` Show route information
\`/path [ip]\` Show AS path
\`/whois [something]\` Whois
\`/dig [domain] {type}\` Resolve a domain`, {
      parse_mode: 'Markdown',
      reply_to_message_id: msg.message_id
   });
})

bot.onText(/^\/(ping|tcping|trace|route|path|whois|dig)(?:@cowgl_dn42_bot|@cowgl|)( .+)?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  bot.sendChatAction(chatId, 'typing');
  const command = match[1];
  const args = (match[2] || '').trim().split(/\s+/).filter(Boolean);

  try {
    var output = await runCommandOnServer(Object.keys(SERVERS)[0], command, args);
    console.log(output);
    const limitedOutput = output.slice(0, 4000);
    bot.sendMessage(chatId, `\`\`\`
${limitedOutput}
\`\`\``, {
      parse_mode: 'Markdown',
      reply_to_message_id: msg.message_id,
      ...(["whois", "dig"].indexOf(command) == -1 ? generateServerButtons(command, args, "txg") : {})
    });
  } catch (err) {
    bot.sendMessage(chatId, `❌ Error: ${err.toString().split("\n")[0]}`,{
      reply_to_message_id: msg.message_id
    });
  }
});

bot.on("callback_query", async (cbq) => {
  const chatId = cbq.message.chat.id;
  bot.sendChatAction(chatId, 'typing');
  const messageId = cbq.message.message_id;
  const data = JSON.parse(cbq.data);
  const { c: command, a: args, s: server } = data;

  try {
    var output = await runCommandOnServer(server, command, args);
    console.log(output);
    const limitedOutput = output.slice(0, 4000);
    bot.editMessageText(`\`\`\`
${limitedOutput}
\`\`\``, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      ...(["whois", "dig"].indexOf(command) == -1 ? generateServerButtons(command, args, server) : {})
    });
  } catch (err) {
    bot.editMessageText(`❌ Error: ${err.toString().split("\n")[0]}`, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      ...(["whois", "dig"].indexOf(command) == -1 ? generateServerButtons(command, args, server) : [])
    });
  }
  bot.answerCallbackQuery(cbq.id);
});

bot.on("inline_query", async (cbq) => {
  console.log(cbq);
})

bot.on("polling_error", ()=>{});

process.on("uncaughtException", console.error);
