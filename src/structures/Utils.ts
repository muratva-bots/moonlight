import { readdirSync } from 'fs';
import { resolve } from 'path';
import { Guild, GuildMember, Snowflake, User } from 'discord.js';

import { Client } from '@/structures';
import { EMOJIS } from '@/assets';

export class Utils {
    private client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    splitMessage(
		text: string,
		{ maxLength = 2000, char = "\n", prepend = "", append = "" } = {},
	) {
		if (text.length <= maxLength) return [text];
		const splitText = text.split(char);
		const messages = [];
		let msg = "";
		for (const chunk of splitText) {
			if (msg && (msg + char + chunk + append).length > maxLength) {
				messages.push(msg + append);
				msg = prepend;
			}
			msg += (msg && msg !== prepend ? char : "") + chunk;
		}
		return messages.concat(msg).filter((m) => m);
	}

    getEmoji(name: string) {
        const clientEmoji = this.client.emojis.cache.find((e) => e.name === name);
        return clientEmoji ? clientEmoji.toString() : EMOJIS.find((e) => e.name === name).default;
    }

    isSnowflake(id: string): id is Snowflake {
        return BigInt(id).toString() === id;
    }

    setRoles(member: GuildMember, params: string[] | string): Promise<GuildMember> {
        if (!member.manageable) return undefined;

        const roles = member.roles.cache
            .filter((role) => role.managed)
            .map((role) => role.id)
            .concat(params);
        return member.roles.set(roles);
    }

    async getMember(guild: Guild, id: string): Promise<GuildMember> {
        if (!id || !this.isSnowflake(id.replace(/\D/g, ''))) return;

        const cache = guild.members.cache.get(id.replace(/\D/g, ''));
        if (cache) return cache;

        let result;
        try {
            result = await guild.members.fetch({ user: id.replace(/\D/g, ''), force: true, cache: true });
        } catch (e) {
            result = undefined;
        }
        return result;
    }

    async getUser(id: string): Promise<User> {
        if (!id || !this.isSnowflake(id.replace(/\D/g, ''))) return;

        const cache = this.client.users.cache.get(id.replace(/\D/g, ''));
        if (cache) return cache;

        let result;
        try {
            result = await this.client.users.fetch(id.replace(/\D/g, ''), { force: true, cache: true });
        } catch (e) {
            result = undefined;
        }
        return result;
    }

    getRandomColor() {
        return Math.floor(Math.random() * (0xffffff + 1));
    }

    async loadEvents() {
        const files = readdirSync(resolve(__dirname, '..', 'events'));
        files.forEach(async (fileName) => {
            const eventFile = await import(resolve(__dirname, '..', 'events', fileName));
            delete require.cache[eventFile];

            const event = eventFile.default;
            this.client.on(event.name, (...args: unknown[]) => event.execute(this.client, ...args));
        });
    }
}
