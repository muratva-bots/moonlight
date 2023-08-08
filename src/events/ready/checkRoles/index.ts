import { Client } from '@/structures';
import { Guild } from 'discord.js';

import anotherTagHandler from './anotherTagHandler';
import checkNames from './checkNames';
import bannedTagHandler from './bannedTagHandler';
import tagHandler from './tagHandler';

async function checkRoles(client: Client, guild: Guild) {
    const guildData = client.servers.get(guild.id);
    if (!guildData) return;

    if (
        !guildData.moderation.invasionProtection &&
        guildData.moderation.unregisterRoles &&
        guildData.moderation.unregisterRoles.some((r) => guild.roles.cache.has(r))
    ) {
        guild.members.cache
            .filter((m) => m.roles.cache.size === 1)
            .forEach((m) => m.roles.add(guildData.moderation.unregisterRoles));
    }

    anotherTagHandler(client, guild, guildData.moderation);
    checkNames(client, guild, guildData.moderation);
    bannedTagHandler(client, guild, guildData.moderation);
    tagHandler(client, guild, guildData.moderation);
}

export default checkRoles;
