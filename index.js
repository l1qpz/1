const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');

// خادم ويب بسيط ومجاني عشان يفتح بورت ويرضي شروط ريندر للـ Web Service
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is alive!');
}).listen(process.env.PORT || 3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`Bot is ready! Logged in as ${client.user.tag}`);
});

client.on('messageCreate', message => {
  if (message.content === '!ping') {
    message.reply('Pong! البوت شغال 100% 🎮');
  }
});

// هذا السطر يسحب التوكن اللي حطيتيه في Environment Variables في Render بأمان
client.login(process.env.TOKEN);
