const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');

module.exports = async function(message) {
  const players = new Set();
  const maxPlayers = 15;

  const attachment = new AttachmentBuilder('https://cdn.discordapp.com/attachments/1552241868241240175/1563809455269875733/BDF88FE8-7B9A-46A9-A1FA-3E8DD7706FA0.png', { name: 'mafia.png' });
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('m_join').setLabel('انضمام (0/15)').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('m_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary)
  );

  const gameMessage = await message.channel.send({ 
    content: "لعبة مافيا - البداية خلال 5 ثوانٍ:", 
    files: [attachment], 
    components: [row] 
  });

  const collector = gameMessage.createMessageComponentCollector({ time: 5000 });

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
      await gameMessage.edit({ content: `انتهى الوقت. عدد اللاعبين غير كافٍ (يحتاج أكثر من 4، والعدد الحالي: ${players.size}). ملغاة.`, components: [] });
    } else {
      await gameMessage.edit({ content: `بدأت لعبة المافيا! عدد المشاركين: ${players.size}. تم توزيع الأدوار!`, components: [] });
    }
  });
};
