import { Client } from '@/structures';
import { Collection, EmbedBuilder, Guild, TextChannel, bold, inlineCode } from 'discord.js';
import { schedule } from 'node-cron';

const staffs = new Collection<string, number>();

function warningHandler({ client, guild }: { client: Client; guild: Guild }) {
    schedule('0 0,16-23/2 * * *', () => {
        const guildData = client.servers.get(guild.id);
        if (!guildData) return;

        const minStaffRole = guild.roles.cache.get(guildData.minStaffRole);
        if (!minStaffRole) return;

        const staffChat = guild.channels.cache.get(guildData.staffChat) as TextChannel;
        if (!staffChat) return;

        const members = guild.members.cache.filter(
            (m) =>
                m.roles.highest.position >= minStaffRole.position &&
                m.presence &&
                !m.user.bot &&
                m.presence.status !== 'offline' &&
                !m.voice.channelId,
        );

        const mostWarneds = [];
        for (const [id, member] of members) {
            const staff = staffs.get(id);
            if (!staff) staffs.set(id, 1);
            else staffs.set(id, staff + 1);

            if (staff && staff > 1)
                mostWarneds.push(`${member} (${inlineCode(member.id)} - ${bold(`${staff} uyarı`)})`);
        }

        staffs.sweep((_, k) => !members.has(k));

        const splitStaffs = client.utils.splitMessage(members.map((m) => m.toString()).join(','));
        for (const splitStaff of splitStaffs) staffChat.send({ content: splitStaff });
        if (mostWarneds.length) {
            const splitMostWarneds = client.utils.splitMessage(mostWarneds.join(','));
            for (const splitMostWarned of splitMostWarneds) {
                staffChat.send({
                    embeds: [
                        new EmbedBuilder({
                            color: client.utils.getRandomColor(),
                            title: 'Birden fazla uyarı alan kullanıcılar:',
                            description: splitMostWarned,
                        }),
                    ],
                });
            }
        }

        const now = new Date();
        const hour = now.getHours();
        if (hour === 0) staffs.clear();
    });
}

export default warningHandler;
