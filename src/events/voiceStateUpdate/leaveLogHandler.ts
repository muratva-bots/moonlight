import { VoiceLogFlags } from '@/enums';
import { UserModel } from '@/models';
import { AuditLogEvent, Colors, EmbedBuilder, TextChannel, VoiceState, codeBlock } from 'discord.js';

async function leaveLogHandler(state: VoiceState) {
    const channel = state.guild.channels.cache.find((c) => c.isTextBased() && c.name === 'voice-log') as TextChannel;
    if (!channel) return;

    const entry = await state.guild
        .fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberDisconnect })
        .then((audit) => audit.entries.first());
    const now = Date.now();

    await UserModel.updateOne(
        { id: state.id, guild: state.guild.id },
        {
            $push: {
                voiceLogs: {
                    type: entry && 5000 > now - entry.createdTimestamp ? VoiceLogFlags.Kick : VoiceLogFlags.Leave,
                    channel: state.channelId,
                    time: now,
                    admin: entry && 5000 > now - entry.createdTimestamp ? entry.executorId : undefined,
                },
            },
        },
        { upsert: true },
    );

    channel.send({
        embeds: [
            new EmbedBuilder({
                title: 'Ses Kanalından Çıkış Yaptı!',
                color: Colors.Red,
                description: [
                    codeBlock(
                        'yaml',
                        [
                            '# Kullanıcı Bilgileri',
                            `Kullanıcı Adı: ${state.member.user.displayName} (${state.id})`,
                            `Mikrofon Durumu: ${state.mute ? 'Açık!' : 'Kapalı!'}`,
                            `Kulaklık Durumu: ${state.deaf ? 'Açık!' : 'Kapalı!'}`,
                        ].join(''),
                    ),
                    entry && entry.targetId === state.id && entry.executorId !== state.id ?
                        codeBlock("yaml", `Sesten Atan Yetkili: ${entry.executor.displayName} (${entry.executorId})`)
                        : undefined,
                ].filter(Boolean).join('\n'),
            }),
        ],
    });
}

export default leaveLogHandler;
