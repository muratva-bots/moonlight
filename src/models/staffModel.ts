import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";

@modelOptions({ options: { customName: 'Staffs', allowMixed: 0 } })
export class StaffClass {
    @prop({ type: () => String, required: true })
    public id: string;

    @prop({ type: () => String, required: true })
    public guild: string;

    @prop({ type: () => Number, default: 0 })
    public allPoints: number;

    @prop({ type: () => Number, default: 0 })
    public lastWeekPoints: number;

    @prop({ type: () => Number, default: () => Date.now() })
    public staffStartTime: number;

    @prop({ type: () => Number, default: () => Date.now() })
    public roleStartTime: number;

    @prop({ type: () => Number, default: 0 })
    public bonusPoints: number;

    @prop({ type: () => Number, default: 0 })
    public invitePoints: number;

    @prop({ type: () => Number, default: 0 })
    public messagePoints: number;

    @prop({ type: () => Number, default: 0 })
    public publicPoints: number;

    @prop({ type: () => Number, default: 0 })
    public registerPoints: number;

    @prop({ type: () => Number, default: 0 })
    public responsibilityPoints: number;

    @prop({ type: () => Number, default: 0 })
    public sleepPoints: number;

    @prop({ type: () => Number, default: 0 })
    public totalPoints: number;
    
    @prop({ type: () => Boolean, default: false })
    public inGeneralMeeting: boolean;
    
    @prop({ type: () => Boolean, default: false })
    public inPersonalMeeting: boolean;
    
    @prop({ type: () => [Object], default: [] })
    public tasks: object[];

    @prop({ type: () => [Object], default: [] })
    public problemResolves: object[];

    @prop({ type: () => [Object], default: [] })
    public staffTakes: object[];
}

export const StaffModel = getModelForClass(StaffClass);
