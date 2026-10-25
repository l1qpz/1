const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { getUserData } = require('./points');

module.exports = async function(message) {
  const players = new Map();
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

    // زر فتح المتجر التفاعلي بأزرار الشراء
    if (i.customId === 'm_shop') {
      const shopEmbed = new EmbedBuilder()
        .setColor('#8B0000')
        .setTitle('متجر خصائص المافيا')
        .setDescription('اختر الأداة التي تريد شراءها مباشرة (تخصم من نقاطك):');

      const shopRow1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('buy_detector').setLabel('كاشف الهوية (700)').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('buy_nightshield').setLabel('الحماية الليلية (800)').setStyle(ButtonStyle.Success)
      );

      const shopRow2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('buy_escape').setLabel('الهروب (900)').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('buy_secretguide').setLabel('الدليل السري (600)').setStyle(ButtonStyle.Success)
      );

      return i.reply({ embeds: [shopEmbed], components: [shopRow1, shopRow2], ephemeral: true });
    }

    // عمليات الشراء الفوري عبر الأزرار
    if (i.customId.startsWith('buy_')) {
      let itemKey = '';
      let itemName = '';
      let price = 0;

      if (i.customId === 'buy_detector') { itemKey = 'mafiaDetector'; itemName = 'كاشف الهوية'; price = 700; }
      else if (i.customId === 'buy_nightshield') { itemKey = 'nightShield'; itemName = 'الحماية الليلية'; price = 800; }
      else if (i.customId === 'buy_escape') { itemKey = 'escape'; itemName = 'الهروب'; price = 900; }
      else if (i.customId === 'buy_secretguide') { itemKey = 'secretGuide'; itemName = 'الدليل السري'; price = 600; }

      if (uData.points >= price) {
        uData.points -= price;
        uData.inventory[itemKey] += 1;
        return i.reply({ content: `تم شراء (${itemName}) بنجاح! تم خصم ${price} نقطة وإضافتها لحقيبتك.`, ephemeral: true });
      } else {
        return i.reply({ content: `رصيدك غير كافي! تحتاج إلى ${price} نقطة (رصيدك: ${uData.points}).`, ephemeral: true });
      }
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

    const playerArray = Array.from(players.values());
    const roles = ['مافيا', 'طبيب', 'محقق'];
    while (roles.length < playerArray.length) {
      roles.push('مواطن');
    }
    roles.sort(() => Math.random() - 0.5);

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
      .setDescription(`بدأت لعبة المافيا! عدد المشاركين: ${playerArray.length}.\nتم إرسال الأدوار (طبيب، محقق، مافيا، مواطنون) في رسائل خاصة عبر القرعة العشوائية!`)
      .setImage('https://cdn.discordapp.com/attachments/1552241868241240175/1563809455269875733/BDF88FE8-7B9A-46A9-A1FA-3E8DD7706FA0.png');

    await gameMessage.edit({ embeds: [startEmbed], components: [] });
  });
};
