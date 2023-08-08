import { Client } from '@/structures';
import { EmbedBuilder, Message } from 'discord.js';

const capsRegex: RegExp = new RegExp(/[A-ZĞÇÖİÜ]/, 'gm');
const textRegex: RegExp = new RegExp(/[a-zğçöıü]/, 'gm');

function capsHandler(client: Client, message: Message) {
    if (!message.content || 10 > message.content.length) return;

    const capsText = message.content.replace(textRegex, '');
    const capsPerc = 1 - capsText.replace(capsRegex, '').length / capsText.length;

    if (6 > capsText.length || 0.7 > capsPerc) return;

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
        message.member.timeout(1000 * 60 * 3, 'Çok fazla büyük harf kullandınız.');
        message.channel
            .send({
                embeds: [
                    embed.setDescription(
                        `${message.member} büyük harf kullanımını azaltmadığın için 3 dakika boyunca timeout yedin!`,
                    ),
                ],
            })
            .then((msg) => setTimeout(() => msg.delete(), 10000));
    } else if (diff > 8000) {
        warn.lastWarn = message.createdTimestamp;
        warn.count = 1;
    }

    if (warn.count === 3)
        message.channel
            .send({ embeds: [embed.setDescription(`Büyük harf kullanımını azaltman gerekiyor.`)] })
            .then((msg) => setTimeout(() => msg.delete(), 5000));
}

export default capsHandler;
