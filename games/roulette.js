const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, StringSelectMenuBuilder } = require('discord.js');
const { getUserData } = require('./points');

module.exports = async function(message) {
  const players = new Map(); // تخزين المستخدمين ومعلوماتهم
  const maxPlayers = 50;

  const attachment = new AttachmentBuilder('https://cdn.discordapp.com/attachments/1552241868241240175/1563809433656762450/B17B3AD9-4C36-435D-93FC-5CB6B03FAC66.png', { name: 'roulette.png' });
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('r_join').setLabel('انضمام (0/50)').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('r_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary)
  );

  const gameMessage = await message.channel.send({ 
    content: "لعبة روليت - البداية خلال 5 ثوانٍ (الحد الأقصى 50 لاعباً):", 
    files: [attachment], 
    components: [row] 
  });

  const collector = gameMessage.createMessageComponentCollector({ time: 5000 });

  collector.on('collect', async i => {
    const uData = getUserData(i.user.id);
    if (i.customId === 'r_join') {
      if (players.size >= maxPlayers) return i.reply({ content: 'اكتمل العدد الأقصى (50 لاعباً)!', ephemeral: true });
      players.set(i.user.id, { username: i.user.username, member: i.member });
      
      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('r_join').setLabel(`انضمام (${players.size}/${maxPlayers})`).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('r_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary)
      );
      await i.update({ components: [updatedRow] });
    } else if (i.customId === 'r_leave') {
      if (players.has(i.user.id)) {
        players.delete(i.user.id);
        uData.rouletteStats.leftCount += 1; // تسجيل الانسحاب في الإحصائيات
        const updatedRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('r_join').setLabel(`انضمام (${players.size}/${maxPlayers})`).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('r_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary)
        );
        await i.update({ components: [updatedRow] });
      } else {
        i.reply({ content: 'أنت لست منضماً أصلاً!', ephemeral: true });
      }
    }
  });

  collector.on('end', async () => {
    if (players.size < 3) {
      return gameMessage.edit({ content: `انتهى الوقت. لم يكتمل العدد المطلوب (العدد الحالي: ${players.size} من 3). ملغاة.`, components: [] });
    }

    let activePlayers = Array.from(players.values());
    
    // محاكات دوران العجلة وجولات الطرد
    await gameMessage.edit({ content: `بدأت العجلة بالدوران! تم تسجيل ${activePlayers.length} مشاركاً. تنطلق جولات الطرد والاحتمالات...`, components: [] });

    // حلقة اللعبة حتى يبقى شخص واحد أو ينتهي التنافس
    while (activePlayers.length > 1) {
      // اختيار لاعب عشوائي بواسطة "العجلة"
      const chosenIndex = Math.floor(Math.random() * activePlayers.length);
      const chosenPlayer = activePlayers[chosenIndex];

      await message.channel.send(`العجلة اختارت اللاعب: **${chosenPlayer.username}**! لديه صلاحية طرد لاعب آخر.`);

      // إنشاء قائمة منسقة بأسماء اللاعبين الآخرين ليختار من يطرده
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

        // فحص درع الحماية أو الإنعاش
        if (targetData.shield) {
          targetData.shield = false; // استهلاك الدرع
          await message.channel.send(`انقذ درع الحماية اللاعب **${targetName}** ولم يتم طرده!`);
        } else if (targetData.reviveItem > 0) {
          targetData.reviveItem -= 1; // استهلاك أداة الإنعاش
          await message.channel.send(`تم طرد اللاعب **${targetName}**، لكنه استخدم أداة الإنعاش وعاد للعبة!`);
        } else {
          // طرد حقيقي وتسجيله في الإحصائيات
          targetData.rouletteStats.kickedCount += 1;
          activePlayers = activePlayers.filter(p => p.username !== targetName);
          await message.channel.send(`تم طرد اللاعب **${targetName}** بنجاح من العجلة!`);
        }
      } catch (err) {
        // لو انتهى الوقت ولم يختار، يتم طرد لاعب عشوائي تلقائياً
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

      // مهلة بسيطة بين الجولات
      await new Promise(res => setTimeout(res, 3000));
    }

    // إعلان الفائز النهائي
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      const wData = getUserData(winner.member.id);
      wData.rouletteStats.wins += 1; // تسجيل الفوز في الإحصائيات
      wData.points += 100;
      wData.gamesPoints['روليت'] += 100;

      await message.channel.send(`انتهت اللعبة! الفائز الأخير في الروليت هو **${winner.username}** وحصل على جائزة 100 نقطة وتسجيل فوز جديد في إحصائياته!`);
    }
  });
};
