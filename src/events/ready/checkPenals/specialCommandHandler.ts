import { ISpecialCommand } from "@/models";
import { Client } from "@/structures";
import { TextChannel, EmbedBuilder, GuildMember, inlineCode } from "discord.js";

async function specialCommandHandler(client: Client, member: GuildMember, command: ISpecialCommand) {
	if (member.roles.cache.has(command.punishRole)) await member.roles.remove(command.punishRole);

	const channel = member.guild.channels.cache.get(command.logChannel) as TextChannel;
	if (!channel) return;

	channel.send({
		embeds: [
			new EmbedBuilder({
				color: client.utils.getRandomColor(),
				description: `${member} (${inlineCode(member.id)}) adlı kullanıcının ceza süresi dolduğu için kaldırıldı.`,
			}),
		],
	});
}

export default specialCommandHandler;