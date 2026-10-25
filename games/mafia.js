const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { getUserData } = require('./points');

module.exports = async function(message) {
  const players = new Map(); // تخزين معلومات اللاعبين (id, member, username)
  const maxPlayers = 15;

  const embed = new EmbedBuilder()
    .setColor('#8B0000')
    .setTitle('مافيا')
    .setDescription('لعبة مافيا - البداية خلال 30 ثانية\n(تتطلب أكثر من 4 أشخاص للبدء):')
    .setImage('https://cdn.discordapp.com/attachments/1552241868241240175/1563809455269875733/BDF88FE8-7B9A-46A9-A1FA-3E8DD7706FA0.png');
  
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('m_join').setLabel('انضمام (0/15)').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('m_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('m_shop').setLabel('متجر الخصائص').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('m_bag').setLabel('الحقيبة').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('m_stats').setLabel('إحصائيات').setStyle(ButtonStyle.Primary)
  );

  const gameMessage = await message.channel.send({ 
    embeds: [embed], 
    components: [row1, row2] 
  });

  const collector = gameMessage.createMessageComponentCollector({ time: 30000 });

  collector.on('collect', async i => {
    const uData = getUserData(i.user.id);

    if (i.customId === 'm_shop') {
      return i.reply({
        content: 
          '**متجر خصائص المافيا:**\n' +
          '1. كاشف الهوية (700 نقطة) - `-شراء مافيا كاشف`\n' +
          '2. الحماية الليلية (800 نقطة) - `-شراء مافيا الحماية`\n' +
          '3. الهروب (900 نقطة) - `-شراء مافيا الهروب`\n' +
          '4. الدليل السري (600 نقطة) - `-شراء مافيا الدليل`',
        ephemeral: true
      });
    }

    if (i.customId === 'm_bag') {
      return i.reply({
        content: `حقيبتك:\n- كاشف الهوية: ${uData.inventory.mafiaDetector}\n- الحماية الليلية: ${uData.inventory.nightShield}\n- الهروب: ${uData.inventory.escape}\n- الدليل السري: ${uData.inventory.secretGuide}`,
        ephemeral: true
      });
    }

    if (i.customId === 'm_stats') {
      return i.reply({
        content: `إحصائياتك في ألعاب السيرفر`,
        ephemeral: true
      });
    }

    if (i.customId === 'm_join') {
      if (players.size >= maxPlayers) return i.reply({ content: 'اكتمل العدد الأقصى (15 لاعباً)!', ephemeral: true });
      players.set(i.user.id, { user: i.user, username: i.user.username });
      
      const updatedRow1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('m_join').setLabel(`انضمام (${players.size}/${maxPlayers})`).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('m_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary)
      );
      await i.update({ components: [updatedRow1, row2] });
    } else if (i.customId === 'm_leave') {
      if (players.has(i.user.id)) {
        players.delete(i.user.id);
        const updatedRow1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('m_join').setLabel(`انضمام (${players.size}/${maxPlayers})`).setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('m_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary)
        );
        await i.update({ components: [updatedRow1, row2] });
      } else {
        i.reply({ content: 'أنت لست منضماً أصلاً!', ephemeral: true });
      }
    }
  });

  collector.on('end', async () => {
    if (players.size <= 4) {
      const expiredEmbed = new EmbedBuilder()
        .setColor('#8B0000')
        .setTitle('مافيا - ملغاة')
        .setDescription(`انتهى الوقت (30 ثانية). عدد اللاعبين غير كافٍ (يحتاج أكثر من 4، والعدد الحالي: ${players.size}). تم إلغاء اللعبة.`)
        .setImage('https://cdn.discordapp.com/attachments/1552241868241240175/1563809455269875733/BDF88FE8-7B9A-46A9-A1FA-3E8DD7706FA0.png');
      return gameMessage.edit({ embeds: [expiredEmbed], components: [] });
    }

    // توزيع الأدوار عشوائياً (قرعة)
    const playerArray = Array.from(players.values());
    
    // تحديد الأدوار بناءً على عدد اللاعبين
    // 1 مافيا، 1 طبيب، 1 محقق، والباقي مواطنون
    const roles = ['مافيا', 'طبيب', 'محقق'];
    while (roles.length < playerArray.length) {
      roles.push('مواطن');
    }

    // خلط الأدوار عشوائياً
    roles.sort(() => Math.random() - 0.5);

    // إرسال رسالة خاصة لكل لاعب بدوره
    for (let i = 0; i < playerArray.length; i++) {
      const p = playerArray[i];
      const assignedRole = roles[i];
      try {
        await p.user.send(`دورك في لعبة المافيا هو: **${assignedRole}**! حافظ على سرية دورك.`);
      } catch (err) {
        console.log(`تعذر إرسال رسالة خاصة إلى ${p.username}`);
      }
    }

    const startEmbed = new EmbedBuilder()
      .setColor('#8B0000')
      .setTitle('مافيا - بدأت اللعبة')
      .setDescription(`بدأت لعبة المافيا! عدد المشاركين: ${playerArray.length}.\nتم إرسال الأدوار (طبيب، محقق، مافيا، مواطنون) في رسائل خاصة لكل لاعب عبر القرعة العشوائية!`)
      .setImage('https://cdn.discordapp.com/attachments/1552241868241240175/1563809455269875733/BDF88FE8-7B9A-46A9-A1FA-3E8DD7706FA0.png');

    await gameMessage.edit({ embeds: [startEmbed], components: [] });
  });
};
