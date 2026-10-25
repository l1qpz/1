const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const http = require('http');

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

const { handlePoints, getUserData } = require('./games/points');
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

  // قائمة الألعاب بالشريط الأحمر الغامق
  if (command === '-العاب') {
    const embed = new EmbedBuilder()
      .setColor('#8B0000')
      .setTitle('🎮 | قائمة ألعاب السيرفر')
      .setDescription(
        'مرحبًا بكم في مركز الألعاب! \n\n' +
        'نوفر لكم مجموعة متنوعة من الألعاب الجماعية والفردية للاستمتاع بالتحديات والمنافسات مع الأصدقاء.\n\n' +
        '**الألعاب الجماعية**\n' +
        '-روليت : لعبة الروليت.\n' +
        '-مافيا : لعبة المافيا.\n' +
        '-نرد : تحدي رمي النرد الجماعي بين الفريقين.\n\n' +
        '**الألعاب الفردية**\n' +
        '-أسرع : تحدي سرعة الكتابة.\n' +
        '-أعلام : تحدي معرفة أعلام الدول.\n' +
        '-حسم : تحدي حسم المواجهة السريعة ضد البوت.\n\n' +
        '📊 | **الأنظمة والإحصائيات**\n' +
        '- نقاطي: عرض بطاقة النقاط والإحصائيات الخاصة بك.\n' +
        '- الحقيبة: عرض أدواتك الحالية.\n\n' +
        '**طريقة الاستخدام**\n' +
        'لتشغيل أي لعبة، يُرجى كتابة الأمر المخصص لها في القناة المناسبة.\n\n' +
        'استمتعوا باللعب، ونتمنى لكم تجربة ممتعة ومليئة بالتحديات! 🏆'
      );
    return message.reply({ embeds: [embed] });
  }

  if (command === '-نقاطي' || command === '-الحقيبة' || command === '-شراء') {
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
