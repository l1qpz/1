const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

const usersData = {};

function getUserData(userId) {
  if (!usersData[userId]) {
    usersData[userId] = {
      points: 0,          
      weeklyPoints: 0,     
      rank: 191, 
      gamesPoints: { 'روليت': 0, 'مافيا': 0, 'نرد': 0, 'اعلام': 0, 'اسرع': 0, 'حسم': 0 },
      groupGames: 0,
      shield: false,
      reviveItem: 0, // أداة الإنعاش
      // الإحصائيات الجديدة المطلوبة للروليت
      rouletteStats: {
        wins: 0,
        purchasePoints: 0, // النقاط المستهلكة في الشراء
        leftCount: 0,     // كم مرة انسحب
        kickedCount: 0    // كم مرة انطرد
      }
    };
  }
  return usersData[userId];
}

module.exports = { getUserData, async function(message, command, args) {
  const userId = message.author.id;
  const data = getUserData(userId);

  if (command === '-متجر') {
    return message.reply(
      "--- متجر خصائص السيرفر ---\n\n" +
      "1 - درع حماية (السعر: 100 نقطة) - يحميك من الطرد\n" +
      "2 - أداة إنعاش (السعور: 150 نقطة) - تعيدك بعد الطرد\n\n" +
      "الحالة:\n" +
      "- درع الحماية: " + (data.shield ? "مفعل" : "غير مفعل") + "\n" +
      "- أدوات الإنعاش المتوفرة: " + data.reviveItem + "\n\n" +
      "ل الشراء، اكتب: -شراء درع أو -شراء إنعاش"
    );
  }

  if (command === '-شراء') {
    if (args[1] === 'درع') {
      if (data.points >= 100) {
        data.points -= 100;
        data.shield = true;
        data.rouletteStats.purchasePoints += 100;
        return message.reply("تم شراء درع الحماية بنجاح!");
      } else {
        return message.reply("رصيدك غير كافي لشراء الدرع (يحتاج 100 نقطة).");
      }
    } else if (args[1] === 'إنعاش') {
      if (data.points >= 150) {
        data.points -= 150;
        data.reviveItem += 1;
        data.rouletteStats.purchasePoints += 150;
        return message.reply("تم شراء أداة الإنعاش بنجاح!");
      } else {
        return message.reply("رصيدك غير كافي لشراء أداة الإنعاش (يحتاج 150 نقطة).");
      }
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
    } catch (error) {
      console.error(error);
      return message.reply('حدث خطأ أثناء إنشاء بطاقة النقاط.');
    }
  }

  // عرض إحصائيات الروليت التفصيلية
  if (command === '-احصائيات-روليت') {
    return message.reply(
      `--- إحصائيات الروليت الخاصة بك ---\n` +
      `- عدد مرات الفوز: ${data.rouletteStats.wins}\n` +
      `- نقاط الشراء المستهلكة: ${data.rouletteStats.purchasePoints}\n` +
      `- عدد مرات الانسحاب: ${data.rouletteStats.leftCount}\n` +
      `- عدد مرات الطرد: ${data.rouletteStats.kickedCount}`
    );
  }
}};
