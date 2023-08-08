import { PenalFlags } from '@/enums';
import { PenalModel } from '@/models';
import { Events } from 'discord.js';

const GuildBanRemove: Moonlight.IEvent<Events.GuildBanRemove> = {
    name: Events.GuildBanRemove,
    execute: async (client, ban) => {
        try {
            const guildData = client.servers.get(ban.guild.id);
            if (!guildData) return;

            const hasForceBan = await PenalModel.exists({
                user: ban.user.id,
                activity: true,
                tpye: PenalFlags.ForceBan,
                guild: ban.guild.id,
            });
            if (hasForceBan) {
                ban.guild.members.ban(ban.user.id, { reason: 'Sağ tıkla kaldırıldığı için geri atıldı.' });
                return;
            }

            if (!ban.guild.roles.cache.has(guildData.moderation.underworldRole)) return;

            const hasBan = await PenalModel.exists({
                user: ban.user.id,
                activity: true,
                tpye: PenalFlags.Ban,
                guild: ban.guild.id,
            });
            if (hasBan) {
                ban.guild.members.ban(ban.user.id, { reason: 'Sağ tıkla kaldırıldığı için geri atıldı.' });
                return;
            }
        } catch (err) {
            console.log('Guild Ban Remove:', err);
        }
    },
};

export default GuildBanRemove;
