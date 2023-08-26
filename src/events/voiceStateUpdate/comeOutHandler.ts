import { ModerationClass } from '@/models';
import { Collection, PermissionFlagsBits, TextChannel, VoiceState, bold, inlineCode } from 'discord.js';

interface IComeOut {
    count: number;
    lastEnter: number;
}

const comeOuts = new Collection<string, IComeOut>();

setInterval(() => {
    const now = Date.now();
    comeOuts.filter((v) => 10000 > now - v.lastEnter).forEach((_, k) => comeOuts.delete(k));
}, 60000);

async function comeOutHandler(state: VoiceState, guildData: ModerationClass) {
    if (state.member.permissions.has(PermissionFlagsBits.Administrator)) return;

    const now = Date.now();
    const comeOut = comeOuts.get(state.id);
    if (!comeOut) {
        comeOuts.set(state.id, { count: 1, lastEnter: now });
        return;
    }

    comeOut.count = comeOut.count + 1;

    const diff = now - comeOut.lastEnter;
    if (5000 > diff && comeOut.count >= 3) {
        state.member.timeout(
            1000 * 60 * 30,
            'Çok fazla ses odalarında gir çık girişiminde bulunduğun için ceza yedin.',
        );

        const channel = state.guild.channels.cache.get(guildData.chatChannel) as TextChannel;
        if (channel) {
            channel.send({
                content: `${state.member} (${inlineCode(
                    state.member.id,
                )}) adlı kullanıcı çok fazla sesten gir çık yaptığı için ${bold(
                    '30 dakika',
                )} boyunca zaman aşımı yedi!`,
            });
        }
    } else if (diff > 10000) {
        comeOut.count = 1;
        comeOut.lastEnter = now;
    }
}

export default comeOutHandler;
