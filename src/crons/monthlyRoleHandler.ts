import { UserModel } from '@/models';
import { Client } from '@/structures';
import { Guild } from 'discord.js';
import { schedule } from 'node-cron';

function monthlyRoleHandler({ client, guild }: { client: Client; guild: Guild }) {
    schedule('0 0 0 * * *', async () => {
        const guildData = client.servers.get(guild.id);
        if (!guildData || !guildData.moderation.monthlyRoles || !guildData.moderation.monthlyRoles.length) return;

        const monthlyRoles = guildData.moderation.monthlyRoles.filter((m) => guild.roles.cache.has(m.role));
        const allRoles = monthlyRoles.map((m) => m.role);

        const userDocuments = await UserModel.find({ guild: guild.id, monthlyRole: true }).select('id');

        guild.members.cache
            .filter((m) => allRoles.some((r) => m.roles.cache.has(r)) && !userDocuments.some((d) => d.id === m.id))
            .forEach((m) => m.roles.remove(allRoles));

        if (!userDocuments.length) return;

        const now = Date.now();
        guild.members.cache
            .filter(
                (m) =>
                    userDocuments.some((d) => d.id === m.id) &&
                    ![
                        ...(guildData.moderation.manRoles || []),
                        ...(guildData.moderation.womanRoles || []),
                        guildData.moderation.registeredRole,
                    ].some((role) => m.roles.cache.some((r) => r.name === role)),
            )
            .forEach(async (m) => {
                let hasRole = false;
                for (const monthlyRole of monthlyRoles) {
                    if (now - m.joinedTimestamp >= monthlyRole.time) {
                        const role = guild.roles.cache.get(monthlyRole.role);
                        if (!role) return;

                        hasRole = true;
                        await m.roles.remove(allRoles.filter((r) => r !== role.id));
                        await m.roles.add(role.id);
                        break;
                    }
                }
                if (!hasRole && allRoles.some((r) => m.roles.cache.has(r))) await m.roles.remove(allRoles);
            });
    });
}

export default monthlyRoleHandler;
