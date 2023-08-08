import { Collection, Message, TextChannel } from 'discord.js';

interface ISpam {
    createdAt: number;
    messages: string[];
}

const spams = new Collection<string, ISpam>();

setInterval(() => {
    const now = Date.now();
    spams.filter((v) => 4000 > now - v.createdAt).forEach((_, k) => spams.delete(k));
}, 60000);

function spamHandler(message: Message) {
    const spam = spams.get(message.author.id);

    if (!spam) {
        spams.set(message.author.id, { createdAt: Date.now(), messages: [message.id] });
        return false;
    }

    spam.messages.push(message.id);

    const diff = message.createdTimestamp - spam.createdAt;
    if (diff < 8000 && spam.messages.length >= 5) {
        (message.channel as TextChannel).bulkDelete(spam.messages);
        spams.delete(message.author.id);
        message.member.timeout(1000 * 60 * 3, 'Çok fazla spam yaptınız.');
        message.channel
            .send({ content: `${message.member} çok hızlı mesaj yazdığın için 3 dakika boyunca timeout yedin!` })
            .then((msg) => setTimeout(() => msg.delete(), 10000));
        return true;
    } else if (diff > 8000) {
        spam.createdAt = message.createdTimestamp;
        spam.messages = [message.id];
    }

    if (spam.messages.length === 3)
        message.channel
            .send({ content: 'çok hızlı yazıyorsun yavaşla!' })
            .then((msg) => setTimeout(() => msg.delete(), 5000));

    return false;
}

export default spamHandler;
