import { VoiceLogFlags } from '@/enums';
import { UserModel } from '@/models';
import { AuditLogEvent, Colors, EmbedBuilder, TextChannel, VoiceState, codeBlock } from 'discord.js';

async function joinLogHandler(state: VoiceState) {
    const channel = state.guild.channels.cache.find((c) => c.isTextBased() && c.name === 'voice-log') as TextChannel;
    if (!channel) return;

    const entry = await state.guild
        .fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberMove })
        .then((audit) => audit.entries.first());
    const now = Date.now();

    await UserModel.updateOne(
        { id: state.id, guild: state.guild.id },
        {
            $push: {
                voiceLogs: {
                    type: entry && 5000 > now - entry.createdTimestamp ? VoiceLogFlags.Transport : VoiceLogFlags.Join,
                    channel: state.channelId,
                    time: now,
                    admin: entry && 5000 > now - entry.createdTimestamp ? entry.executorId : undefined,
                },
            },
        },
        { upsert: true },
    );

    const voiceMembers = state.channel.members
        .filter((m) => m.id !== state.id)
        .map((m) => `${m.user.displayName} (${m.id})`);
    channel.send({
        embeds: [
            new EmbedBuilder({
                title: 'Ses Kanalına Giriş Yaptı!',
                color: Colors.Green,
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
                    codeBlock(
                        'yaml',
                        [
                            entry && entry.targetId === state.id && entry.executorId !== state.id
                                ? `Taşıyan Yetkili: ${entry.executor.displayName} (${entry.executorId})`
                                : undefined,
                            `Kanal Adı: ${state.channel.name} (${state.channelId})`,
                            '# Odada Bulunan Kullanıcılar',
                            voiceMembers.length > 0
                                ? voiceMembers.length > 20
                                    ? `${voiceMembers.join('\n')}\nve ${voiceMembers.length - 20} kişi daha.`
                                    : voiceMembers.join('\n')
                                : 'Odada tek başına.',
                        ]
                            .filter(Boolean)
                            .join(''),
                    ),
                ].join('\n'),
            }),
        ],
    });
}

export default joinLogHandler;
