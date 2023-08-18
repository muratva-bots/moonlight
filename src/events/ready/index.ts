import { GuildModel, GuildClass } from '@/models';
import { Events } from 'discord.js';
import crons from '@/crons';

import checkRoles from './checkRoles';
import { checkPenals } from './checkPenals';

const Ready: Moonlight.IEvent<Events.ClientReady> = {
    name: Events.ClientReady,
    execute: async (client) => {
        const guild = client.guilds.cache.get(client.config.GUILD_ID);
        if (!guild) {
            console.log('Guild is undefined.');
            return;
        }

        await guild.members.fetch();
        await guild.fetchOwner();
        await guild.bans.fetch();

        console.log(`${client.user.tag} is online!`);

        await client.application.fetch();
        const document = (await GuildModel.findOne({ id: guild.id })) || (await GuildModel.create({ id: guild.id }));
        client.servers.set(guild.id, {
            moderation: { ...document.moderation },
            point: { ...document.point },
        });

        for (const cron of crons) cron({ client, guild });

        checkRoles(client, guild);
        setInterval(() => checkRoles(client, guild), 1000 * 60);

        checkPenals(client, guild);
        setInterval(() => checkPenals(client, guild), 1000 * 10);

        setInterval(() => {
            const now = Date.now();
            client.warns.filter((v) => now - v.lastWarn > 8000).forEach((_, k) => client.warns.delete(k));
        }, 60000);

        const guildEventEmitter = GuildModel.watch([{ $match: { 'fullDocument.id': guild.id } }], {
            fullDocument: 'updateLookup',
        });
        guildEventEmitter.on('change', ({ fullDocument }: { fullDocument: GuildClass }) =>
            client.servers.set(guild.id, {
                moderation: { ...fullDocument.moderation },
                point: { ...fullDocument.point },
            }),
        );

        // eğer check penalsta kullanıcının cezası biterse ve yasaklı tagı varsa yasaklı taga at
    },
};

export default Ready;
