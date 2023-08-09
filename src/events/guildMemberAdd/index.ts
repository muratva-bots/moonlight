import { Events, TextChannel } from 'discord.js';

import welcomeHandler from './welcomeHandler';
import checkSuspect from './checkSuspect';
import checkFakeAccount from './checkFakeAccounts';
import checkPenals from './checkPenals';
import checkBannedTag from './checkBannedTag';

const GuildMemberAdd: Moonlight.IEvent<Events.GuildMemberAdd> = {
    name: Events.GuildMemberAdd,
    execute: async (client, member) => {
        try {
            if (member.user.bot) return;

            const guildData = client.servers.get(member.guild.id);
            if (!guildData) return;

            const registerChannel = member.guild.channels.cache.get(
                guildData.moderation.registerChannel,
            ) as TextChannel;

            const hasPenal = await checkPenals(client, member, guildData.moderation);
            if (hasPenal) return;

            const hasBannedTag = await checkBannedTag(client, member, guildData.moderation);
            if (hasBannedTag) return;

            const hasFakeAccounts = await checkFakeAccount(member, guildData.moderation, registerChannel);
            if (hasFakeAccounts) return;

            if (!guildData.moderation.invasionProtection) return;

            const isSuspect = await checkSuspect(client, member, guildData.moderation, registerChannel);
            if (isSuspect) return;

            welcomeHandler(client, member, guildData.moderation, registerChannel);
        } catch (err) {
            console.log('Guild Member Add:', err);
        }
    },
};
export default GuildMemberAdd;
