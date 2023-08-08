import { NameFlags } from '@/enums';
import { ModerationClass, UserModel } from '@/models';
import { Client } from '@/structures';
import { Guild, PermissionFlagsBits } from 'discord.js';

async function checkNames(client: Client, guild: Guild, guildData: ModerationClass) {
    if (!guildData.tags || !guildData.tags.length || !guildData.secondTag || !guildData.needAge) return;

    const hasUnregisterRoles =
        guildData.unregisterRoles && guildData.unregisterRoles.some((r) => guild.roles.cache.has(r));
    const willChangeNameMembers = guild.members.cache.filter(
        (m) =>
            !m.premiumSince &&
            !m.roles.cache.has(guildData.vipRole) &&
            !m.permissions.has(PermissionFlagsBits.Administrator) &&
            !m.displayName.includes('|') &&
            [...(guildData.womanRoles || []), ...(guildData.manRoles || []), guildData.registeredRole].some((r) =>
                m.roles.cache.has(r),
            ),
    );
    if (!willChangeNameMembers.size) return;

    const userDocuments = await UserModel.find({
        id: { $in: willChangeNameMembers.map((m) => m.id) },
        guild: guild.id,
    });
    if (!userDocuments.length) return;

    willChangeNameMembers.forEach((m) => {
        const document = userDocuments.find((d) => d.id === m.id);
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
        if (names.length) m.setNickname(names[names.length - 1].name);
        else client.utils.setRoles(m, hasUnregisterRoles ? guildData.unregisterRoles : []);
    });
}

export default checkNames;
