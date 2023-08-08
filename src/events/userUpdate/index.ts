import { Events, User } from 'discord.js';

import { anotherTagHandler } from './anotherTagHandler';
import bannedTagHandler from './bannedTagHandler';
import tagHandler from './tagHandler';

const UserUpdate: Moonlight.IEvent<Events.UserUpdate> = {
    name: Events.UserUpdate,
    execute: async (client, oldUser, newUser) => {
        try {
            if (oldUser.bot || oldUser.displayName === newUser.displayName) return;

            const guild = client.guilds.cache.get(client.config.GUILD_ID);
            if (!guild) return;

            const guildData = client.servers.get(guild.id);
            if (!guildData) return;

            const member = await client.utils.getMember(guild, newUser.id);
            if (
                !member ||
                [
                    guildData.moderation.underworldRole,
                    guildData.moderation.adsRole,
                    guildData.moderation.quarantineRole,
                ].some((role) => member.roles.cache.has(role))
            )
                return;

            const hasBannedTag = await bannedTagHandler(client, oldUser as User, newUser, member, guildData.moderation);
            if (hasBannedTag) return;

            anotherTagHandler(client, newUser, member, guildData.moderation);
            tagHandler(client, oldUser as User, newUser, member, guildData.moderation);
        } catch (err) {
            console.log('User Update:', err);
        }
    },
};

export default UserUpdate;
