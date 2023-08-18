import { NameFlags } from '@/enums';
import { ModerationClass, UserModel } from '@/models';
import { Client } from '@/structures';
import { EmbedBuilder, GuildMember, TextChannel, VoiceChannel, bold, inlineCode, time } from 'discord.js';

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
        const hasTag = (guildData.tags || []).some((t) => member.user.displayName.toLowerCase().includes(t.toLowerCase()));
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
        console.log(names)
        if (names.length && (guildData.taggedMode && hasTag)) {
            console.log(names)
            const lastData = names[names.length - 1];
            member.setNickname(lastData.name);

            const roles: string[] = [];
            if ((guildData.womanRoles || []).includes(lastData.role)) roles.push(...guildData.womanRoles);
            if ((guildData.manRoles || []).includes(lastData.role)) roles.push(...guildData.manRoles);
            if (member.guild.roles.cache.has(guildData.registeredRole)) roles.push(guildData.registeredRole);
            if (hasTag && member.guild.roles.cache.has(guildData.familyRole)) roles.push(guildData.familyRole); 
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

    const voiceChannel = member.guild.channels.cache
        .filter((c) => c.isVoiceBased() && c.parentId === registerChannel.parentId)
        .sort((a, b) => (a as VoiceChannel).members.size - (b as VoiceChannel).members.size)
        .first();

    registerChannel.send({
        content: [
<<<<<<< HEAD
            `Merhabalar ${member}, ${bold(member.guild.name)} sunucumuza hoşgeldin. Seninle beraber sunucumuz ${bold(member.guild.memberCount.toString())} üye sayısına ulaştı. 🎉`,
            `Sunucuya erişebilmek için ${voiceChannel} odalarında kayıt olup ismini ve yaşını belirtmen gerekmektedir! kurallar kanalından sunucu kurallarımızı okumayı ihmal etme!`,
            guildData.tags && guildData.tags.length
=======
            `Merhabalar ${member}, ${bold(member.guild.name)} sunucumuza hoşgeldin.`,
            `Seninle beraber sunucumuz ${bold(member.guild.memberCount.toString())} üye sayısına ulaştı.`,
            `Hesabın **${time(Math.floor(member.user.createdTimestamp / 1000), 'R')}** tarihinde oluşturulmuş. (${bold(
                time(Math.floor(member.user.createdTimestamp / 1000), 'D'),
            )})`,
            `Sunucuya erişebilmek için ${voiceChannel} odalarında kayıt olup ismini ve yaşını belirtmen gerekmektedir!`,
            guildData.tags?.length
>>>>>>> 02352e5a1d42f763450332eec7c9035925a35766
                ? `Bizi desteklemek için sunucumuzun tagını (${guildData.tags.join(', ')}) alabilirsiniz.`
                : undefined,
            `Hesabın **${time(Math.floor(member.user.createdTimestamp / 1000), 'R')}** tarihinde oluşturulmuş. (${bold(
                time(Math.floor(member.user.createdTimestamp / 1000), 'D'),
            )})`,
        ]
            .filter(Boolean)
            .join('\n\n'),
    });
}

export default welcomeHandler;

function giveUnregisterRoles(member: GuildMember, guildData: ModerationClass) {
<<<<<<< HEAD
    if (guildData.changeName) member.setNickname("İsim | Yaş");

    const unregisterRoles = (guildData.unregisterRoles || []).filter((r) => member.guild.roles.cache.has(r));
=======
    const unregisterRoles = guildData.unregisterRoles?.filter((r) => member.guild.roles.cache.has(r));
>>>>>>> 02352e5a1d42f763450332eec7c9035925a35766
    if (unregisterRoles.length) member.roles.add(unregisterRoles);
    else console.log('Guild Member Add: No given role.');
}
