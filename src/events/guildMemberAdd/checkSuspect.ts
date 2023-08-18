import { ModerationClass } from '@/models';
import { Client } from '@/structures';
import { Colors, GuildMember, TextChannel, EmbedBuilder, inlineCode } from 'discord.js';

const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;

function checkSuspect(client: Client, member: GuildMember, guildData: ModerationClass, registerChannel?: TextChannel) {
    if (
        Date.now() - member.user.createdTimestamp > SEVEN_DAYS ||
        !member.guild.roles.cache.has(guildData.suspectedRole)
    )
        return false;

    client.utils.setRoles(member, guildData.suspectedRole);
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

export default checkSuspect;
