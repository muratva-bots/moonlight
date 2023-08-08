import { NameFlags } from '@/enums';
import { UserModel } from '@/models';
import { AuditLogEvent, Events, Guild } from 'discord.js';

const GuildMemberRemove: Moonlight.IEvent<Events.GuildMemberRemove> = {
    name: Events.GuildMemberRemove,
    execute: async (client, member) => {
        try {
            const guildData = client.servers.get(member.guild.id);
            if (!guildData) return;

            if (
                member.user.bot ||
                ![
                    ...(guildData.moderation.womanRoles || []),
                    ...(guildData.moderation.manRoles || []),
                    guildData.moderation.registeredRole,
                ].map((r) => member.roles.cache.has(r)) ||
                member.displayName !== member.user.displayName
            )
                return;

            const entry = await getEntry(member.guild);
            await UserModel.updateOne(
                { id: member.id, guild: member.guild.id },
                {
                    $push: {
                        names: {
                            admin: entry ? entry.executor.id : member.id,
                            type: entry ? NameFlags.Kick : NameFlags.Leave,
                            time: Date.now(),
                            name: member.displayName,
                        },
                    },
                    $set: {
                        lastRoles: member.roles.cache
                            .filter((c) => !c.managed && c.id !== member.guild.id)
                            .map((c) => c.id),
                    },
                },
            );
        } catch (err) {
            console.log('Guild Member Remove:', err);
        }
    },
};

export default GuildMemberRemove;

async function getEntry(guild: Guild) {
    try {
        const now = Date.now();
        const banEntry = await guild
            .fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd })
            .then((audit) => audit.entries.first());
        if (banEntry && banEntry.executor && 5000 > now - banEntry.createdTimestamp) {
            return banEntry;
        }

        const kickEntry = await guild
            .fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick })
            .then((audit) => audit.entries.first());
        if (kickEntry && kickEntry.executor && 5000 > now - kickEntry.createdTimestamp) {
            return kickEntry;
        }

        return null;
    } catch (error) {
        console.error('getEntry Error:', error);
        return null;
    }
}
