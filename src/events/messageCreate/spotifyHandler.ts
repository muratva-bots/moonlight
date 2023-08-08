import { Client } from '@/structures';
import { EmbedBuilder, Message } from 'discord.js';

function spotifyHandler(client: Client, message: Message) {
    if (!message.activity) return false;

    const warn = client.warns.get(message.author.id);
    if (!warn) {
        client.warns.set(message.author.id, { count: 1, lastWarn: message.createdTimestamp });
        return;
    }

    if (message.deletable) message.delete();

    warn.count = warn.count + 1;

    const embed = new EmbedBuilder({ color: client.utils.getRandomColor() });
    const diff = message.createdTimestamp - warn.lastWarn;
    if (diff < 4000 && warn.count >= 5) {
        client.warns.delete(message.author.id);
        message.member.timeout(1000 * 60 * 3, 'Çok fazla aktivite mesajı attınız.');
        message.channel
            .send({
                embeds: [
                    embed.setDescription(
                        `${message.member} çok fazla aktivite mesajı attığın için 3 dakika timeout yedi!`,
                    ),
                ],
            })
            .then((msg) => setTimeout(() => msg.delete(), 5000));
        return true;
    } else if (diff > 4000) {
        warn.lastWarn = message.createdTimestamp;
        warn.count = 1;
    }

    if (warn.count === 3)
        message.channel.send({ content: 'bokunu çıkardın sanki!' }).then((msg) => setTimeout(() => msg.delete(), 5000));

    return false;
}

export default spotifyHandler;
