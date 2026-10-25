const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  AttachmentBuilder
} = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
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

// قواعد البيانات في الذاكرة
const usersData = {};
const activeRoulette = { players: new Set() };
const activeMafia = { players: new Set() };

function getUserData(userId) {
  if (!usersData[userId]) {
    usersData[userId] = {
      points: 20,          
      weeklyPoints: 0,     
      rank: 191,
      gamesPoints: {
        'الروليت': 15,
        'المافيا': 0,
        'النرد': 0,
        'الأعلام': 0,
        'أسرع كاتب': 0,
        'التخمين': 0,
        'حجر ورقة مقص': 3
      },
      groupGames: 3
    };
  }
  return usersData[userId];
}

client.once('ready', () => {
  console.log(`Bot is ready! Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const args = message.content.trim().split(/ +/);
  const command = args[0].toLowerCase();

  // 1. القائمة الرئيسية للألعاب (-العاب)
  if (command === '-العاب') {
    const embed = new EmbedBuilder()
      .setColor('#8B0000')
      .setTitle('🎮 قائمة ألعاب السيرفر الشاملة')
      .setDescription('مرحباً بك في مركز الألعاب! إليك جميع الأوامر المتاحة للبدء:')
      .addFields(
        { name: '🎰 الروليت الجماعية', value: 'الأمر: `-روليت` (تتطلب 3 أشخاص فأكثر)', inline: false },
        { name: '🕵️‍♂️ لعبة المافيا', value: 'الأمر: `-مافيا` (تتطلب أكثر من 4 أشخاص)', inline: false },
        { name: '🎲 لعبة النرد', value: 'الأمر: `-نرد`', inline: false },
        { name: '🌍 تحدي الأعلام', value: 'الأمر: `-اعلام`', inline: false },
        { name: '⚡ أسرع كاتب', value: 'الأمر: `-سرعة`', inline: false },
        { name: '🎯 تخمين الرقم', value: 'الأمر: `-تخمين`', inline: false },
        { name: '🪨 حجر ورقة مقص', value: 'الأمر: `-حجر`', inline: false },
        { name: '💰 رصيدك ونقاطك', value: 'الأمر: `-نقاطي` (يرسل بطاقتك الخاصة)', inline: false }
      );
    return message.reply({ embeds: [embed] });
  }

  // 2. أمر نقاطي (Canvas)
  if (command === '-نقاطي') {
    try {
      const user = message.author;
      const data = getUserData(user.id);

      const canvas = createCanvas(1000, 500);
      const ctx = canvas.getContext('2d');

      const background = await loadImage('https://cdn.discordapp.com/attachments/1552241868241240175/1563809446344392815/2E651F07-6E9C-4691-8F69-BD9334538F2E.png?ex=6adefa8a&is=6adda90a&hm=1452967a834b9ab034c1af09746c97f1f871c466c4769186145d757424f09cda&');
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';

      // أ. اسم الشخص
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(user.username, 760, 265);

      // ب. الترتيب
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`الترتيب #${data.rank} في السيرفر`, 760, 305);

      // ج. الأرقام
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(data.points.toString(), 825, 570);        
      ctx.fillText(data.groupGames.toString(), 615, 570);    
      ctx.fillText(data.gamesPoints['الروليت'].toString(), 390, 570); 
      ctx.fillText(data.weeklyPoints.toString(), 170, 570);   

      // د. أفضل ألعابك
      let bestGameText = "مافيه نقاط لعبة مسجلة بعد";
      let maxPts = 0;
      for (const [gameName, pts] of Object.entries(data.gamesPoints)) {
        if (pts > maxPts) {
          maxPts = pts;
          bestGameText = gameName;
        }
      }

      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(bestGameText, 920, 720);

      // هـ. الأفاتار
      ctx.save();
      ctx.beginPath();
      const avatarX = 870;
      const avatarY = 190;
      const avatarRadius = 75;
      ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });
      const avatar = await loadImage(avatarURL);
      ctx.drawImage(avatar, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
      ctx.restore();

      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'points-card.png' });
      return message.reply({ files: [attachment] });

    } catch (error) {
      console.error(error);
      return message.reply('❌ حدث خطأ أثناء إنشاء بطاقة النقاط.');
    }
  }

  // 3. أمر الروليت (مع صورتك والشرط: 3 أشخاص فأكثر)
  if (command === '-روليت') {
    activeRoulette.players.clear(); // بدء جلسة جديدة
    const embed = new EmbedBuilder()
      .setColor('#8B0000')
      .setTitle('🎰 روليت جماعية')
      .setDescription('**أضغط على زر (انضمام) أدناه للمشاركة**\n*(تتطلب اللعبة 3 أشخاص أو أكثر للبدء)*')
      .setImage('https://cdn.discordapp.com/attachments/1552241868241240175/1563809433656762450/B17B3AD9-4C36-435D-93FC-5CB6B03FAC66.png?ex=6adefa87&is=6adda907&hm=6910f7c469bb20b4145bcf7faff89c1dcd72ef61e53bab803d85c64e634c3067&');

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('r_join').setLabel('انضمام').setStyle(ButtonStyle.Secondary).setEmoji('📥'),
      new ButtonBuilder().setCustomId('r_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary).setEmoji('📤'),
      new ButtonBuilder().setCustomId('r_start').setLabel('بدء الجولة').setStyle(ButtonStyle.Success).setEmoji('▶️')
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('r_shop').setLabel('متجر الخصائص').setStyle(ButtonStyle.Secondary).setEmoji('🛍️'),
      new ButtonBuilder().setCustomId('r_bag').setLabel('الحقيبه').setStyle(ButtonStyle.Secondary).setEmoji('🎒'),
      new ButtonBuilder().setCustomId('r_stats').setLabel('احصائيات').setStyle(ButtonStyle.Secondary).setEmoji('📊')
    );

    return message.reply({ embeds: [embed], components: [row1, row2] });
  }

  // 4. أمر المافيا (مع صورتك والشرط: أكثر من 4 أشخاص يعني 5 فأكثر)
  if (command === '-مافيا') {
    activeMafia.players.clear();
    const embed = new EmbedBuilder()
      .setColor('#2C2F33')
      .setTitle('🕵️‍♂️ لعبة المافيا')
      .setDescription('**لعبة جماعية للتحقيق**\n*(تتطلب هذه اللعبة أكثر من 4 لاعبين للبدء)*')
      .setImage('https://cdn.discordapp.com/attachments/1552241868241240175/1563809455269875733/BDF88FE8-7B9A-46A9-A1FA-3E8DD7706FA0.png?ex=6adefa8c&is=6adda90c&hm=f1aab49dd1e21a936fccf87c5466a186a1e635c62dc9c85c36f016faf56cd746&');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('mafia_join').setLabel('انضمام للمافيا').setStyle(ButtonStyle.Danger).setEmoji('🕶️'),
      new ButtonBuilder().setCustomId('mafia_start').setLabel('بدء الجولة').setStyle(ButtonStyle.Success).setEmoji('▶️')
    );

    return message.reply({ embeds: [embed], components: [row] });
  }

  // 5. أمر النرد
  if (command === '-نرد') {
    const diceRoll = Math.floor(Math.random() * 6) + 1;
    const reward = diceRoll * 15;
    const data = getUserData(message.author.id);
    data.points += reward;
    data.weeklyPoints += reward;
    data.gamesPoints['النرد'] += reward;

    return message.reply(`🎲 رميت النرد وطلع لك (${diceRoll})! كسبت **${reward}** نقطة.`);
  }
});

// الأزرار والتفاعلات والشروط
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;
  const username = interaction.user.username;

  // تفاعلات الروليت (شرط 3 أشخاص فأكثر)
  if (interaction.customId === 'r_join') {
    activeRoulette.players.add(username);
    return interaction.reply({ content: `✅ تم انضمامك للروليت! (المشتركين: ${activeRoulette.players.size})`, ephemeral: true });
  }
  if (interaction.customId === 'r_leave') {
    activeRoulette.players.delete(username);
    return interaction.reply({ content: `📤 تم انسحابك من الروليت.`, ephemeral: true });
  }
  if (interaction.customId === 'r_start') {
    if (activeRoulette.players.size < 3) {
      return interaction.reply({ content: `⚠️ عذراً، يجب أن يكون هناك **3 أشخاص أو أكثر** لبدء الروليت! (العدد الحالي: ${activeRoulette.players.size})`, ephemeral: true });
    }
    return interaction.update({ content: `🎰 **بدأت لعبة الروليت!**\nالمشاركون (${activeRoulette.players.size}): ${Array.from(activeRoulette.players).join(', ')}\n🎉 تم سحب الفائز بنجاح!`, components: [] });
  }

  // تفاعلات المافيا (شرط أكثر من 4 أشخاص يعني 5 فأكثر)
  if (interaction.customId === 'mafia_join') {
    activeMafia.players.add(username);
    return interaction.reply({ content: `🕶️ انضممت للمافيا! (المشتركين: ${activeMafia.players.size})`, ephemeral: true });
  }
  if (interaction.customId === 'mafia_start') {
    if (activeMafia.players.size <= 4) {
      return interaction.reply({ content: `⚠️ عذراً، لعبة المافيا تتطلب **أكثر من 4 أشخاص** (5 لاعبين فأكثر)! (العدد الحالي: ${activeMafia.players.size})`, ephemeral: true });
    }
    const playersArr = Array.from(activeMafia.players);
    const mafiaPlayer = playersArr[Math.floor(Math.random() * playersArr.length)];
    return interaction.update({ content: `🕵️‍♂️ **بدأت لعبة المافيا!**\nالعدد: ${activeMafia.players.size} لاعبين.\nتم اختيار المافيا في الخفاء، استعدوا للتحقيق!`, components: [] });
  }

  if (interaction.customId === 'r_shop') return interaction.reply({ content: `🛍️ المتجر فارغ حالياً.`, ephemeral: true });
  if (interaction.customId === 'r_bag') return interaction.reply({ content: `🎒 حقيبتك فارغة.`, ephemeral: true });
  if (interaction.customId === 'r_stats') return interaction.reply({ content: `📊 إحصائياتك ممتازة!`, ephemeral: true });
});

client.login(process.env.TOKEN);
