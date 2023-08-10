import { GuildModel, GuildClass } from '@/models';
import { Events } from 'discord.js';
import crons from '@/crons';

import checkRoles from './checkRoles';
import { checkPenals } from './checkPenals';

const Ready: Moonlight.IEvent<Events.ClientReady> = {
    name: Events.ClientReady,
    execute: async (client) => {
        const guild = client.guilds.cache.get('1130942265020383373');
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
        client.servers.set(guild.id, { ...document.moderation });

        for (const cron of crons) cron({ client, guild });

        checkRoles(client, guild);
        setInterval(() => checkRoles(client, guild), 1000 * 60);

        checkPenals(client, guild);
        setInterval(() => checkPenals(client, guild), 1000 * 10);

        setInterval(() => {
            const now = Date.now();
            client.warns.sweep((v) => now - v.lastWarn > 8000);
        }, 60000);

        const guildEventEmitter = GuildModel.watch([{ $match: { 'fullDocument.id': guild.id } }], {
            fullDocument: 'updateLookup',
        });
        guildEventEmitter.on('change', ({ fullDocument }: { fullDocument: GuildClass }) =>
            client.servers.set(guild.id, { ...fullDocument.moderation }),
        );
    },
};

export default Ready;
