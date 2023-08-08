import { NameFlags } from '@/enums';
import { ModerationClass, UserModel } from '@/models';
import { Client } from '@/structures';
import { EmbedBuilder, GuildMember, TextChannel, bold, inlineCode, time } from 'discord.js';

async function welcomeHandler(
    client: Client,
    member: GuildMember,
    guildData: ModerationClass,
    registerChannel?: TextChannel,
) {
    const embed = new EmbedBuilder({
        color: client.utils.getRandomColor(),
    });

    if (guildData.autoRegister) {
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
                          NameFlags.UnregisterBoost,
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

            if (registerChannel) {
                registerChannel.send({
                    embeds: [
                        embed.setDescription(
                            `${member} (${inlineCode(
                                member.id,
                            )}) adlı kullanıcı önceden kayıtlı olduğu için kayıdı otomatik yapıldı.`,
                        ),
                    ],
                });
            }
        } else giveUnregisterRoles(member, guildData);
    } else giveUnregisterRoles(member, guildData);

    if (!registerChannel) return;

    registerChannel.send({
        embeds: [
            embed.setDescription(
                [
                    `Merhabalar ${member}, ${bold(member.guild.name)} sunucumuza hoşgeldin.\n`,
                    `Seninle beraber sunucumuz ${bold(member.guild.memberCount.toString())} üye sayısına ulaştı.\n`,
                    `Hesabın **${time(
                        Math.floor(member.user.createdTimestamp / 1000),
                        'R',
                    )}** tarihinde oluşturulmuş. (${bold(
                        time(Math.floor(member.user.createdTimestamp / 1000), 'D'),
                    )})\n`,
                    guildData.tags && guildData.tags.length
                        ? `Bizi desteklemek için sunucumuzun tagını (${guildData.tags.join(', ')}) alabilirsiniz.`
                        : undefined,
                ]
                    .filter(Boolean)
                    .join('\n'),
            ),
        ],
    });
}

export default welcomeHandler;

function giveUnregisterRoles(member: GuildMember, guildData: ModerationClass) {
    const unregisterRoles = (guildData.unregisterRoles || []).filter((r) => member.guild.roles.cache.has(r));
    if (unregisterRoles.length) member.roles.add(unregisterRoles);
    else console.log('Guild Member Add: No given role.');
}
