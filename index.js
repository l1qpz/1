const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');

// خادم ويب لإرضاء شروط Render
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

// استيراد وحدات الألعاب
const handlePoints = require('./games/points');
const handleRoulette = require('./games/roulette');
const handleMafia = require('./games/mafia');
const handleDice = require('./games/dice');
const handleFlags = require('./games/flags');
const handleSpeed = require('./games/speed');
const handleRPS = require('./games/rps');

client.once('ready', () => {
  console.log(`Bot is ready! Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const args = message.content.trim().split(/ +/);
  const command = args[0].toLowerCase();

  // قائمة الألعاب
  if (command === '-العاب') {
    return message.reply(
      "🎮| قائمة ألعاب السيرفر\n" +
      "مرحبًا بكم في مركز الألعاب، حيث تتوفر مجموعة متنوعة من الألعاب الجماعية والفردية. فيما يلي قائمة الألعاب والأوامر المخصصة لتشغيلها\n\n" +
      "[ الألعاب الجماعية ]\n" +
      "-روليت : لعبة الروليت\n" +
      "-مافيا : لعبة المافيا\n" +
      "-نرد : تحدي النرد الجماعي بين الفريقين\n\n" +
      "[ الألعاب الفردية ]\n" +
      "-اسرع : تحدي سرعة الكتابة\n" +
      "-اعلام : تحدي معرفة أعلام الدول\n" +
      "-حسم : تحدي حسم السريع ضد البوت\n\n" +
      "[ الأنظمة والإحصائيات ]\n" +
      "-نقاطي : عرض بطاقة النقاط والإحصائيات\n" +
      "-متجر : متجر الخصائص ودرع الحماية\n\n" +
      "آلية الاستخدام:\n" +
      "لتشغيل أي لعبة، يرجى كتابة الأمر المخصص لها في القناة المناسبة"
    );
  }

  // توجيه الأوامر لملفاتها
  if (command === '-نقاطي' || command === '-متجر' || (command === '-شراء' && args[1] === 'درع')) {
    return handlePoints(message, command, args);
  }
  if (command === '-روليت') return handleRoulette(message);
  if (command === '-مافيا') return handleMafia(message);
  if (command === '-نرد') return handleDice(message);
  if (command === '-اعلام') return handleFlags(message);
  if (command === '-اسرع') return handleSpeed(message);
  if (command === '-حسم') return handleRPS(message);
});

client.login(process.env.TOKEN);
