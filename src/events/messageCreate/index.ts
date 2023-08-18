import { Events, PermissionFlagsBits } from 'discord.js';
import spamHandler from './spamHandler';
import emojiHandler from './emojiHandler';
import capsHandler from './capsHandler';
import inviteHandler from './inviteHandler';
import spotifyHandler from './spotifyHandler';

const MessageCreate: Moonlight.IEvent<Events.MessageCreate> = {
    name: Events.MessageCreate,
    execute: async (client, message) => {
        try {
            if (message.author.bot || message.member.permissions.has(PermissionFlagsBits.Administrator) || message.member.permissions.has(PermissionFlagsBits.ViewAuditLog)) return;

            const hasSpam = await spamHandler(message);
            if (hasSpam) return;

            const hasInvite = await inviteHandler(client, message);
            if (hasInvite) return;

            const hasEmoji = await emojiHandler(client, message);
            if (hasEmoji) return;

            const hasSpotify = await spotifyHandler(client, message);
            if (hasSpotify) return;

            capsHandler(client, message);
        } catch (err) {
            console.log('Message Create:', err);
        }
    },
};

export default MessageCreate;
