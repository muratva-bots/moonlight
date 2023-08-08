import { PenalFlags } from '@/enums';
import { ModerationClass, PenalModel } from '@/models';
import { VoiceState } from 'discord.js';

async function voiceMuteHandler(oldState: VoiceState, newState: VoiceState, guildData: ModerationClass) {
    if (newState.serverMute) {
        const penals = await getPendingVoiceMutes(newState.id, newState.guild.id);
        if (penals.some((p) => !p.activity) && newState.channel.id !== guildData.afkRoom) {
            if (newState.serverMute) newState.member.voice.setMute(false);

            await PenalModel.updateMany(
                { user: newState.member.id, guild: newState.guild.id, completed: false },
                { completed: true },
            );
        }
    }

    if (!newState.serverMute && newState.channel.parentId !== guildData.solvingParent) {
        const penals = await getPendingVoiceMutes(newState.id, newState.guild.id);
        if (penals.some((p) => p.activity)) newState.setMute(true);
    }
}

export default voiceMuteHandler;

async function getPendingVoiceMutes(stateId, guildId) {
    try {
        const pendingMutes = await PenalModel.find({
            user: stateId,
            type: PenalFlags.VoiceMute,
            guild: guildId,
            completed: false,
        });

        return pendingMutes;
    } catch (error) {
        console.error('Error fetching pending voice mutes:', error);
        return [];
    }
}
