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
    registerChannel: string;
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
    @prop({ type: () => String, required: true })
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

    @prop({
        type: Object,
        default: {
            messagePoint: 1,
            messageStaffPoint: 2,
            invitePoint: 70,
            sleepPoint: 4,
            publicPoint: 8,
            meetingPoint: 500,
            noMute: true,
            eventFinishTimestamp: Date.now(),
            staffTakePoints: 70,
            taggedPoints: 70
        },
    })
    public point: object;

    @prop({
        type: Object,
        default: {
            removeOldRank: false,
            dailyPublic: 0,
            lastPublic: 0,
            dailyStream: 0,
            lastStream: 0,
            dailyCam: 0,
            lastCam: 0,
            dailyStreamOpen: 0,
            lastStreamOpen: 0,
            dailyCamOpen: 0,
            lastCamOpen: 0,
            dailyGeneral: 0,
            lastGeneral: 0,
            dailyMessage: 0,
            lastMessage: 0,
            dailyAfk: 0,
            lastAfk: 0,
            dailyJoin: 0,
            lastJoin: 0,
            dailyLeave: 0,
            lastLeave: 0,
            camChannels: [],
            dailyVoice: 0,
            lastVoice: 0,
            lastDay: new Date().setHours(0, 0, 0, 0),
            days: 1,
            owneredStreams: []
        },
    })
    public stat: object;
}

export const GuildModel = getModelForClass(GuildClass);
