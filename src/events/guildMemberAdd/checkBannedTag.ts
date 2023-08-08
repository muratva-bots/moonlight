import { ModerationClass } from '@/models';
import { Client } from '@/structures';
import { EmbedBuilder, GuildMember, TextChannel, codeBlock, inlineCode } from 'discord.js';

function checkBannedTag(client: Client, member: GuildMember, guildData: ModerationClass) {
    if (!guildData.bannedTags || !guildData.bannedTags.length || !member.guild.roles.cache.has(guildData.bannedTagRole))
        return false;

    const tag = guildData.bannedTags.find((t) => member.user.displayName.toLowerCase().includes(t.toLowerCase()));
    if (!tag) return false;

    if (member.guild.roles.cache.has(guildData.bannedTagRole)) client.utils.setRoles(member, guildData.bannedTagRole);

    const channel = member.guild.channels.cache.find((c) => c.name === 'banned-tag-log') as TextChannel;
    if (!channel) return;

    const bannedTagsMemberCount = member.guild.members.cache.filter((m) => m.roles.cache.has(guildData.bannedTagRole));
    const bannedTagMemberCount = member.guild.members.cache.filter((m) =>
        m.displayName.toLowerCase().includes(tag.toLowerCase()),
    );

    channel.send({
        embeds: [
            new EmbedBuilder({
                color: client.utils.getRandomColor(),
                description: [
                    `${member} (${inlineCode(member.id)}) kişisi sunucumuzda yasaklı olarak bulunan (${inlineCode(
                        tag,
                    )}) tagına sahip olduğu için yasaklı tag rolü verildi.`,
                    codeBlock(
                        'fix',
                        [
                            `${tag} yasaklı tagına sahip üye sayısı ${bannedTagMemberCount.size} oldu.`,
                            `Sunucumuzda yasaklı taglardaki toplam kişi sayısı ${bannedTagsMemberCount.size} oldu.`,
                        ].join(),
                    ),
                ].join('\n'),
                timestamp: Date.now(),
            }),
        ],
    });
}

export default checkBannedTag;
