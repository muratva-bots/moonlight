import { PenalFlags, SpecialCommandFlags } from '@/enums';
import { ModerationClass, PenalModel } from '@/models';
import { Client } from '@/structures';
import { GuildMember } from 'discord.js';

async function checkPenals(client: Client, member: GuildMember, guildData: ModerationClass) {
    const specialCommands = (guildData.specialCommands || []).filter((c) => c.type === SpecialCommandFlags.Punishment);
    const penals = await PenalModel.find({ user: member.id, activity: true, guild: member.guild.id }).select('type');
    if (!penals.length) return false;

    if (penals.some((p) => p.type === PenalFlags.ForceBan)) {
        member.guild.members.ban(member.id, { reason: 'Bu oç nasıl girebildi amk.' });
        return true;
    }

    if (penals.some((p) => p.type === PenalFlags.Ads) && member.guild.roles.cache.has(guildData.adsRole)) {
        client.utils.setRoles(member, guildData.adsRole);
        return true;
    }

    if (penals.some((p) => p.type === PenalFlags.Ban) && member.guild.roles.cache.has(guildData.underworldRole)) {
        client.utils.setRoles(member, guildData.underworldRole);
        return true;
    }

    if (
        penals.some((p) => p.type === PenalFlags.Quarantine) &&
        member.guild.roles.cache.has(guildData.quarantineRole)
    ) {
        client.utils.setRoles(member, guildData.quarantineRole);
        return true;
    }

    const roles: string[] = [];
    if (penals.some((p) => p.type === PenalFlags.ChatMute) && member.guild.roles.cache.has(guildData.chatMuteRole))
        roles.push(guildData.chatMuteRole);
    if (penals.some((p) => p.type === PenalFlags.VoiceMute) && member.guild.roles.cache.has(guildData.voiceMuteRole))
        roles.push(guildData.voiceMuteRole);

    const specialCommandRoles = specialCommands
        .filter((c) => member.guild.roles.cache.has(c.punishRole) && penals.some((p) => c.punishType === p.type))
        .map((c) => c.punishRole);
    if (specialCommandRoles.length) roles.push(...specialCommandRoles);

    if (roles.length) member.roles.add(roles);

    return false;
}

export default checkPenals;
