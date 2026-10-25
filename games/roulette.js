const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');

module.exports = async function(message) {
  const players = new Set();
  const maxPlayers = 15;

  const attachment = new AttachmentBuilder('https://cdn.discordapp.com/attachments/1552241868241240175/1563809433656762450/B17B3AD9-4C36-435D-93FC-5CB6B03FAC66.png', { name: 'roulette.png' });
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('r_join').setLabel('انضمام (0/15)').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('r_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary)
  );

  const gameMessage = await message.channel.send({ 
    content: "لعبة روليت - البداية خلال 5 ثوانٍ:", 
    files: [attachment], 
    components: [row] 
  });

  const collector = gameMessage.createMessageComponentCollector({ time: 5000 });

  collector.on('collect', async i => {
    if (i.customId === 'r_join') {
      players.add(i.user.username);
      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('r_join').setLabel(`انضمام (${players.size}/${maxPlayers})`).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('r_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary)
      );
      await i.update({ components: [updatedRow] });
    } else if (i.customId === 'r_leave') {
      players.delete(i.user.username);
      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('r_join').setLabel(`انضمام (${players.size}/${maxPlayers})`).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('r_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary)
      );
      await i.update({ components: [updatedRow] });
    }
  });

  collector.on('end', async () => {
    if (players.size < 3) {
      await gameMessage.edit({ content: `انتهى الوقت. لم يكتمل العدد المطلوب (العدد الحالي: ${players.size} من 3). ملغاة.`, components: [] });
    } else {
      const playersArr = Array.from(players);
      const winner = playersArr[Math.floor(Math.random() * playersArr.length)];
      await gameMessage.edit({ content: `انتهت اللعبة! الفائز في الروليت هو: ${winner}`, components: [] });
    }
  });
};
