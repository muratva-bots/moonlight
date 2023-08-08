import { ModerationClass } from '@/models';
import { Client } from '@/structures';
import { TextChannel, EmbedBuilder, GuildMember, inlineCode } from 'discord.js';
import { checkBannedTag } from '.';

async function banHandler(client: Client, member: GuildMember, guildData: ModerationClass) {
    if (member.roles.cache.has(guildData.underworldRole)) await member.roles.remove(guildData.underworldRole);

    const hasBannedTag = checkBannedTag(client, member, guildData);
    const channel = member.guild.channels.cache.find((c) => c.name === 'ban-log') as TextChannel;
    if (!channel) return;

    channel.send({
        embeds: [
            new EmbedBuilder({
                color: client.utils.getRandomColor(),
                description: `${member} (${inlineCode(
                    member.id,
                )}) adlı kullanıcının ceza süresi dolduğu için kaldırıldı. ${
                    hasBannedTag ? 'Fakat yasaklı tag bulundurduğu için yasaklı tag rolü verildi.' : ''
                }`,
            }),
        ],
    });
}

export default banHandler;
