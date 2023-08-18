import { Guild, GuildMember } from 'discord.js';
import { Client } from '@/structures';
import { ModerationClass, PenalClass, PenalModel } from '@/models';
import { FilterQuery } from 'mongoose';
import { PenalFlags, SpecialCommandFlags } from '@/enums';
import voiceMuteHandler from './voiceMuteHandler';
import chatMuteHandler from './chatMuteHandler';
import specialCommandHandler from './specialCommandHandler';
import quarantineHandler from './quarantineHandler';
import banHandler from './banHandler';

export async function checkPenals(client: Client, guild: Guild) {
    const guildData = client.servers.get(guild.id);
    if (!guildData) return;

    const now = Date.now();
    const specialCommands = (guildData.moderation.specialCommands || []).filter(
        (p) => p.type === SpecialCommandFlags.Punishment,
    );
    const query: FilterQuery<PenalClass> = {
        guild: guild.id,
        finish: { $lte: now },
        $nor: [{ type: PenalFlags.ForceBan }, { type: PenalFlags.Ads }],
        activity: true,
        visible: true,
    };
    const penals = await PenalModel.find(query);
    await PenalModel.updateMany(query, { activity: false });
    for (const penal of penals) {
        const member = await client.utils.getMember(guild, penal.user);
        if (!member) return;

        if (penal.type === PenalFlags.VoiceMute) {
            voiceMuteHandler(client, penal, member, guildData.moderation);
            return;
        }

        if (penal.type === PenalFlags.ChatMute) chatMuteHandler(client, member, guildData.moderation);
        if (penal.type === PenalFlags.Quarantine) quarantineHandler(client, member, guildData.moderation);
        if (penal.type === PenalFlags.Ban) banHandler(client, member, guildData.moderation);

        const specialCommand = specialCommands.find((c) => c.punishType === penal.type);
        if (specialCommand) specialCommandHandler(client, member, specialCommand);

        penal.activity = false;
        penal.save();
    }
}

export function checkBannedTag(client: Client, member: GuildMember, guildData: ModerationClass) {
    if (!member.guild.roles.cache.has(guildData.bannedTagRole)) return false;

    if (guildData.bannedTags?.some((t) => member.user.displayName.toLowerCase().includes(t.toLowerCase()))) {
        if (member.roles.cache.has(guildData.bannedTagRole)) client.utils.setRoles(member, guildData.bannedTagRole);
        return true;
    }

    return false;
}
