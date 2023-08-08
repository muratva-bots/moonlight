import { ModerationClass } from '@/models';
import { Collection, TextChannel, VoiceState, bold, inlineCode } from 'discord.js';

interface IChange {
    count: number;
    lastEnter: number;
}

const changes = new Collection<string, IChange>();

setInterval(() => {
    const now = Date.now();
    changes.filter((v) => 10000 > now - v.lastEnter).forEach((_, k) => changes.delete(k));
}, 60000);

async function microphoneBugHandler(state: VoiceState, guildData: ModerationClass) {
    const now = Date.now();
    const change = changes.get(state.id);
    if (!change) {
        changes.set(state.id, { count: 1, lastEnter: now });
        return;
    }

    change.count = change.count + 1;

    const diff = now - change.lastEnter;
    if (10000 > diff && change.count >= 12) {
        state.member.timeout(1000 * 60 * 30, 'Mikrofon-kulaklık bugı girişiminde bulunduğun için ceza yedin.');

        const channel = state.guild.channels.cache.get(guildData.chatChannel) as TextChannel;
        if (channel) {
            channel.send({
                content: `${state} (${inlineCode(state.id)}) adlı kullanıcı mikrofon-kulaklık bugı yaptığı için ${bold(
                    '30 dakika',
                )} sunucudan uzaklaştırıldı.`,
            });
        }
    } else if (diff > 10000) {
        change.count = 1;
        change.lastEnter = now;
    }
}

export default microphoneBugHandler;
