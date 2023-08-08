import { NameFlags, RoleLogFlags } from '@/enums';
import { ModerationClass, UserModel } from '@/models';
import { Client } from '@/structures';
import { GuildMember } from 'discord.js';

async function boostHandler(
    client: Client,
    oldMember: GuildMember,
    newMember: GuildMember,
    guildData: ModerationClass,
) {
    if (
        !(oldMember.premiumSince && !newMember.premiumSince) ||
        newMember.roles.cache.has(guildData.vipRole) ||
        [
            guildData.underworldRole,
            guildData.suspectedRole,
            guildData.adsRole,
            guildData.quarantineRole,
            ...(guildData.unregisterRoles || []),
        ].some((role) => newMember.roles.cache.has(role))
    )
        return;

    if (guildData.taggedMode) {
        await unregister(client, newMember, guildData);
        return;
    }

    const document = await UserModel.findOne({ id: newMember.id, guild: newMember.guild.id }).select('names');
    const names = document
        ? document.names.filter(
              (n) =>
                  n.name &&
                  ![
                      NameFlags.Unregister,
                      NameFlags.BoostFinish,
                      NameFlags.BoosterChangeName,
                      NameFlags.ManuelBoostFinish,
                      NameFlags.UnregisterBoost,
                  ].includes(n.type),
          )
        : [];
    if (!names.length) {
        await unregister(client, newMember, guildData);
        return;
    }

    const lastName = names[names.length - 1].name;

    document.names.push({
        admin: client.user.id,
        type: newMember.user.avatar.startsWith('_a') ? NameFlags.ManuelBoostFinish : NameFlags.BoostFinish,
        time: Date.now(),
        name: newMember.displayName,
    });

    document.save();

    newMember.setNickname(lastName);
}

export default boostHandler;

async function unregister(client: Client, newMember: GuildMember, guildData: ModerationClass) {
    await UserModel.updateOne(
        { id: newMember.id, guild: newMember.guild.id },
        {
            $push: {
                names: {
                    admin: client.user.id,
                    type: NameFlags.UnregisterBoost,
                    time: Date.now(),
                    name: newMember.displayName,
                },
                roleLogs: {
                    type: RoleLogFlags.BoostRemove,
                    roles: newMember.roles.cache
                        .filter((r) => !r.managed && r.id !== newMember.guild.id)
                        .map((r) => r.id),
                    time: Date.now(),
                    admin: client.user.id,
                },
            },
        },
        { upsert: true },
    );

    if (guildData.unregisterRoles && guildData.unregisterRoles.some((r) => newMember.guild.roles.cache.has(r)))
        client.utils.setRoles(newMember, guildData.unregisterRoles);
    else client.utils.setRoles(newMember, []);

    if (guildData.changeName) newMember.setNickname('İsim | Yaş');
    else newMember.setNickname(null);
}
