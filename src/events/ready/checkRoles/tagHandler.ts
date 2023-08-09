import { NameFlags, RoleLogFlags } from '@/enums';
import { ModerationClass, UserModel } from '@/models';
import { Client } from '@/structures';
import { EmbedBuilder, Guild, TextChannel, codeBlock, inlineCode } from 'discord.js';
import { sendStaffText } from 'src/events/userUpdate/anotherTagHandler';

function tagHandler(client: Client, guild: Guild, guildData: ModerationClass) {
    if (!guildData.tags?.length || !guild.roles.cache.has(guildData.familyRole)) return;

    const now = Date.now();
    const minStaffRole = guild.roles.cache.get(guildData.minStaffRole);
    const channel = guild.channels.cache.find((c) => c.name === 'tag-log') as TextChannel;
    const hasUnregisterRoles =
        guildData.unregisterRoles && guildData.unregisterRoles.some((r) => guild.roles.cache.has(r));
    const tagMemberCount = guild.members.cache.filter((m) =>
        guildData.tags.some((t) => m.user.displayName.toLowerCase().includes(t.toLowerCase())),
    );

    guild.members.cache
        .filter(
            (m) =>
                ![guildData.adsRole, guildData.bannedTagRole, guildData.underworldRole, guildData.quarantineRole].some(
                    (role) => m.roles.cache.has(role),
                ) &&
                guildData.tags.some((t) => m.user.displayName.toLowerCase().includes(t.toLowerCase())) &&
                !m.roles.cache.has(guildData.familyRole),
        )
        .forEach(async (m) => {
            if (
                [...(guildData.manRoles || []), ...(guildData.womanRoles || []), guildData.registeredRole].some((r) =>
                    m.roles.cache.has(r),
                )
            ) {
                if (m.manageable && guildData.secondTag)
                    m.setNickname(m.displayName.replace(guildData.secondTag, guildData.tags[0]));
                m.roles.add(guildData.familyRole);
            } else {
                const document = await UserModel.findOne({ id: m.id, guild: m.guild.id });
                const names = document
                    ? document.names.filter(
                          (n) =>
                              n.name &&
                              n.role &&
                              ![
                                  NameFlags.Unregister,
                                  NameFlags.BoostFinish,
                                  NameFlags.BoosterChangeName,
                                  NameFlags.ManuelBoostFinish,
                                  NameFlags.UnregisterBoost,
                              ].includes(n.type),
                      )
                    : [];
                if (!names.length) return;

                const lastData = names[names.length - 1];
                m.setNickname(lastData.name);

                const roles: string[] = [];
                if ((guildData.womanRoles || []).includes(lastData.role)) roles.push(...guildData.womanRoles);
                if ((guildData.manRoles || []).includes(lastData.role)) roles.push(...guildData.manRoles);
                if (m.guild.roles.cache.has(guildData.registeredRole)) roles.push(guildData.registeredRole);
                m.roles.add(roles);

                document.names.push({
                    admin: client.user.id,
                    time: Date.now(),
                    type: NameFlags.AutoRegister,
                    name: lastData.name,
                    role: lastData.role,
                });
                document.save();
            }
            if (channel) {
                channel.send({
                    embeds: [
                        new EmbedBuilder({
                            color: client.utils.getRandomColor(),
                            timestamp: now,
                            description: [
                                `${m} (${inlineCode(m.id)}) kullanıcısı tagımızı alarak aramıza katıldı!`,
                                codeBlock('fix', `Mevcut isminde tag bulunan üye sayımız: ${tagMemberCount.size}`),
                            ].join('\n'),
                        }),
                    ],
                });
            }
        });

    guild.members.cache
        .filter(
            (m) =>
                !guildData.tags.some((t) => m.user.displayName.toLowerCase().includes(t.toLowerCase())) &&
                (m.roles.cache.has(guildData.familyRole) || m.roles.highest.position >= minStaffRole.position),
        )
        .forEach(async (m) => {
            if (minStaffRole && m.roles.highest.position >= minStaffRole.position) {
                const staffRoles = m.roles.cache.filter((r) => r.position >= minStaffRole.position);
                sendStaffText(client, m, 'tagı isminden çıkardı', staffRoles);
            }

            if (guildData.taggedMode && !m.roles.cache.has(guildData.vipRole) && !m.premiumSince) {
                const lastRoles = m.roles.cache.filter((c) => !c.managed && c.id !== m.guild.id).map((c) => c.id);
                await UserModel.updateOne(
                    { id: m.id, guild: m.guild.id },
                    {
                        $push: {
                            roleLogs: {
                                type: RoleLogFlags.TagRemove,
                                roles: lastRoles,
                                time: now,
                                admin: client.user.id,
                            },
                        },
                        $set: {
                            lastRoles: lastRoles,
                        },
                    },
                );

                client.utils.setRoles(m, hasUnregisterRoles ? guildData.unregisterRoles : []);

                if (m.manageable) {
                    if (guildData.changeName) m.setNickname('İsim | Yaş');
                    else m.setNickname(null);
                }
            } else {
                m.roles.remove(guildData.familyRole);
                if (m.manageable && guildData.secondTag)
                    m.setNickname(m.displayName.replace(guildData.tags[0], guildData.secondTag));
            }

            if (channel) {
                channel.send({
                    embeds: [
                        new EmbedBuilder({
                            color: client.utils.getRandomColor(),
                            timestamp: now,
                            description: [
                                `${m} (${inlineCode(m.id)}) kullanıcısı tagımızı bırakarak aramızdan ayrıldı!`,
                                codeBlock('fix', `Mevcut isminde tag bulunan üye sayımız: ${tagMemberCount.size}`),
                            ].join('\n'),
                        }),
                    ],
                });
            }
        });
}

export default tagHandler;
