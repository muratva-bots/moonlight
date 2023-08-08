import { ModerationClass, PenalClass } from "@/models";
import { Client } from "@/structures";
import { Guild, TextChannel, EmbedBuilder, GuildMember, inlineCode } from "discord.js";
import { Document } from "mongoose";

async function voiceMuteHandler(
	client: Client,
	penal: (Document<unknown, any, PenalClass> & PenalClass),
	member: GuildMember,
	guildData: ModerationClass
) {
	if (member.voice.channelId && member.voice.channel.parentId === guildData.solvingParent) return;

	penal.activity = false;

	let completed = true;
	if (member.voice.channelId && member.voice.channel.id !== guildData.afkRoom) await member.voice.setMute(false);
	else completed = false;
	penal.completed = completed;

	penal.save();

	if (member.roles.cache.has(guildData.voiceMuteRole)) await member.roles.remove(guildData.voiceMuteRole);

	const channel = member.guild.channels.cache.find((c) => c.name === "voice-mute-log") as TextChannel;
	if (!channel) return;

	channel.send({
		embeds: [
			new EmbedBuilder({
				color: client.utils.getRandomColor(),
				description:
					penal.completed ?
						`${member} (${inlineCode(member.id)}) adlı kullanıcının ceza süresi dolduğu için kaldırıldı.` :
						`${member} (${inlineCode(member.id)}) adlı kullanıcının cezası kaldırılamadı sese girdiğinde kaldırılacak.`
			}),
		],
	});
}

export default voiceMuteHandler;