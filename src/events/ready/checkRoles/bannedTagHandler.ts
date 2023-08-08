import { NameFlags, RoleLogFlags } from "@/enums";
import { ModerationClass, UserModel } from "@/models";
import { Client } from "@/structures";
import { EmbedBuilder, Guild, TextChannel, codeBlock, inlineCode } from "discord.js";
import { sendStaffText } from "src/events/userUpdate/anotherTagHandler";

function bannedTagHandler(client: Client, guild: Guild, guildData: ModerationClass) {
    if (!guildData.bannedTags || !guildData.bannedTags.length || !guild.roles.cache.has(guildData.bannedTagRole)) return;

    const now = Date.now();
    const channel = guild.channels.cache.find((c) => c.name === 'banned-tag-log') as TextChannel;
    const minStaffRole = guild.roles.cache.get(guildData.minStaffRole);
    const hasUnregisterRoles = guildData.unregisterRoles && guildData.unregisterRoles.some((r) => guild.roles.cache.has(r));

    guild.members.cache
        .filter(m =>
            ![
                guildData.underworldRole,
                guildData.adsRole,
                guildData.bannedTagRole,
                guildData.quarantineRole
            ].some((role) => m.roles.cache.has(role)) &&
            guildData.bannedTags.some(t =>
                m.user.displayName.toLowerCase().includes(t.toLowerCase())
            )
        )
        .forEach(async (m) => {
            await UserModel.updateOne(
                { id: m.id, guild: guild.id },
                {
                    $push: {
                        roleLogs: {
                            type: RoleLogFlags.BannedTagAdd,
                            roles: m.roles.cache.filter(r => !r.managed && r.id !== m.guild.id).map(r => r.id),
                            time: now,
                            admin: client.user.id
                        }
                    }
                }
            );

            const tag = guildData.bannedTags.find((t) => m.user.displayName.toLowerCase().includes(t.toLowerCase()));
            if (minStaffRole && m.roles.highest.position >= minStaffRole.position) {
                const staffRoles = m.roles.cache.filter((r) => r.position >= minStaffRole.position);
                sendStaffText(client, m, `yasaklı tagı (${inlineCode(tag)}) ismine aldı`, staffRoles);
            }

            if (m.guild.roles.cache.has(guildData.bannedTagRole)) client.utils.setRoles(m, guildData.bannedTagRole);
            if (m.manageable) m.setNickname(null);
            if (m.voice.channelId) m.voice.disconnect();

            const bannedTagMemberCount = guild.members.cache.filter((m) => m.displayName.toLowerCase().includes(tag.toLowerCase()));
            const bannedTagsMemberCount = guild.members.cache.filter((m) => m.roles.cache.has(guildData.bannedTagRole));

            if (channel) {
                channel.send({
                    embeds: [
                        new EmbedBuilder({
                            description: [
                                `${m} (${inlineCode(
                                    m.id,
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
                            color: client.utils.getRandomColor(),
                            timestamp: now
                        })
                    ],
                });
            }
        });

    guild.members.cache
        .filter(m =>
            m.roles.cache.has(guildData.bannedTagRole) &&
            !(guildData.bannedTags || []).some(t =>
                m.user.displayName.toLowerCase().includes(t.toLowerCase())
            )
        )
        .forEach(async (m) => {
            client.utils.setRoles(m, hasUnregisterRoles ? guildData.unregisterRoles : []);
            if (guildData.changeName) m.setNickname('İsim | Yaş');

            if (channel) {
                channel.send({
                    embeds: [
                        new EmbedBuilder({
                            color: client.utils.getRandomColor(),
                            timestamp: now,
                            description: `${m} (${inlineCode(m.id)})  kişisi sunucumuzda yasaklı olarak bulunan tagı isminden kaldırdığı için yasaklı tagdan çıkarıldı.`
                        })
                    ],
                });
            }
        });
}

export default bannedTagHandler;
