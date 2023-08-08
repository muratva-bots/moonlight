import { Client } from '@/structures';
import { EmbedBuilder, Message } from 'discord.js';
import emojiRegex from 'emoji-regex';

const customRegex: RegExp = new RegExp(/<a?:(.*?:[0-9]+)>/, 'gi');

function emojiHandler(client: Client, message: Message) {
    if (!message.content || 4 > message.content.length) return false;

    const emojiMatch = message.content.match(emojiRegex());
    const customMatch = message.content.match(customRegex);

    let emojiCount = 0;
    if (emojiMatch && emojiMatch.length) emojiCount += emojiMatch.length;
    if (customMatch && customMatch.length) emojiCount += customMatch.length;
    if (!emojiCount || 6 > emojiCount) return false;

    if (message.deletable) message.delete();

    const warn = client.warns.get(message.author.id);
    if (!warn) {
        client.warns.set(message.author.id, { count: 1, lastWarn: message.createdTimestamp });
        return false;
    }

    warn.count = warn.count + 1;

    const embed = new EmbedBuilder({ color: client.utils.getRandomColor() });
    const diff = message.createdTimestamp - warn.lastWarn;
    if (diff < 8000 && warn.count >= 5) {
        client.warns.delete(message.author.id);
        message.member.timeout(1000 * 60 * 60 * 1, 'Çok fazla büyük harf kullandınız.');
        message.channel
            .send({
                embeds: [
                    embed.setDescription(
                        `${message.member} emoji kullanımını azaltmadığın için 3 dakika boyunca timeout yedin!`,
                    ),
                ],
            })
            .then((msg) => setTimeout(() => msg.delete(), 10000));
        return true;
    } else if (diff > 8000) {
        warn.lastWarn = message.createdTimestamp;
        warn.count = 1;
    }

    if (warn.count === 3)
        message.channel
            .send({ embeds: [embed.setDescription(`Çok fazla emoji kullanıyorsun.`)] })
            .then((msg) => setTimeout(() => msg.delete(), 5000));
    return false;
}

export default emojiHandler;
