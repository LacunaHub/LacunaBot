import { model, Schema, Document } from 'mongoose'
import { Bill } from '../../internals/utility/Qiwi'

export default model<UserDocument>(
    'Users',
    new Schema<UserDocument>({
        _id: { type: String },
        flags: { type: Number, default: 0 },
        user: {
            username: { type: String, default: '' },
            discriminator: { type: String, default: '' },
            avatar: { type: String, default: '' },
            flags: { type: Number, default: 0 }
        },
        profile: {
            name: { type: String, default: '' },
            gender: { type: Number, default: 0 },
            birth_date: { type: Number, default: 0 },
            bio: { type: String, default: '' },
            views: { type: Number, default: 0 },
            upvoters: { type: Array, default: [] }
        },
        bills: { type: Array, default: [] },
        created_at: { type: Number, default: () => Date.now() },
        modified_at: { type: Number, default: 0 }
    }, { versionKey: false })
)

export interface UserDocument extends Document {
    _id: string
    flags: number
    user: {
        username: string
        discriminator: string
        avatar: string
        flags: number
    },
    profile: {
        name: string
        gender: number
        birth_date: number
        bio: string
        views: number
        upvoters: string[]
    }
    bills: Bill[]
    created_at: number
    modified_at: number
}