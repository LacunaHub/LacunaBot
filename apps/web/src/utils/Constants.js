export const metaTitleTemplate = title => (title ? `${title} – Lacuna` : 'Lacuna – Discord Bot')

export const imButtonStyles = {
    PRIMARY: '#5865F2',
    SECONDARY: '#4F545C',
    SUCCESS: '#43B581',
    DANGER: '#F04747',
    LINK: '#4F545C'
}

export const discordPermissions = {
    CREATE_INSTANT_INVITE: 1 << 0,
    KICK_MEMBERS: 1 << 1,
    BAN_MEMBERS: 1 << 2,
    ADMINISTRATOR: 1 << 3,
    MANAGE_CHANNELS: 1 << 4,
    MANAGE_GUILD: 1 << 5,
    ADD_REACTIONS: 1 << 6,
    VIEW_AUDIT_LOG: 1 << 7,
    PRIORITY_SPEAKER: 1 << 8,
    STREAM: 1 << 9,
    VIEW_CHANNEL: 1 << 10,
    SEND_MESSAGES: 1 << 11,
    SEND_TTS_MESSAGES: 1 << 12,
    MANAGE_MESSAGES: 1 << 13,
    EMBED_LINKS: 1 << 14,
    ATTACH_FILES: 1 << 15,
    READ_MESSAGE_HISTORY: 1 << 16,
    MENTION_EVERYONE: 1 << 17,
    USE_EXTERNAL_EMOJIS: 1 << 18,
    VIEW_GUILD_INSIGHTS: 1 << 19,
    CONNECT: 1 << 20,
    SPEAK: 1 << 21,
    MUTE_MEMBERS: 1 << 22,
    DEAFEN_MEMBERS: 1 << 23,
    MOVE_MEMBERS: 1 << 24,
    USE_VAD: 1 << 25,
    CHANGE_NICKNAME: 1 << 26,
    MANAGE_NICKNAMES: 1 << 27,
    MANAGE_ROLES: 1 << 28,
    MANAGE_WEBHOOKS: 1 << 29,
    MANAGE_EMOJIS_AND_STICKERS: 1 << 30,
    USE_APPLICATION_COMMANDS: 1 << 31,
    REQUEST_TO_SPEAK: 1 << 32,
    MANAGE_THREADS: 1 << 34,
    USE_PUBLIC_THREADS: 1 << 35,
    USE_PRIVATE_THREADS: 1 << 36,
    USE_EXTERNAL_STICKERS: 1 << 37,
    SEND_MESSAGES_IN_THREADS: 1 << 38,
    START_EMBEDDED_ACTIVITIES: 1 << 39,
    MODERATE_MEMBERS: 1 << 40
}

export const discordChannelPermissions = {
    CREATE_INSTANT_INVITE: 1 << 0,
    MANAGE_CHANNELS: 1 << 4,
    ADD_REACTIONS: 1 << 6,
    PRIORITY_SPEAKER: 1 << 8,
    STREAM: 1 << 9,
    VIEW_CHANNEL: 1 << 10,
    SEND_MESSAGES: 1 << 11,
    SEND_TTS_MESSAGES: 1 << 12,
    MANAGE_MESSAGES: 1 << 13,
    EMBED_LINKS: 1 << 14,
    ATTACH_FILES: 1 << 15,
    READ_MESSAGE_HISTORY: 1 << 16,
    MENTION_EVERYONE: 1 << 17,
    USE_EXTERNAL_EMOJIS: 1 << 18,
    CONNECT: 1 << 20,
    SPEAK: 1 << 21,
    MUTE_MEMBERS: 1 << 22,
    DEAFEN_MEMBERS: 1 << 23,
    MOVE_MEMBERS: 1 << 24,
    USE_VAD: 1 << 25,
    MANAGE_WEBHOOKS: 1 << 29,
    USE_APPLICATION_COMMANDS: 1 << 31,
    REQUEST_TO_SPEAK: 1 << 32,
    MANAGE_THREADS: 1 << 34,
    USE_PUBLIC_THREADS: 1 << 35,
    USE_PRIVATE_THREADS: 1 << 36,
    USE_EXTERNAL_STICKERS: 1 << 37,
    SEND_MESSAGES_IN_THREADS: 1 << 38
}

export const discordAppCommandNameRegexp = /^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u

export const customCommandComponentLimits = {
    COMPARE_VALUES: 5,
    REPLY: 1,
    SEND_MESSAGE: 2,
    MODIFY_ROLES: 2,
    FORWARD_TO_COMMAND: 1,
    MODIFY_WALLET: 2,
    SHOW_MODAL: 1,
    OVERWRITE_CHANNEL_PERMISSIONS: 1
}

export const availableLocales = [
    { label: 'English', value: 'en' },
    { label: 'Русский', value: 'ru' },
    { label: 'Українська', value: 'uk' }
]

export const localeStringsMap = {
    messageFormats: {
        DM: 'Pages.GuildPage.GeneralSettings.MessageFormats.DM',
        CHANNEL: 'Pages.GuildPage.GeneralSettings.MessageFormats.Channel',
        CURRENT_CHANNEL: 'Pages.GuildPage.GeneralSettings.MessageFormats.CurrentChannel'
    },
    commandCategories: {
        GENERAL: 'Commands.Categories.General',
        MODERATION: 'Commands.Categories.Moderation',
        MUSIC: 'Commands.Categories.Music',
        UTILITY: 'Commands.Categories.Useful'
    },
    actionLogEvents: {
        channel_create: 'Logs.ChannelCreated',
        channel_delete: 'Logs.ChannelDeleted',
        channel_update: 'Logs.ChannelUpdated',
        emoji_create: 'Logs.EmojiCreated',
        emoji_delete: 'Logs.EmojiDeleted',
        emoji_update: 'Logs.EmojiUpdated',
        guild_ban_add: 'Logs.GuildBanAdded',
        guild_ban_remove: 'Logs.GuildBanRemoved',
        guild_member_add: 'Logs.GuildMemberAdded',
        guild_member_remove: 'Logs.GuildMemberRemoved',
        guild_member_update: 'Logs.GuildMemberUpdated',
        guild_update: 'Logs.GuildUpdated',
        invite_create: 'Logs.InviteCreated',
        invite_delete: 'Logs.InvitedDeleted',
        message_delete: 'Logs.MessageDeleted',
        message_delete_bulk: 'Logs.MessageDeletedBulk',
        message_update: 'Logs.MessageUpdated',
        role_create: 'Logs.RoleCreated',
        role_delete: 'Logs.RoleDeleted',
        role_member_add: 'Logs.RoleMemberAdded',
        role_member_remove: 'Logs.RoleMemberRemoved',
        role_update: 'Logs.RoleUpdated',
        sticker_create: 'Logs.StickerCreated',
        sticker_delete: 'Logs.StickerDeleted',
        sticker_update: 'Logs.StickerUpdated',
        thread_create: 'Logs.ThreadCreated',
        thread_delete: 'Logs.ThreadDeleted',
        thread_update: 'Logs.ThreadUpdated',
        user_update: 'Logs.UserUpdated',
        voice_connect: 'Logs.VoiceConnection',
        voice_disconnect: 'Logs.VoiceDisconnection',
        voice_move: 'Logs.VoiceMove',
        voice_server_mute: 'Logs.VoiceServerDeaf',
        voice_server_unmute: 'Logs.VoiceServerMute',
        voice_server_deaf: 'Logs.VoiceServerUndeaf',
        voice_server_undeaf: 'Logs.VoiceServerUnmute'
    },
    autoModTypes: {
        anti_caps: 'Components.AutoMod.AntiCaps',
        links_filter: 'Components.AutoMod.LinksFilter',
        newbies: 'Components.AutoMod.NewbiesModeration',
        nicknames: 'Components.AutoMod.NicknamesModeration',
        swear_filter: 'Components.AutoMod.SwearFilter',
        users_slowdown: 'Components.AutoMod.UsersSlowdown'
    },
    storeItemOptions: {
        LIMITED_QUANTITY: 'Components.EconomyStoreItem.ItemOptions.LimitedQuantity',
        TEMPORARY_REFERENCES: 'Components.EconomyStoreItem.ItemOptions.TemporaryReferences',
        CUSTOM_PURCHASE_REPLY: 'Components.EconomyStoreItem.ItemOptions.CustomPurchaseReply'
    },
    dateUnits: {
        MINUTES: 'Common.DateUnits.Minutes',
        HOURS: 'Common.DateUnits.Hours',
        DAYS: 'Common.DateUnits.Days'
    },
    automationTriggers: {
        GUILD_MEMBER_ADD: 'Logs.GuildMemberAdded',
        GUILD_MEMBER_REMOVE: 'Logs.GuildMemberRemoved',
        INTERACTION_BUTTON: 'Components.Automation.TriggerNames.InteractionButton',
        INTERACTION_SELECT_MENU: 'Components.Automation.TriggerNames.InteractionSelectMenu',
        INTERACTION_MODAL_SUBMIT: 'Components.Automation.TriggerNames.InteractionModalSubmit',
        MESSAGE_CREATE: 'Components.Automation.TriggerNames.MessageCreate',
        MESSAGE_DELETE: 'Logs.MessageDeleted',
        MESSAGE_UPDATE: 'Logs.MessageUpdated',
        ROLE_MEMBER_ADD: 'Logs.RoleMemberAdded',
        ROLE_MEMBER_REMOVE: 'Logs.RoleMemberRemoved',
        VOICE_CONNECT: 'Logs.VoiceConnection',
        VOICE_DISCONNECT: 'Logs.VoiceDisconnection'
    },
    customBehaviorComponents: {
        COMPARE_VALUES: 'Components.CustomCommand.ComponentNames.CompareValues',
        EXECUTE_CODE: 'Components.CustomCommand.ComponentNames.ExecuteCode',
        REPLY: 'Components.CustomCommand.ComponentNames.Reply',
        SEND_MESSAGE: 'Components.CustomCommand.ComponentNames.SendMessage',
        FORWARD_TO_COMMAND: 'Components.CustomCommand.ComponentNames.ForwardToCommand',
        MODIFY_ROLES: 'CaseLog.Actions.ModifyRoles',
        MODIFY_WALLET: 'Components.CustomCommand.ComponentNames.ModifyWallet',
        SHOW_MODAL: 'Components.CustomCommand.ComponentNames.ShowModal',
        OVERWRITE_CHANNEL_PERMISSIONS: 'CaseLog.Actions.OverwriteChannelPermissions'
    },
    discordPermissions: {
        CREATE_INSTANT_INVITE: 'Common.DiscordPermissions.CreateInstantInvite',
        KICK_MEMBERS: 'Common.DiscordPermissions.KickMembers',
        BAN_MEMBERS: 'Common.DiscordPermissions.BanMembers',
        ADMINISTRATOR: 'Common.DiscordPermissions.Administrator',
        MANAGE_CHANNELS: 'Common.DiscordPermissions.ManageChannels',
        MANAGE_GUILD: 'Common.DiscordPermissions.ManageGuild',
        ADD_REACTIONS: 'Common.DiscordPermissions.AddReactions',
        VIEW_AUDIT_LOG: 'ПCommon.DiscordPermissions.ViewAuditLog',
        PRIORITY_SPEAKER: 'Common.DiscordPermissions.PrioritySpeaker',
        STREAM: 'Common.DiscordPermissions.Stream',
        VIEW_CHANNEL: 'Common.DiscordPermissions.ViewChannel',
        SEND_MESSAGES: 'Common.DiscordPermissions.SendMessages',
        SEND_TTS_MESSAGES: 'Common.DiscordPermissions.SendTTSMessages',
        MANAGE_MESSAGES: 'Common.DiscordPermissions.ManageMessages',
        EMBED_LINKS: 'Common.DiscordPermissions.EmbedLinks',
        ATTACH_FILES: 'Common.DiscordPermissions.AttachFiles',
        READ_MESSAGE_HISTORY: 'Common.DiscordPermissions.ReadMessageHistory',
        MENTION_EVERYONE: 'Common.DiscordPermissions.MentionEveryone',
        USE_EXTERNAL_EMOJIS: 'Common.DiscordPermissions.UseExternalEmojis',
        VIEW_GUILD_INSIGHTS: 'Common.DiscordPermissions.ViewGuildInsights',
        CONNECT: 'Common.DiscordPermissions.Connect',
        SPEAK: 'Common.DiscordPermissions.Speak',
        MUTE_MEMBERS: 'Common.DiscordPermissions.MuteMembers',
        DEAFEN_MEMBERS: 'Common.DiscordPermissions.DeafenMembers',
        MOVE_MEMBERS: 'Common.DiscordPermissions.MoveMembers',
        USE_VAD: 'Common.DiscordPermissions.UseVAD',
        CHANGE_NICKNAME: 'Common.DiscordPermissions.ChangeNickname',
        MANAGE_NICKNAMES: 'Common.DiscordPermissions.ManageNicknames',
        MANAGE_ROLES: 'Common.DiscordPermissions.ManageRoles',
        MANAGE_WEBHOOKS: 'Common.DiscordPermissions.ManageWebhooks',
        MANAGE_EMOJIS_AND_STICKERS: 'Common.DiscordPermissions.ManageEmojisAndStickers',
        MANAGE_GUILD_EXPRESSIONS: 'Common.DiscordPermissions.ManageGuildExpressions',
        USE_APPLICATION_COMMANDS: 'Common.DiscordPermissions.UseApplicationCommands',
        REQUEST_TO_SPEAK: 'Common.DiscordPermissions.RequestToSpeak',
        MANAGE_EVENTS: 'Common.DiscordPermissions.ManageEvents',
        MANAGE_THREADS: 'Common.DiscordPermissions.ManageThreads',
        USE_PUBLIC_THREADS: 'Common.DiscordPermissions.CreatePublicThreads',
        USE_PRIVATE_THREADS: 'Common.DiscordPermissions.CreatePrivateThreads',
        USE_EXTERNAL_STICKERS: 'Common.DiscordPermissions.UseExternalStickers',
        SEND_MESSAGES_IN_THREADS: 'Common.DiscordPermissions.SendMessagesInThreads',
        START_EMBEDDED_ACTIVITIES: 'Common.DiscordPermissions.UseEmbeddedActivities',
        MODERATE_MEMBERS: 'Common.DiscordPermissions.ModerateMembers',
        VIEW_CREATOR_MONETIZATION_ANALYTICS: 'Common.DiscordPermissions.ViewCreatorMonetizationAnalytics',
        USE_SOUNDBOARD: 'Common.DiscordPermissions.UseSoundboard',
        CREATE_GUILD_EXPRESSIONS: 'Common.DiscordPermissions.CreateGuildExpressions',
        CREATE_EVENTS: 'Common.DiscordPermissions.CreateEvents',
        USE_EXTERNAL_SOUNDS: 'Common.DiscordPermissions.UseExternalSounds',
        SEND_VOICE_MESSAGES: 'Common.DiscordPermissions.SendVoiceMessages'
    },
    actions: {
        ACTION_BAN: 'CaseLog.Actions.Ban',
        ACTION_MUTE: 'CaseLog.Actions.Mute',
        ACTION_KICK: 'CaseLog.Actions.Kick',
        ACTION_WARN: 'CaseLog.Actions.Warn',
        ACTION_MODIFY_ROLES: 'CaseLog.Actions.ModifyRoles',
        ACTION_SEND_MESSAGE: 'CaseLog.Actions.SendMessage',
        ACTION_DELETE_MESSAGE: 'CaseLog.Actions.DeleteMessage',
        ACTION_RESET_VIOLATIONS: 'CaseLog.Actions.ResetViolations',
        EPHEMERAL_REPLY: 'CaseLog.Actions.EphemeralReply',
        MODIFY_ROLES: 'CaseLog.Actions.ModifyRoles',
        OVERWRITE_CHANNEL_PERMISSIONS: 'CaseLog.Actions.OverwriteChannelPermissions',
        RESTRICT_ROLES: 'CaseLog.Actions.RestrictRoles'
    },
    nicknamesModerationRemovableSymbols: {
        SPECIAL_CHARACTERS: 'Components.AutoMod.NicknamesModerationRemovableSymbols.SpecialCharacters',
        ZALGO: 'Components.AutoMod.NicknamesModerationRemovableSymbols.Zalgo',
        DIACRITICS: 'Components.AutoMod.NicknamesModerationRemovableSymbols.Diacritics',
        EMOJIS: 'Components.AutoMod.NicknamesModerationRemovableSymbols.Emojis'
    },
    compareValuesOperators: {
        EQUAL: 'Components.CustomCommand.CompareValuesOperators.Equal',
        NOT_EQUAL: 'Components.CustomCommand.CompareValuesOperators.NotEqual',
        GREATER_THAN: 'Components.CustomCommand.CompareValuesOperators.GreaterThan',
        LESS_THAN: 'Components.CustomCommand.CompareValuesOperators.LessThan',
        STARTS_WITH: 'Components.CustomCommand.CompareValuesOperators.StartsWith',
        ENDS_WITH: 'Components.CustomCommand.CompareValuesOperators.EndsWith',
        CONTAINS: 'Components.CustomCommand.CompareValuesOperators.Contains',
        NOT_CONTAINS: 'Components.CustomCommand.CompareValuesOperators.NotContains'
    },
    commandThrottlingScopes: {
        PER_USER: 'Components.SystemCommand.ThrottlingScopes.PerUser',
        PER_CHANNEL: 'Components.SystemCommand.ThrottlingScopes.PerChannel',
        PER_GUILD: 'Components.SystemCommand.ThrottlingScopes.PerGuild'
    },
    commandOptionTypes: {
        SUB_COMMAND: 'Commands.OptionTypes.SubCommand',
        SUB_COMMAND_GROUP: 'Commands.OptionTypes.SubCommandGroup',
        STRING: 'Commands.OptionTypes.String',
        INTEGER: 'Commands.OptionTypes.Integer',
        BOOLEAN: 'Commands.OptionTypes.Boolean',
        USER: 'Commands.OptionTypes.User',
        CHANNEL: 'Commands.OptionTypes.Channel',
        ROLE: 'Commands.OptionTypes.Role',
        MENTIONABLE: 'Commands.OptionTypes.Mentionable',
        NUMBER: 'Commands.OptionTypes.Number'
    },
    discordButtonStyles: {
        PRIMARY: 'Common.DiscordButtonStyles.Primary',
        SECONDARY: 'Common.DiscordButtonStyles.Secondary',
        SUCCESS: 'Common.DiscordButtonStyles.Success',
        DANGER: 'Common.DiscordButtonStyles.Danger',
        LINK: 'Common.DiscordButtonStyles.Link'
    },
    caseLogTypes: {
        BAN_ADD: 'CaseLog.CaseTypes.BanAdd',
        BAN_REMOVE: 'CaseLog.CaseTypes.BanRemove',
        KICK: 'CaseLog.CaseTypes.Kick',
        MUTE_ADD: 'CaseLog.CaseTypes.MuteAdd',
        MUTE_REMOVE: 'CaseLog.CaseTypes.MuteRemove',
        PRUNE_MESSAGES: 'CaseLog.CaseTypes.PruneMessages',
        WARN_ADD: 'CaseLog.CaseTypes.WarnAdd',
        WARN_REMOVE: 'CaseLog.CaseTypes.WarnRemove'
    },
    discordMessageTypes: {
        DEFAULT: 'Common.DiscordMessageTypes.Default',
        CHANNEL_PINNED_MESSAGE: 'Common.DiscordMessageTypes.ChannelPinnedMessage',
        GUILD_MEMBER_JOIN: 'Common.DiscordMessageTypes.GuildMemberJoin',
        USER_PREMIUM_GUILD_SUBSCRIPTION: 'Common.DiscordMessageTypes.UserPremiumGuildSubscription',
        USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1: 'Common.DiscordMessageTypes.UserPremiumGuildSubscriptionTier1',
        USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2: 'Common.DiscordMessageTypes.UserPremiumGuildSubscriptionTier2',
        USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3: 'Common.DiscordMessageTypes.UserPremiumGuildSubscriptionTier3',
        CHANNEL_FOLLOW_ADD: 'Common.DiscordMessageTypes.ChannelFollowAdd',
        THREAD_CREATED: 'Common.DiscordMessageTypes.ThreadCreated',
        REPLY: 'Common.DiscordMessageTypes.Reply'
    },
    autoVoicePositions: {
        TOP: 'Components.AutoVoice.DefaultPositions.Top',
        BOTTOM: 'Components.AutoVoice.DefaultPositions.Bottom'
    },
    textSizes: {
        h4: 'Components.ImageEditor.TextSizes.Header',
        h5: 'Components.ImageEditor.TextSizes.Header',
        h6: 'Components.ImageEditor.TextSizes.Header',
        subtitle1: 'Components.ImageEditor.TextSizes.Subtitle',
        body2: 'Components.ImageEditor.TextSizes.Body',
        caption: 'Components.ImageEditor.TextSizes.Caption'
    },
    textStyles: {
        normal: 'Components.ImageEditor.TextSizes.Body',
        italic: 'Components.ImageEditor.TextStyles.Italic'
    },
    textTransforms: {
        none: 'Common.No',
        capitalize: 'Components.ImageEditor.TextTransforms.Capitalize',
        uppercase: 'Components.ImageEditor.TextTransforms.Uppercase',
        lowercase: 'Components.ImageEditor.TextTransforms.Lowercase'
    },
    textDecorations: {
        none: 'Common.No',
        underline: 'Components.ImageEditor.TextDecorations.Underline',
        'line-through': 'Components.ImageEditor.TextDecorations.LineThrough'
    },
    textAligns: {
        center: 'Components.ImageEditor.TextAligns.Center',
        end: 'Components.ImageEditor.TextAligns.End',
        start: 'Components.ImageEditor.TextAligns.Start'
    },
    borderRadiuses: {
        none: 'Common.None',
        xs: 'Components.ImageEditor.BorderRadiuses.XS',
        sm: 'Components.ImageEditor.BorderRadiuses.SM',
        md: 'Components.ImageEditor.BorderRadiuses.MD',
        lg: 'Components.ImageEditor.BorderRadiuses.LG',
        xl: 'Components.ImageEditor.BorderRadiuses.XL',
        circle: 'Components.ImageEditor.BorderRadiuses.Circle'
    }
}
