import { ranks } from '@/assets';
import { StaffModel } from '@/models';
import { Client } from '@/structures';
import { Guild, TextChannel, bold, inlineCode } from 'discord.js';
import { schedule } from 'node-cron';

const ONE_DAY = 1000 * 60 * 60 * 24;

function staffControl({ client, guild }: { client: Client; guild: Guild }) {
    schedule('0 0 0 * * 7', async () => {
        const minStaffRole = guild.roles.cache.find((r) => r.name === 'Support (Register)');
        if (!minStaffRole) return;

        const logChannel = guild.channels.cache.find((c) => c.name === 'auto-downgrade-staff') as TextChannel;
        if (!logChannel) return;

        const members = guild.members.cache
            .filter((m) => m.roles.highest.position >= minStaffRole.position)
            .map((m) => m.id);
        const now = Date.now();

        const documents = await StaffModel.find({
            id: { $in: members },
            $or: [
                { roleTime: { $gte: now + ONE_DAY * 3 } }, // role başlam
                { staffTime: { $gte: now + ONE_DAY * 7 } }, // yetkiye
            ],
        });
        if (!documents.length) return;

        for (const document of documents) {
            if (document.lastWeekPoints !== 0 && 3000 > document.allPoints - document.lastWeekPoints) {
                const member = await client.utils.getMember(guild, document.id);
                if (!member) continue;

                const currentIndex = ranks.findIndex((t) =>
                    member.roles.cache.map((r) => r.name).some((r) => t.ROLE === r),
                );
                if (!currentIndex) continue;

                if (ranks[currentIndex].ROLE === 'Thoosa of the Poseidon') {
                    member.roles.remove(
                        member.roles.cache.filter((r) => r.position >= minStaffRole.position).map((r) => r.id),
                    );
                    logChannel.send(
                        `${member} (${inlineCode(member.id)}) adlı kullanıcı ${bold(
                            'Thoosa of the Poseidon',
                        )} rolündeydi daha düşürelecek yetkisi olmadığından yetkiden atıldı.`,
                    );
                    await StaffModel.deleteOne({ id: document.id });
                    continue;
                }

                const currentRole = guild.roles.cache.find((r) => r.name === ranks[currentIndex].ROLE);
                if (currentRole) await member.roles.remove(currentRole);

                const newRole = guild.roles.cache.find((r) => r.name === ranks[currentIndex - 1].ROLE);
                if (newRole) await member.roles.add(newRole);

                if (ranks[currentIndex].EXTRA_ROLE !== ranks[currentIndex - 1].EXTRA_ROLE) {
                    await member.roles.add(ranks[currentIndex - 1].EXTRA_ROLE);
                    await member.roles.remove(ranks[currentIndex].EXTRA_ROLE);
                }

                logChannel.send(
                    `${member} (${inlineCode(member.id)}) adlı kullanıcı ${bold(currentRole.name)} (${inlineCode(
                        currentRole.id,
                    )}) rolünden ${bold(newRole.name)} (${inlineCode(newRole.id)}) rolüne düşürüldü.`,
                );

                document.roleTime = now;
                document.bonus = 0;
                document.invite = 0;
                document.message = 0;
                document.public = 0;
                document.register = 0;
                document.responsibility = 0;
                document.sleep = 0;
                document.total = 0;
                document.meeting = 0;
                document.staffTakes = [];
                document.problemResolve = 0;
            }

            document.lastWeekPoints = document.allPoints;
            document.save();
        }
    });
}

export default staffControl;
