const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

const usersData = {};

function getUserData(userId) {
  if (!usersData[userId]) {
    usersData[userId] = {
      points: 2000,          
      weeklyPoints: 0,     
      rank: 191, 
      gamesPoints: { 'روليت': 0, 'مافيا': 0, 'نرد': 0, 'اعلام': 0, 'اسرع': 0, 'حسم': 0 },
      groupGames: 0,
      inventory: {
        revive: 0,       // الإنعاش
        shield: 0,       // درع الحماية
        extraLuck: 0,    // الحظ الإضافي
        retry: 0,        // إعادة المحاولة
        stealth: 0,      // التخفي
        survivalKey: 0,  // مفتاح النجاة
        mafiaDetector: 0,// كاشف الهوية
        nightShield: 0,  // الحماية الليلية
        escape: 0,       // الهروب
        secretGuide: 0   // الدليل السري
      },
      rouletteStats: { wins: 0, purchasePoints: 0, leftCount: 0, kickedCount: 0 }
    };
  }
  return usersData[userId];
}

async function handlePoints(message, command, args) {
  const userId = message.author.id;
  const data = getUserData(userId);

  if (command === '-الحقيبة') {
    const embed = new EmbedBuilder()
      .setColor('#8B0000')
      .setTitle('حقيبتك الشخصية (المخزون)')
      .setDescription(
        '**خصائص الروليت:**\n' +
        `- الإنعاش: ${data.inventory.revive}\n` +
        `- درع الحماية: ${data.inventory.shield}\n` +
        `- الحظ الإضافي: ${data.inventory.extraLuck}\n` +
        `- إعادة المحاولة: ${data.inventory.retry}\n` +
        `- التخفي: ${data.inventory.stealth}\n` +
        `- مفتاح النجاة: ${data.inventory.survivalKey}\n\n` +
        '**خصائص المافيا:**\n' +
        `- كاشف الهوية: ${data.inventory.mafiaDetector}\n` +
        `- الحماية الليلية: ${data.inventory.nightShield}\n` +
        `- الهروب: ${data.inventory.escape}\n` +
        `- الدليل السري: ${data.inventory.secretGuide}`
      );
    return message.reply({ embeds: [embed] });
  }

  if (command === '-شراء') {
    const category = args[1]; 
    const item = args[2];     

    let price = 0;
    let key = '';

    if (category === 'روليت') {
      if (item === 'إنعاش') { price = 500; key = 'revive'; }
      else if (item === 'درع') { price = 700; key = 'shield'; }
      else if (item === 'الحظ') { price = 600; key = 'extraLuck'; }
      else if (item === 'إعادة') { price = 800; key = 'retry'; }
      else if (item === 'التخفي') { price = 900; key = 'stealth'; }
      else if (item === 'مفتاح') { price = 1000; key = 'survivalKey'; }
    } else if (category === 'مافيا') {
      if (item === 'كاشف') { price = 700; key = 'mafiaDetector'; }
      else if (item === 'الحماية') { price = 800; key = 'nightShield'; }
      else if (item === 'الهروب') { price = 900; key = 'escape'; }
      else if (item === 'الدليل') { price = 600; key = 'secretGuide'; }
    }

    if (!price || !key) {
      return message.reply("يرجى تحديد القسم والأداة بشكل صحيح. مثال: `-شراء روليت درع`");
    }

    if (data.points >= price) {
      data.points -= price;
      data.inventory[key] += 1;
      data.rouletteStats.purchasePoints += price;
      return message.reply(`تم شراء أداة (${item}) بنجاح وإضافتها إلى حقيبتك!`);
    } else {
      return message.reply(`رصيدك غير كافي لشراء هذه الأداة (تحتاج إلى ${price} نقطة).`);
    }
  }

  if (command === '-نقاطي') {
    try {
      const user = message.author;
      const canvas = createCanvas(1000, 500);
      const ctx = canvas.getContext('2d');

      const background = await loadImage('https://cdn.discordapp.com/attachments/1552241868241240175/1563809446344392815/2E651F07-6E9C-4691-8F69-BD9334538F2E.png');
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(user.username, 720, 110);

      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`الترتيب #${data.rank} في السيرفر`, 720, 145);

      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(data.points.toString(), 825, 360);        
      ctx.fillText(data.groupGames.toString(), 595, 360);    
      ctx.fillText(data.gamesPoints['روليت'].toString(), 365, 360); 
      ctx.fillText(data.weeklyPoints.toString(), 135, 360);   

      let bestGameText = "مافيه نقاط لعبة مسجلة بعد";
      let maxPts = 0;
      for (const [gameName, pts] of Object.entries(data.gamesPoints)) {
        if (pts > maxPts) { maxPts = pts; bestGameText = gameName; }
      }

      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(bestGameText, 850, 455);

      ctx.save();
      ctx.beginPath();
      ctx.arc(850, 120, 60, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
      ctx.drawImage(avatar, 850 - 60, 120 - 60, 120, 120);
      ctx.restore();

      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'points-card.png' });
      return message.reply({ files: [attachment] });
    } catch (error)  {
      console.error(error);
      return message.reply('حدث خطأ أثناء إنشاء بطاقة النقاط.');
    }
  }
}

module.exports = { getUserData, handlePoints };
