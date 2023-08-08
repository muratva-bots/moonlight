import { ModerationClass } from '@/models';
import { Client } from '@/structures';
import { Colors, GuildMember, TextChannel, EmbedBuilder, inlineCode } from 'discord.js';

const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;

async function checkSuspect(
    client: Client,
    member: GuildMember,
    guildData: ModerationClass,
    registerChannel?: TextChannel,
) {
    const suspiciousRole = member.guild.roles.cache.get(guildData.suspectedRole);
    if (!suspiciousRole) return false;

    const isSuspect = Date.now() - member.user.createdTimestamp < SEVEN_DAYS;
    if (isSuspect && suspiciousRole) {
        client.utils.setRoles(member, suspiciousRole.id);
        if (registerChannel) {
            registerChannel.send({
                embeds: [
                    new EmbedBuilder({
                        color: Colors.Red,
                        description: `${member} (${inlineCode(
                            member.id,
                        )}) adlı kullanıcının hesabı 7 günden az bir sürede açıldığı için şüpheliye atıldı.`,
                    }),
                ],
            });
        }
        return true;
    }

    return false;
}

export default checkSuspect;
