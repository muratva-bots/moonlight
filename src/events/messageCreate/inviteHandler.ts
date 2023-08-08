import { Client } from '@/structures';
import { EmbedBuilder, Message } from 'discord.js';

const inviteRegex = new RegExp(/discord(?:app.com\/invite|.gg|.me|.io)(?:[\\]+)?\/([a-zA-Z0-9\-]+)/, 'gi');

async function inviteHandler(client: Client, message: Message) {
    if (!message.content || 6 > message.content.length) return false;

    const match = message.content.match(inviteRegex);
    if (!match || !match.length) return false;

    if (message.deletable) message.delete();

    const warn = client.warns.get(message.author.id);
    if (!warn) {
        client.warns.set(message.author.id, { count: 1, lastWarn: message.createdTimestamp });
        return;
    }

    warn.count = warn.count + 1;

    const embed = new EmbedBuilder({ color: client.utils.getRandomColor() });
    const diff = message.createdTimestamp - warn.lastWarn;
    if (diff < 8000 && warn.count >= 5) {
        client.warns.delete(message.author.id);
        message.member.timeout(1000 * 60 * 60 * 24, 'Çok fazla reklam içeren mesaj attınız.');
        message.channel.send({
            embeds: [embed.setDescription(`${message.member} reklam yaptığın için 1 gün boyunca timeout yedin!`)],
        });
        return true;
    } else if (diff > 8000) {
        warn.lastWarn = message.createdTimestamp;
        warn.count = 1;
    }

    if (warn.count === 3) message.reply({ embeds: [embed.setDescription(`Reklam yapman yanlış bir davranış!`)] });
    return false;
}

export default inviteHandler;
