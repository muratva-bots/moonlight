import { NameFlags, RoleLogFlags } from '@/enums';
import { ModerationClass, UserModel } from '@/models';
import { Client } from '@/structures';
import { EmbedBuilder, GuildMember, TextChannel, User, codeBlock, inlineCode } from 'discord.js';
import { sendStaffText } from './anotherTagHandler';

async function tagHandler(
    client: Client,
    oldUser: User,
    newUser: User,
    member: GuildMember,
    guildData: ModerationClass,
) {
    if (!guildData.tags || !guildData.tags.length) return;

    const familyRole = member.guild.roles.cache.get(guildData.familyRole);
    const oldHasTag = guildData.tags.some((t) =>
        oldUser.displayName.toLocaleLowerCase().includes(t.toLocaleLowerCase()),
    );
    const newHasTag = guildData.tags.some((t) =>
        newUser.displayName.toLocaleLowerCase().includes(t.toLocaleLowerCase()),
    );
    const tagMemberCount = member.guild.members.cache.filter((m) =>
        guildData.tags.some((t) => m.user.displayName.toLowerCase().includes(t.toLowerCase())),
    );
    const channel = member.guild.channels.cache.find((c) => c.name === 'tag-log') as TextChannel;
    const now = Date.now();
    const embed = new EmbedBuilder({
        color: client.utils.getRandomColor(),
        timestamp: now,
    });

    if (
        !oldHasTag &&
        newHasTag &&
        ![guildData.bannedTagRole, guildData.suspectedRole].some(r => member.roles.cache.has(r))
    ) {
        if ([...(guildData.manRoles || []), ...(guildData.womanRoles || []), guildData.registeredRole].some(r => member.roles.cache.has(r))) {
            if (member.manageable && guildData.secondTag) member.setNickname(member.displayName.replace(guildData.secondTag, guildData.tags[0]));
            member.roles.add(familyRole);
        } else {
            const document = await UserModel.findOne({ id: member.id, guild: member.guild.id });
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
                            NameFlags.UnregisterBoost
                        ].includes(n.type),
                )
                : [];
            if (
                names.length &&
                ((guildData.taggedMode &&
                    guildData.tags &&
                    guildData.tags.some((t) => member.user.displayName.toLowerCase().includes(t.toLowerCase()))) ||
                    document.lastRoles.includes(guildData.vipRole))
            ) {
                const lastData = names[names.length - 1];
                member.setNickname(lastData.name);

                const roles: string[] = [];
                if ((guildData.womanRoles || []).includes(lastData.role)) roles.push(...guildData.womanRoles);
                if ((guildData.manRoles || []).includes(lastData.role)) roles.push(...guildData.manRoles);
                if (member.guild.roles.cache.has(guildData.registeredRole)) roles.push(guildData.registeredRole);
                member.roles.add(roles);
            


                document.names.push({
                    admin: client.user.id,
                    time: Date.now(),
                    type: NameFlags.AutoRegister,
                    name: lastData.name,
                    role: lastData.role,
                });
                document.save();
            }
        }

        if (channel) {
            channel.send({
                embeds: [
                    embed.setDescription(
                        [
                            `${member} (${inlineCode(member.id)}) kullanıcısı tagımızı alarak aramıza katıldı!`,
                            codeBlock('fix', `Mevcut isminde tag bulunan üye sayımız: ${tagMemberCount.size}`),
                        ].join('\n'),
                    ),
                ],
            });
        }
    }

    if (
        oldHasTag &&
        !newHasTag &&
        [...(guildData.womanRoles || []), ...(guildData.manRoles || []), guildData.registeredRole].some((role) => member.roles.cache.has(role))
    ) {
        const lastRoles = member.roles.cache.filter((c) => !c.managed && c.id !== member.guild.id);
        const minStaffRole = member.guild.roles.cache.get(guildData.minStaffRole);
        if (minStaffRole && member.roles.highest.position >= minStaffRole.position) {
            const staffRoles = member.roles.cache.filter((r) => r.position >= minStaffRole.position);
            sendStaffText(client, member, 'tagı isminden çıkardı', staffRoles);
        }

        if (guildData.taggedMode && !member.roles.cache.has(guildData.vipRole) && !member.premiumSince) {
            await UserModel.updateOne(
                { id: member.id, guild: member.guild.id },
                {
                    $push: {
                        roleLogs: {
                            type: RoleLogFlags.TagRemove,
                            roles: lastRoles.map((c) => c.id),
                            time: now,
                            admin: client.user.id,
                        },
                    },
                    $set: {
                        lastRoles: lastRoles.filter(r => minStaffRole?.position > r.position).map((c) => c.id),
                    },
                },
            );

            if (guildData.unregisterRoles && guildData.unregisterRoles.some((r) => member.guild.roles.cache.has(r))) {
                client.utils.setRoles(member, guildData.unregisterRoles);
            } else client.utils.setRoles(member, []);

            if (member.manageable) {
                if (guildData.changeName) member.setNickname('İsim | Yaş');
                else member.setNickname(null);
            }
        } else {
            if (familyRole) member.roles.remove(familyRole);
            if (member.manageable && guildData.secondTag)
                member.setNickname(member.displayName.replace(guildData.tags[0], guildData.secondTag));
        }

        if (channel) {
            channel.send({
                embeds: [
                    embed.setDescription(
                        [
                            `${member} (${inlineCode(member.id)}) kullanıcısı tagımızı bırakarak aramızdan ayrıldı!`,
                            codeBlock('fix', `Mevcut isminde tag bulunan üye sayımız: ${tagMemberCount.size}`),
                        ].join('\n'),
                    ),
                ],
            });
        }
    }
}

export default tagHandler;
