import { GuildModel, ModerationClass } from '@/models';
import { GuildMember, PermissionFlagsBits, TextChannel } from 'discord.js';

const ONE_DAY = 1000 * 60 * 60 * 24;
const SUSPECT_TIME = 1000 * 60 * 60 * 24 * 7;
const MAX_ACCOUNTS = 7;
const IN_TIMES = 5 * 60 * 1000;

async function checkFakeAccount(member: GuildMember, guildData: ModerationClass, registerChannel?: TextChannel) {
    const now = Date.now();
    const fakeAccounts = member.guild.members.cache.filter(
        (member) =>
            (now - member.user.createdTimestamp) / ONE_DAY < SUSPECT_TIME && now - member.joinedTimestamp < IN_TIMES,
    ).size;
    if (fakeAccounts >= MAX_ACCOUNTS) {
        if (guildData.invasionProtection) return true;

        guildData.invasionProtection = true;
        await GuildModel.updateOne(
            { id: member.guild.id },
            { $set: { 'moderation.invasionProtection': true } },
            { upsert: true },
        );

        if (registerChannel) {
            registerChannel.send({
                content: `Fake hesap istilası tespit edildi. Sunucumuza 1 dakika içerisinde ${MAX_ACCOUNTS} fake hesap giriş yaptığı için otorol işlemi durduruldu. Lütfen bu süreç içerisinde yetki sahibi kişilerin müdahalesini bekleyin.`,
            });
        }

        return true;
    }

    return false;
}

export default checkFakeAccount;
