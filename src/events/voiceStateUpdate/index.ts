import { Events } from 'discord.js';
import joinLogHandler from './joinLogHandler';
import leaveLogHandler from './leaveLogHandler';
import voiceMuteHandler from './voiceMuteHandler';
import comeOutHandler from './comeOutHandler';
import microphoneBugHandler from './microphoneBugHandler';

const VoiceStateUpdate: Moonlight.IEvent<Events.VoiceStateUpdate> = {
    name: Events.VoiceStateUpdate,
    execute: async (client, oldState, newState) => {
        try {
            const guildData = client.servers.get(newState.guild.id);
            if (!guildData) return;

            if (newState.channelId) {
                voiceMuteHandler(newState, guildData);
                if (oldState.channelId !== newState.channelId) comeOutHandler(newState, guildData);
            }

            if (
                newState.selfMute !== oldState.selfMute || 
                newState.selfDeaf !== oldState.selfDeaf
            ) microphoneBugHandler(newState, guildData);

            if (
                (!oldState.channelId && newState.channelId) || 
                (newState.channelId && oldState.channelId !== newState.channelId)
            ) joinLogHandler(newState);

            if (oldState.channelId && !newState.channelId) leaveLogHandler(oldState);
        } catch (err) {
            console.log('Voice State Update:', err);
        }
    },
};

export default VoiceStateUpdate;
