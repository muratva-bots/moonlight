import { ModerationClass, UserModel } from '@/models';
import { Client } from '@/structures';
import { EmbedBuilder, GuildMember, TextChannel, User, codeBlock, inlineCode } from 'discord.js';
import { sendStaffText } from './anotherTagHandler';
import { RoleLogFlags } from '@/enums';

async function bannedTagHandler(
    client: Client,
    oldUser: User,
    newUser: User,
    member: GuildMember,
    guildData: ModerationClass,
) {
    if (!guildData.bannedTags || !guildData.bannedTags.length || !member.guild.roles.cache.has(guildData.bannedTagRole))
        return false;

    const channel = member.guild.channels.cache.find((c) => c.name === 'banned-tag-log') as TextChannel;
    const now = Date.now();
    const embed = new EmbedBuilder({
        color: client.utils.getRandomColor(),
        timestamp: now,
    });
    const tag = guildData.bannedTags.find((t) => newUser.displayName.toLowerCase().includes(t.toLowerCase()));
    const bannedTagMemberCount = member.guild.members.cache.filter((m) =>
        guildData.bannedTags.some((t) => m.user.displayName.toLowerCase().includes(t.toLowerCase())),
    );
    const bannedTagsMemberCount = member.guild.members.cache.filter((m) => m.roles.cache.has(guildData.bannedTagRole));
    const oldHasTag = guildData.bannedTags.some((t) => oldUser.displayName.toLowerCase().includes(t.toLowerCase()));
    const newHasTag = guildData.bannedTags.some((t) => newUser.displayName.toLowerCase().includes(t.toLowerCase()));

    if (!oldHasTag && newHasTag) {
        const minStaffRole = member.guild.roles.cache.get(guildData.minStaffRole);

        await UserModel.updateOne(
            { id: member.id, guild: member.guild.id },
            {
                $push: {
                    roleLogs: {
                        type: RoleLogFlags.BannedTagAdd,
                        roles: member.roles.cache
                            .filter((r) => !r.managed && r.id !== member.guild.id)
                            .map((r) => r.id),
                        time: now,
                        admin: client.user.id,
                    },
                },
            },
        );

        if (minStaffRole && member.roles.highest.position >= minStaffRole.position) {
            const staffRoles = member.roles.cache.filter((r) => r.position >= minStaffRole.position);
            sendStaffText(client, member, `yasaklı tagı (${inlineCode(tag)}) ismine aldı`, staffRoles);
        }

        if (member.guild.roles.cache.has(guildData.bannedTagRole))
            client.utils.setRoles(member, guildData.bannedTagRole);
        if (member.manageable) member.setNickname(null);

        if (channel) {
            channel.send({
                embeds: [
                    embed.setDescription(
                        [
                            `${member} (${inlineCode(
                                member.id,
                            )}) kişisi sunucumuzda yasaklı olarak bulunan (${inlineCode(
                                tag,
                            )}) tagı ismine aldığı için yasaklı tag cezası aldı`,
                            codeBlock(
                                'fix',
                                [
                                    `${tag} yasaklı tagına sahip üye sayısı ${bannedTagMemberCount.size} oldu.`,
                                    `Sunucumuzda yasaklı taglardaki toplam kişi sayısı ${bannedTagsMemberCount.size} oldu.`,
                                ].join(),
                            ),
                        ].join('\n'),
                    ),
                ],
            });
        }

        return true;
    }

    if (oldHasTag && !newHasTag) {
        const hasUnregisterRoles =
            guildData.unregisterRoles && guildData.unregisterRoles.some((r) => member.guild.roles.cache.has(r));
        if (hasUnregisterRoles) client.utils.setRoles(member, hasUnregisterRoles ? guildData.unregisterRoles : []);
        if (guildData.changeName) member.setNickname('İsim | Yaş');

        if (channel) {
            channel.send({
                embeds: [
                    embed.setDescription(
                        [
                            `${member} (${inlineCode(
                                member.id,
                            )})  kişisi sunucumuzda yasaklı olarak bulunan (${inlineCode(
                                tag,
                            )}) tagı isminden kaldırdığı için yasaklı tagdan çıkarıldı`,
                            codeBlock(
                                'fix',
                                [
                                    `${tag} yasaklı tagına sahip üye sayısı ${bannedTagMemberCount.size} oldu.`,
                                    `Sunucumuzda yasaklı taglardaki toplam kişi sayısı ${bannedTagsMemberCount.size} oldu.`,
                                ].join(),
                            ),
                        ].join('\n'),
                    ),
                ],
            });
        }

        return false;
    }

    return false;
}

export default bannedTagHandler;
