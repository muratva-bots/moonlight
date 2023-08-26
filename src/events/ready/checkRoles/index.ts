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
        !guildData.invasionProtection &&
        guildData.unregisterRoles &&
        guildData.unregisterRoles.some((r) => guild.roles.cache.has(r))
    ) {
        guild.members.cache
            .filter((m) => m.roles.cache.size === 1)
            .forEach((m) => m.roles.add(guildData.unregisterRoles));
    }

    anotherTagHandler(client, guild, guildData);
    checkNames(client, guild, guildData);
    bannedTagHandler(client, guild, guildData);
    tagHandler(client, guild, guildData);
}

export default checkRoles;
