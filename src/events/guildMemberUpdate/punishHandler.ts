import { PenalFlags, SpecialCommandFlags } from '@/enums';
import { ModerationClass, PenalModel } from '@/models';
import { Client } from '@/structures';
import { AuditLogEvent, EmbedBuilder, Guild, GuildMember, TextChannel, inlineCode } from 'discord.js';

async function punishHandler(
    client: Client,
    oldMember: GuildMember,
    newMember: GuildMember,
    guildData: ModerationClass,
) {
    const specialCommands = (guildData.specialCommands || []).filter((c) => c.type === SpecialCommandFlags.Punishment);
    if (
        oldMember.roles.cache.map((r) => r.id) === newMember.roles.cache.map((r) => r.id) ||
        ![
            guildData.adsRole,
            guildData.chatMuteRole,
            guildData.voiceMuteRole,
            guildData.quarantineRole,
            guildData.underworldRole,
            ...specialCommands.map((c) => c.punishRole),
        ].some((r) => oldMember.roles.cache.has(r) && !newMember.roles.cache.has(r))
    )
        return;

    const penals = await PenalModel.find({ user: newMember.id, activity: true, guild: newMember.guild.id }).select(
        'type',
    );
    if (!penals.length) return;

    const channel = newMember.guild.channels.cache.find((c) => c.name === 'unfinished-penals') as TextChannel;
    const embed = new EmbedBuilder({
        color: client.utils.getRandomColor(),
    });

    if (penals.some((p) => p.type === PenalFlags.Ads) && newMember.guild.roles.cache.has(guildData.adsRole)) {
        client.utils.setRoles(newMember, guildData.adsRole);

        if (channel) {
            const entry = await getEntry(newMember.guild, newMember.id);
            if (!entry) return;

            channel.send({
                embeds: [
                    embed.setDescription(
                        `${newMember} (${inlineCode(newMember.id)}) adlı kullanıcının reklam cezası ${
                            entry.executor
                        } (${inlineCode(entry.executorId)}) tarafından kaldırılmaya çalışıldı.`,
                    ),
                ],
            });
        }
        return;
    }

    if (penals.some((p) => p.type === PenalFlags.Ban) && newMember.guild.roles.cache.has(guildData.underworldRole)) {
        client.utils.setRoles(newMember, guildData.underworldRole);

        if (channel) {
            const entry = await getEntry(newMember.guild, newMember.id);
            if (!entry) return;

            channel.send({
                embeds: [
                    embed.setDescription(
                        `${newMember} (${inlineCode(newMember.id)}) adlı kullanıcının yasaklama cezası ${
                            entry.executor
                        } (${inlineCode(entry.executorId)}) tarafından kaldırılmaya çalışıldı.`,
                    ),
                ],
            });
        }
        return;
    }

    if (
        penals.some((p) => p.type === PenalFlags.Quarantine) &&
        newMember.guild.roles.cache.has(guildData.quarantineRole)
    ) {
        client.utils.setRoles(newMember, guildData.quarantineRole);

        if (channel) {
            const entry = await getEntry(newMember.guild, newMember.id);
            if (!entry) return;

            channel.send({
                embeds: [
                    embed.setDescription(
                        `${newMember} (${inlineCode(newMember.id)}) adlı kullanıcının cezalısı ${
                            entry.executor
                        } (${inlineCode(entry.executorId)}) tarafından kaldırılmaya çalışıldı.`,
                    ),
                ],
            });
        }
        return;
    }

    const roles: string[] = [];
    let type: string;
    if (penals.some((p) => p.type === PenalFlags.ChatMute) && newMember.guild.roles.cache.has(guildData.chatMuteRole)) {
        roles.push(guildData.chatMuteRole);
        type = 'yazı cezası';
    }
    if (
        penals.some((p) => p.type === PenalFlags.VoiceMute) &&
        newMember.guild.roles.cache.has(guildData.voiceMuteRole)
    ) {
        roles.push(guildData.voiceMuteRole);
        type = 'ses cezası';
    }

    const specialCommandRoles = specialCommands.filter(
        (c) => newMember.guild.roles.cache.has(c.punishRole) && penals.some((p) => c.punishType === p.type),
    );
    if (specialCommandRoles.length) {
        roles.push(...specialCommandRoles.map((c) => c.punishRole));
        type = specialCommandRoles[specialCommandRoles.length - 1].punishName;
    }

    if (roles.length) {
        newMember.roles.add(roles);

        if (channel) {
            const entry = await getEntry(newMember.guild, newMember.id);
            if (!entry) return;

            channel.send({
                embeds: [
                    embed.setDescription(
                        `${newMember} (${inlineCode(newMember.id)}) adlı kullanıcının cezalısı ${
                            entry.executor
                        } (${inlineCode(entry.executorId)}) tarafından kaldırılmaya çalışıldı.`,
                    ),
                ],
            });
        }
    }
}

export default punishHandler;

async function getEntry(guild: Guild, memberId: string) {
    try {
        const lastEntry = await guild
            .fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberRoleUpdate })
            .then((audit) => audit.entries.first());
        return lastEntry &&
            lastEntry.executor &&
            5000 > Date.now() - lastEntry.createdTimestamp &&
            lastEntry.targetId === memberId
            ? lastEntry
            : null;
    } catch (error) {
        console.error('getEntry Error:', error);
        return null;
    }
}
