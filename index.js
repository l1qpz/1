const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder 
} = require('discord.js');
const http = require('http');

// خادم ويب بسيط لإرضاء شروط Render
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

// قواعد بيانات في الذاكرة
const balances = {}; 
const inventory = {}; 
const activeRoulette = {
  players: new Set()
};

function addPoints(userId, amount) {
  if (!balances[userId]) balances[userId] = 100; // يبدأ بـ 100 نقطة هدية
  balances[userId] += amount;
  return balances[userId];
}

function getPoints(userId) {
  if (!balances[userId]) balances[userId] = 100;
  return balances[userId];
}

client.once('ready', () => {
  console.log(`Bot is ready! Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const args = message.content.trim().split(/ +/);
  const command = args[0].toLowerCase();

  // الأمر الأساسي: !العاب
  if (command === '!العاب') {
    const embed = new EmbedBuilder()
      .setColor('#8B0000') // لون أحمر غامق فخم
      .setTitle('🎰 روليت')
      .setDescription('**لعبة جماعية**\n\nأضغط على زر دخول للإنضمام إلى اللعبة')
      .addFields(
        { name: '⚡ أسرع كاتب', value: 'الأمر: `!سرعة` (أول من يكتب الكلمة يفوز بنقاط)', inline: false },
        { name: '🎯 تخمين الرقم', value: 'الأمر: `!تخمين` (خمن الرقم الصحيح بين 1 و 20)', inline: false },
        { name: '🪨 حجر ورقة مقص', value: 'الأمر: `!حجر` (تحدي سريع بالأزرار ضد البوت)', inline: false },
        { name: '💰 رصيدك ونقاطك', value: 'الأمر: `!نقاطي` (لعرض نقاطك الحالية)', inline: false }
      )
      .setFooter({ text: 'استمتع باللعب واجمع أكبر عدد من النقاط!' });

    // ترتيب الأزرار تماماً مثل الصورة المطلوبة (بدون متجر صور)
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('r_join').setLabel('انضمام').setStyle(ButtonStyle.Secondary).setEmoji('📥'),
      new ButtonBuilder().setCustomId('r_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary).setEmoji('📤')
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('r_shop').setLabel('متجر الخصائص').setStyle(ButtonStyle.Secondary).setEmoji('🛍️')
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('r_bag').setLabel('الحقيبه').setStyle(ButtonStyle.Secondary).setEmoji('🎒')
    );

    const row4 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('r_stats').setLabel('احصائيات').setStyle(ButtonStyle.Secondary).setEmoji('📊')
    );

    return message.reply({ embeds: [embed], components: [row1, row2, row3, row4] });
  }

  // أمر عرض النقاط
  if (command === '!نقاطي' || command === '!points') {
    const pts = getPoints(message.author.id);
    return message.reply(`💰 رصيدك الحالي هو: **${pts}** نقطة.`);
  }

  // لعبة أسرع كاتب
  if (command === '!سرعة' || command === '!speed') {
    const words = ['ديسكورد', 'ريندر', 'برمجة', 'الروليت', 'تحدي', 'أسرع كاتب'];
    const randomWord = words[Math.floor(Math.random() * words.length)];

    message.channel.send(`⚡ **تحدي أسرع كاتب!**\nأول شخص يكتب الكلمة التالية يفوز بـ **50** نقطة:\n\n👉 **\`${randomWord}\`**`);

    const filter = m => m.content === randomWord && !m.author.bot;
    const collector = message.channel.createMessageCollector({ filter, time: 15000, max: 1 });

    collector.on('collect', m => {
      const newTotal = addPoints(m.author.id, 50);
      message.channel.send(`🎉 كفو! **${m.author.username}** هو أسرع كاتب وفاز بـ **50** نقطة! (رصيدك الحالي: ${newTotal})`);
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        message.channel.send('⏱️ انتهى الوقت ولم يكتب أحد الكلمة بشكل صحيح.');
      }
    });
  }

  // لعبة تخمين الرقم
  if (command === '!تخمين' || command === '!guess') {
    const targetNumber = Math.floor(Math.random() * 20) + 1;
    message.channel.send('🎲 **لعبة التخمين بدأت!**\nاخترت رقماً عشوائياً بين **1 و 20**. أول شخص يخمن الرقم الصحيح يفوز بـ **100** نقطة!');

    const filter = m => !isNaN(m.content) && !m.author.bot;
    const collector = message.channel.createMessageCollector({ filter, time: 30000 });

    collector.on('collect', m => {
      const guess = parseInt(m.content);
      if (guess === targetNumber) {
        const newTotal = addPoints(m.author.id, 100);
        message.channel.send(`🏆 إجابة صحيحة! **${m.author.username}** خمن الرقم (**${targetNumber}**) وفاز بـ **100** نقطة!`);
        collector.stop();
      } else if (guess < targetNumber) {
        m.reply('📈 الرقم الصحيح **أكبر** من كذا!');
      } else {
        m.reply('📉 الرقم الصحيح **أصغر** من كذا!');
      }
    });
  }

  // لعبة حجر ورقة مقص
  if (command === '!حجر' || command === '!rps') {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('rock').setLabel('🪨 حجر').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('paper').setLabel('📄 ورقة').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('scissors').setLabel('✂️ مقص').setStyle(ButtonStyle.Danger)
    );

    message.reply({ content: '🎮 اختر حركتك من الأزرار تحت ضد البوت (الفائز يحصل على 30 نقطة):', components: [row] });
  }
});

// التعامل مع تفاعلات الأزرار
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const userId = interaction.user.id;
  const username = interaction.user.username;

  // أزرار لوحة التحكم بالروليت والألعاب
  if (interaction.customId === 'r_join') {
    activeRoulette.players.add(username);
    return interaction.reply({ content: `✅ تم انضمامك إلى قائمة لاعبي الروليت! (المشتركين حالياً: ${activeRoulette.players.size})`, ephemeral: true });
  }

  if (interaction.customId === 'r_leave') {
    if (activeRoulette.players.has(username)) {
      activeRoulette.players.delete(username);
      return interaction.reply({ content: `📤 تم انسحابك من الروليت بنجاح.`, ephemeral: true });
    }
    return interaction.reply({ content: `⚠️ أنت لست منضم أصلاً للقائمة!`, ephemeral: true });
  }

  if (interaction.customId === 'r_shop') {
    const pts = getPoints(userId);
    const shopEmbed = new EmbedBuilder()
      .setColor('#2F3136')
      .setTitle('🛍️ متجر الخصائص')
      .setDescription(`رصيدك الحالي: **${pts}** نقطة\n\n1️⃣ **درع حماية الخسارة** (200 نقطة)\n2️⃣ **مضاعف النقاط x2** (500 نقطة)`);
    return interaction.reply({ embeds: [shopEmbed], ephemeral: true });
  }

  if (interaction.customId === 'r_bag') {
    const userItems = inventory[userId] || ['فارغة'];
    return interaction.reply({ content: `🎒 **حقيبتك:**\nمحتويات الحقيبة: ${userItems.join(', ')}`, ephemeral: true });
  }

  if (interaction.customId === 'r_stats') {
    const pts = getPoints(userId);
    return interaction.reply({ content: `📊 **إحصائياتك:**\n👤 الاسم: ${username}\n💰 النقاط: ${pts}\n🎮 حالة الروليت: ${activeRoulette.players.has(username) ? 'منضم' : 'غير مشارك'}`, ephemeral: true });
  }

  // أزرار لعبة حجر ورقة مقص
  if (['rock', 'paper', 'scissors'].includes(interaction.customId)) {
    const choices = ['rock', 'paper', 'scissors'];
    const botChoice = choices[Math.floor(Math.random() * choices.length)];
    const userChoice = interaction.customId;
    const names = { rock: '🪨 حجر', paper: '📄 ورقة', scissors: '✂️ مقص' };

    if (userChoice === botChoice) {
      return interaction.update({ content: `تعادل! أنت اخترت ${names[userChoice]} والبوت اختار ${names[botChoice]}.`, components: [] });
    }

    const win = 
      (userChoice === 'rock' && botChoice === 'scissors') ||
      (userChoice === 'paper' && botChoice === 'rock') ||
      (userChoice === 'scissors' && botChoice === 'paper');

    if (win) {
      const newTotal = addPoints(userId, 30);
      return interaction.update({ content: `🎉 مبروك فزت! أنت اخترت ${names[userChoice]} والبوت اختار ${names[botChoice]}.\nكسبت **30** نقطة! (رصيدك: ${newTotal})`, components: [] });
    } else {
      return interaction.update({ content: `❌ للأسف خسرت! أنت اخترت ${names[userChoice]} والبوت اختار ${names[botChoice]}.`, components: [] });
    }
  }
});

client.login(process.env.TOKEN);
