import { ModerationClass } from '@/models';
import { Client } from '@/structures';
import { TextChannel, EmbedBuilder, GuildMember, inlineCode } from 'discord.js';

async function chatMuteHandler(client: Client, member: GuildMember, guildData: ModerationClass) {
    if (member.roles.cache.has(guildData.chatMuteRole)) await member.roles.remove(guildData.chatMuteRole);

    const channel = member.guild.channels.cache.find((c) => c.name === 'mute-log') as TextChannel;
    if (!channel) return;

    channel.send({
        embeds: [
            new EmbedBuilder({
                color: client.utils.getRandomColor(),
                description: `${member} (${inlineCode(
                    member.id,
                )}) adlı kullanıcının ceza süresi dolduğu için kaldırıldı.`,
            }),
        ],
    });
}

export default chatMuteHandler;
