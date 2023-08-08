import { ANOTHER_TAGS } from "@/assets";
import { RoleLogFlags } from "@/enums";
import { ModerationClass, UserModel } from "@/models";
import { Client } from "@/structures";
import { Guild, inlineCode } from "discord.js";
import { sendStaffText } from "../../userUpdate/anotherTagHandler";

function anotherTagHandler(client: Client, guild: Guild, guildData: ModerationClass) {
    const minStaffRole = guild.roles.cache.get(guildData.minStaffRole);
    if (!minStaffRole) return;

    const filteredTags = ANOTHER_TAGS.filter((t) => !(guildData.tags || []).includes(t));
    guild.members.cache
        .filter(
            (m) =>
                m.roles.highest.position >= minStaffRole.position &&
                filteredTags.some((t) => m.user.displayName.toLowerCase().includes(t.toLowerCase())),
        )
        .forEach(async (m) => {
            const tag = filteredTags.find((t) => m.user.displayName.toLowerCase().includes(t.toLowerCase()));
            if (!tag) return;

            const roles = m.roles.cache.filter((r) => !r.managed && minStaffRole.position > r.position);
            m.roles.set(roles);

            await UserModel.updateOne(
                { id: m.id, guild: guild.id },
                {
                    $push: {
                        roleLogs: {
                            type: RoleLogFlags.AnotherTagAdd,
                            roles: roles.map((r) => r.id),
                            time: Date.now(),
                            admin: client.user.id,
                        },
                    },
                },
                { upsert: true },
            );

            sendStaffText(client, m, `başka sunucunun tagını (${inlineCode(tag)}) ismine aldı`, roles);
        });
}

export default anotherTagHandler;
