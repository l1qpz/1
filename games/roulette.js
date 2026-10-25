const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');
const { getUserData } = require('./points');

module.exports = async function(message) {
  const players = new Map();
  const maxPlayers = 50;

  const embed = new EmbedBuilder()
    .setColor('#8B0000')
    .setTitle('روليت')
    .setDescription('لعبة روليت - البداية خلال 30 ثانية\nاضغط على زر الانضمام للمشاركة:')
    .setImage('https://cdn.discordapp.com/attachments/1552241868241240175/1563809433656762450/B17B3AD9-4C36-435D-93FC-5CB6B03FAC66.png');

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('r_join').setLabel('انضمام (0/50)').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('r_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('r_shop').setLabel('متجر الخصائص').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('r_bag').setLabel('الحقيبة').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('r_stats').setLabel('إحصائيات').setStyle(ButtonStyle.Primary)
  );

  const gameMessage = await message.channel.send({ 
    embeds: [embed], 
    components: [row1, row2] 
  });

  // مؤقت لمدة 30 ثانية
  const collector = gameMessage.createMessageComponentCollector({ time: 30000 });

  collector.on('collect', async i => {
    const uData = getUserData(i.user.id);
    
    if (i.customId === 'r_stats') {
      return i.reply({
        content: `إحصائيات الروليت الخاصة بك:\n` +
                 `- عدد مرات الفوز: ${uData.rouletteStats.wins}\n` +
                 `- نقاط الشراء المستهلكة: ${uData.rouletteStats.purchasePoints}\n` +
                 `- عدد مرات الانسحاب: ${uData.rouletteStats.leftCount}\n` +
                 `- عدد مرات الطرد: ${uData.rouletteStats.kickedCount}`,
        ephemeral: true
      });
    }

    if (i.customId === 'r_shop') {
      return i.reply({
        content: `متجر الخصائص:\n1 - درع حماية (100 نقطة)\n2 - أداة إنعاش (150 نقطة)\nاكتب -متجر أو -شراء درع للشراء.`,
        ephemeral: true
      });
    }

    if (i.customId === 'r_bag') {
      return i.reply({
        content: `حقيبتك:\n- درع الحماية: ${uData.shield ? 'مفعل' : 'غير مفعل'}\n- أدوات الإنعاش: ${uData.reviveItem}`,
        ephemeral: true
      });
    }

    if (i.customId === 'r_join') {
      if (players.size >= maxPlayers) return i.reply({ content: 'اكتمل العدد الأقصى (50 لاعباً)!', ephemeral: true });
      players.set(i.user.id, { username: i.user.username, member: i.member });
      
      const updatedRow1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('r_join').setLabel(`انضمام (${players.size}/${maxPlayers})`).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('r_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary)
      );
      await i.update({ components: [updatedRow1, row2] });
    } else if (i.customId === 'r_leave') {
      if (players.has(i.user.id)) {
        players.delete(i.user.id);
        uData.rouletteStats.leftCount += 1;
        const updatedRow1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('r_join').setLabel(`انضمام (${players.size}/${maxPlayers})`).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('r_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary)
        );
        await i.update({ components: [updatedRow1, row2] });
      } else {
        i.reply({ content: 'أنت لست منضماً أصلاً!', ephemeral: true });
      }
    }
  });

  collector.on('end', async () => {
    if (players.size < 3) {
      const expiredEmbed = new EmbedBuilder()
        .setColor('#8B0000')
        .setTitle('روليت - ملغاة')
        .setDescription(`انتهى الوقت (30 ثانية). لم يكتمل العدد المطلوب (العدد الحالي: ${players.size} من 3). تم إلغاء اللعبة.`)
        .setImage('https://cdn.discordapp.com/attachments/1552241868241240175/1563809433656762450/B17B3AD9-4C36-435D-93FC-5CB6B03FAC66.png');
      return gameMessage.edit({ embeds: [expiredEmbed], components: [] });
    }

    let activePlayers = Array.from(players.values());
    
    const startEmbed = new EmbedBuilder()
      .setColor('#8B0000')
      .setTitle('روليت - بدأت اللعبة')
      .setDescription(`بدأت العجلة بالدوران! تم تسجيل ${activePlayers.length} مشاركاً. تنطلق جولات الطرد...`)
      .setImage('https://cdn.discordapp.com/attachments/1552241868241240175/1563809433656762450/B17B3AD9-4C36-435D-93FC-5CB6B03FAC66.png');

    await gameMessage.edit({ embeds: [startEmbed], components: [] });

    while (activePlayers.length > 1) {
      const chosenIndex = Math.floor(Math.random() * activePlayers.length);
      const chosenPlayer = activePlayers[chosenIndex];

      await message.channel.send(`العجلة اختارت اللاعب: **${chosenPlayer.username}**! لديه صلاحية طرد لاعب آخر.`);

      const targets = activePlayers.filter(p => p.username !== chosenPlayer.username);
      if (targets.length === 0) break;

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('kick_target')
        .setPlaceholder('اختر لاعباً لطرده من العجلة')
        .addOptions(targets.slice(0, 25).map(t => ({ label: t.username, value: t.username })));

      const menuRow = new ActionRowBuilder().addComponents(selectMenu);
      const turnMsg = await message.channel.send({ content: `دور **${chosenPlayer.username}** لاختيار ضحيته خلال 10 ثوانٍ:`, components: [menuRow] });

      try {
        const selection = await turnMsg.awaitMessageComponent({ 
          filter: i => i.user.username === chosenPlayer.username, 
          time: 10000 
        });

        const targetName = selection.values[0];
        const targetObj = activePlayers.find(p => p.username === targetName);
        const targetData = getUserData(targetObj.member.id);

        await selection.update({ content: `تم اختيار **${targetName}** لطرده!`, components: [] });

        if (targetData.shield) {
          targetData.shield = false;
          await message.channel.send(`انقذ درع الحماية اللاعب **${targetName}** ولم يتم طرده!`);
        } else if (targetData.reviveItem > 0) {
          targetData.reviveItem -= 1;
          await message.channel.send(`تم طرد اللاعب **${targetName}**، لكنه استخدم أداة الإنعاش وعاد للعبة!`);
        } else {
          targetData.rouletteStats.kickedCount += 1;
          activePlayers = activePlayers.filter(p => p.username !== targetName);
          await message.channel.send(`تم طرد اللاعب **${targetName}** بنجاح من العجلة!`);
        }
      } catch (err) {
        const randomTarget = targets[Math.floor(Math.random() * targets.length)];
        const tData = getUserData(randomTarget.member.id);
        
        if (tData.shield) {
          tData.shield = false;
          await message.channel.send(`انتهى الوقت! درع الحماية حمى **${randomTarget.username}** من الطرد التلقائي.`);
        } else {
          tData.rouletteStats.kickedCount += 1;
          activePlayers = activePlayers.filter(p => p.username !== randomTarget.username);
          await message.channel.send(`انتهى الوقت ولم يترشح أحد. تم طرد **${randomTarget.username}** تلقائياً.`);
        }
      }

      await new Promise(res => setTimeout(res, 3000));
    }

    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      const wData = getUserData(winner.member.id);
      wData.rouletteStats.wins += 1;
      wData.points += 100;
      wData.gamesPoints['روليت'] += 100;

      await message.channel.send(`انتهت اللعبة! الفائز الأخير في الروليت هو **${winner.username}** وحصل على جائزة 100 نقطة!`);
    }
  });
};
