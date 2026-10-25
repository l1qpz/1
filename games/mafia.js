const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = async function(message) {
  const players = new Set();
  const maxPlayers = 50;

  const embed = new EmbedBuilder()
    .setColor('#2C2F33')
    .setTitle('مافيا')
    .setDescription('لعبة مافيا - البداية خلال 30 ثانية\n(تتطلب أكثر من 4 أشخاص للبدء):')
    .setImage('https://cdn.discordapp.com/attachments/1552241868241240175/1563809455269875733/BDF88FE8-7B9A-46A9-A1FA-3E8DD7706FA0.png');
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('m_join').setLabel('انضمام (0/50)').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('m_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary)
  );

  const gameMessage = await message.channel.send({ 
    embeds: [embed], 
    components: [row] 
  });

  // مؤقت لمدة 30 ثانية
  const collector = gameMessage.createMessageComponentCollector({ time: 30000 });

  collector.on('collect', async i => {
    if (i.customId === 'm_join') {
      players.add(i.user.username);
      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('m_join').setLabel(`انضمام (${players.size}/${maxPlayers})`).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('m_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary)
      );
      await i.update({ components: [updatedRow] });
    } else if (i.customId === 'm_leave') {
      players.delete(i.user.username);
      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('m_join').setLabel(`انضمام (${players.size}/${maxPlayers})`).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('m_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary)
      );
      await i.update({ components: [updatedRow] });
    }
  });

  collector.on('end', async () => {
    if (players.size <= 4) {
      const expiredEmbed = new EmbedBuilder()
        .setColor('#2C2F33')
        .setTitle('مافيا - ملغاة')
        .setDescription(`انتهى الوقت (30 ثانية). عدد اللاعبين غير كافٍ (يحتاج أكثر من 4، والعدد الحالي: ${players.size}). تم إلغاء اللعبة.`)
        .setImage('https://cdn.discordapp.com/attachments/1552241868241240175/1563809455269875733/BDF88FE8-7B9A-46A9-A1FA-3E8DD7706FA0.png');
      return gameMessage.edit({ embeds: [expiredEmbed], components: [] });
    } else {
      const playersArr = Array.from(players);
      const mafia = playersArr[Math.floor(Math.random() * playersArr.length)];
      
      const startEmbed = new EmbedBuilder()
        .setColor('#2C2F33')
        .setTitle('مافيا - بدأت اللعبة')
        .setDescription(`بدأت لعبة المافيا! عدد المشاركين: ${players.size}. تم توزيع الأدوار!`)
        .setImage('https://cdn.discordapp.com/attachments/1552241868241240175/1563809455269875733/BDF88FE8-7B9A-46A9-A1FA-3E8DD7706FA0.png');

      await gameMessage.edit({ embeds: [startEmbed], components: [] });
    }
  });
};
