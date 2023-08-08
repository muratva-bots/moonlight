import { SpecialCommandFlags } from '@/enums';
import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';

export interface ISpecialCommand {
    type: SpecialCommandFlags;
    punishType?: number;
    punishName?: string;
    punishRole?: string;
    logChannel?: string;
}

export interface IMonthlyRole {
    role: string;
    time: number;
}

export class PointClass {}

export class ModerationClass {
    tags: string[];
    secondTag: string;
    minStaffRole: string;
    taggedMode: boolean;
    changeName: boolean;
    unregisterRoles: string[];
    vipRole: string;
    underworldRole: string;
    quarantineRole: string;
    chatMuteRole: string;
    voiceMuteRole: string;
    adsRole: string;
    specialCommands: ISpecialCommand[];
    registeredRole: string;
    manRoles: string[];
    womanRoles: string[];
    familyRole: string;
    bannedTagRole: string;
    bannedTags: string[];
    registerChat: string;
    invasionProtection: boolean;
    suspectedRole: string;
    autoRegister: boolean;
    solvingParent: string;
    afkRoom: string;
    chatChannel: string;
    needAge: boolean;
    staffChat: string;
    monthlyRoles: IMonthlyRole[];
}

@modelOptions({ options: { customName: 'Guilds', allowMixed: 0 } })
export class GuildClass {
    @prop({ type: () => String, required: true, unique: true })
    public id!: string;

    @prop({
        type: Object,
        default: {
            needName: true,
            registerSystem: true,
            invasionProtection: true,
            needAge: true,
            removeWarnRole: true,
            compliment: true,
            changeName: true,
            minAgePunish: true,
            maxMuteSystem: true,
            extraMute: true,
        },
    })
    public moderation: ModerationClass;

    @prop({ type: Object, default: {} })
    public guard: object;

    @prop({ type: Object, default: {} })
    public point: PointClass;
}

export const GuildModel = getModelForClass(GuildClass);
