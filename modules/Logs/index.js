const ChannelCreate = require('./Channel/ChannelCreate')
const ChannelDelete = require('./Channel/ChannelDelete')
const ChannelUpdate = require('./Channel/ChannelUpdate')
const EmojiCreate = require('./Emoji/EmojiCreate')
const EmojiDelete = require('./Emoji/EmojiDelete')
const EmojiUpdate = require('./Emoji/EmojiUpdate')
const GuildBanAdd = require('./Guild/GuildBanAdd')
const GuildBanRemove = require('./Guild/GuildBanRemove')
const GuildMemberAdd = require('./Guild/GuildMemberAdd')
const GuildMemberRemove = require('./Guild/GuildMemberRemove')
const GuildMemberUpdate = require('./Guild/GuildMemberUpdate')
const GuildUpdate = require('./Guild/GuildUpdate')
const InviteCreate = require('./Guild/InviteCreate')
const InviteDelete = require('./Guild/InviteDelete')
const MessageDelete = require('./Message/MessageDelete')
const MessageDeleteBulk = require('./Message/MessageDeleteBulk')
const MessageUpdate = require('./Message/MessageUpdate')
const RoleCreate = require('./Role/RoleCreate')
const RoleDelete = require('./Role/RoleDelete')
const RoleMemberAdd = require('./Role/RoleMemberAdd')
const RoleMemberRemove = require('./Role/RoleMemberRemove')
const RoleUpdate = require('./Role/RoleUpdate')
const StickerCreate = require('./Sticker/StickerCreate')
const StickerDelete = require('./Sticker/StickerDelete')
const StickerUpdate = require('./Sticker/StickerUpdate')
const ThreadCreate = require('./Thread/ThreadCreate')
const ThreadDelete = require('./Thread/ThreadDelete')
const ThreadUpdate = require('./Thread/ThreadUpdate')
const UserUpdate = require('./User/UserUpdate')
const VoiceConnect = require('./Voice/VoiceConnect')
const VoiceDisconnect = require('./Voice/VoiceDisconnect')
const VoiceMove = require('./Voice/VoiceMove')
const VoiceServerDeaf = require('./Voice/VoiceServerDeaf')
const VoiceServerMute = require('./Voice/VoiceServerMute')
const VoiceServerUndeaf = require('./Voice/VoiceServerUndeaf')
const VoiceServerUnmute = require('./Voice/VoiceServerUnmute')

module.exports = {
    ChannelCreate,
    ChannelDelete,
    ChannelUpdate,
    EmojiCreate,
    EmojiDelete,
    EmojiUpdate,
    GuildBanAdd,
    GuildBanRemove,
    GuildMemberAdd,
    GuildMemberRemove,
    GuildMemberUpdate,
    GuildUpdate,
    InviteCreate,
    InviteDelete,
    MessageDelete,
    MessageDeleteBulk,
    MessageUpdate,
    RoleCreate,
    RoleDelete,
    RoleMemberAdd,
    RoleMemberRemove,
    RoleUpdate,
    StickerCreate,
    StickerDelete,
    StickerUpdate,
    ThreadCreate,
    ThreadDelete,
    ThreadUpdate,
    UserUpdate,
    VoiceConnect,
    VoiceDisconnect,
    VoiceMove,
    VoiceServerDeaf,
    VoiceServerMute,
    VoiceServerUndeaf,
    VoiceServerUnmute,

    images: {
        BAN_ADD: 'https://i.imgur.com/qI02Ivf.png',
        BAN_REMOVE: 'https://i.imgur.com/FVnlHqJ.png',
        KICK: 'https://i.imgur.com/RYVLGuy.png',
        MUTE_ADD: 'https://i.imgur.com/t5FJ6Gw.png',
        MUTE_REMOVE: 'https://i.imgur.com/rtL11np.png',
        PRUNE_MESSAGES: 'https://i.imgur.com/vUd9gtw.png',
        WARN_ADD: 'https://i.imgur.com/R03G3G5.png',
        WARN_REMOVE: 'https://i.imgur.com/AXNkdfG.png'
    }
}