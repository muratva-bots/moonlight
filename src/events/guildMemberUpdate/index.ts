import { Events, GuildMember } from 'discord.js';

import boostHandler from './boostHandler';
import punishHandler from './punishHandler';
import logHandler from './logHandler';

const GuildMemberUpdate: Moonlight.IEvent<Events.GuildMemberUpdate> = {
    name: Events.GuildMemberUpdate,
    execute: (client, oldMember, newMember) => {
        try {
            if (newMember.user.bot || !newMember.joinedAt) return;

            const guildData = client.servers.get(newMember.guild.id);
            if (!guildData) return;

            boostHandler(client, oldMember as GuildMember, newMember, guildData);
            punishHandler(client, oldMember as GuildMember, newMember, guildData);
            logHandler(oldMember as GuildMember, newMember);
        } catch (err) {
            console.log('Guild Member Update Error:', err);
        }
    },
};

export default GuildMemberUpdate;
