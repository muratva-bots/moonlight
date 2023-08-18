import { ANOTHER_TAGS } from '@/assets';
import { RoleLogFlags } from '@/enums';
import { ModerationClass, UserModel } from '@/models';
import { Client } from '@/structures';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Collection,
    EmbedBuilder,
    GuildMember,
    Role,
    TextChannel,
    User,
    bold,
    codeBlock,
    inlineCode,
} from 'discord.js';

export async function anotherTagHandler(client: Client, user: User, member: GuildMember, guildData: ModerationClass) {
    const minStaffRole = member.guild.roles.cache.get(guildData.minStaffRole);
    if (!minStaffRole || minStaffRole.position > member.roles.highest.position) return;

    const filteredTags = ANOTHER_TAGS.filter((t) => !(guildData.tags || []).includes(t));
    const tag = filteredTags.find((t) => user.displayName.toLowerCase().includes(t.toLowerCase()));
    if (!tag) return;

    const roles = member.roles.cache.filter((r) => minStaffRole.position > r.position && !r.managed);

    await UserModel.updateOne(
        { id: member.id, guild: member.guild.id },
        {
            $push: {
                roleLogs: {
                    type: RoleLogFlags.AnotherTagAdd,
                    roles: roles.map((r) => r.id),
                    time: Date.now(),
                    admin: client.user.id,
                },
            },
        },
        { upsert: true },
    );

    sendStaffText(client, member, `başka sunucunun tagını (${inlineCode(tag)}) ismine aldı`, member.roles.cache.filter((r) => minStaffRole.position < r.position && !r.managed));
    await member.roles.set(roles);

}

export async function sendStaffText(
    client: Client,
    member: GuildMember,
    content: string,
    roles: Collection<string, Role>,
) {
    const channel = member.guild.channels.cache.find((c) => c.name === 'staff-tag-log') as TextChannel;
    if (!channel) return;

    const row = new ActionRowBuilder<ButtonBuilder>({
        components: [
            new ButtonBuilder({
                custom_id: 'speak-user',
                label: 'Konuş',
                style: ButtonStyle.Success,
                emoji: {
                    id: '1137857901998911508',
                },
            }),
        ],
    });

    channel.send({
        embeds: [
            new EmbedBuilder({
                color: client.utils.getRandomColor(),
                timestamp: Date.now(),
                description: [
                    `${member} (${inlineCode(member.id)}) adlı kullanıcı ${bold(content)} ve yetkileri çekildi!`,
                    codeBlock('yaml', `# Çekilen Rolleri\n${roles.map((r) => `→ ${r.name}`).join('\n')}`),
                ].join('\n'),
            }),
        ],
        components: [row],
    });
}
