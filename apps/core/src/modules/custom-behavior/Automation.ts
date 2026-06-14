import {
    ServerDocument,
    ServerModulesAutomation,
    ServerModulesAutomationOptions,
    ServerModulesAutomationTriggers,
    ServerModulesCustomCommandScript,
    ServerModulesCustomCommandScriptLanguages
} from '@/database/schemas/Servers'
import Logger from '@/utility/Logger'
import {
    AnySelectMenuInteraction,
    ButtonInteraction,
    Guild,
    GuildMember,
    GuildTextBasedChannel,
    Message,
    MessageComponentInteraction,
    ModalSubmitInteraction,
    User,
    VoiceState
} from 'discord.js'
import { Context, Isolate } from 'isolated-vm'
import { Database as QDatabase } from 'quickmongo'
import {
    convertComponentsToScript,
    extendStorage,
    runScript,
    serializeChannel,
    serializeGuild,
    serializeMember,
    serializeMessage,
    serializeVoiceState
} from '.'
import Lacuna from '../../internals/Lacuna'
import { snakeToPascalCase } from '../../internals/utility/Utils'

export default class Automation {
    public self: Lacuna
    public server: ServerDocument
    public automation: ServerModulesAutomation
    public guild: Guild
    public eventParams: AutomationEventParams
    public storage: QDatabase
    public usedPatterns: string[]
    public usedFunctions: string[]
    public isolate: Isolate

    constructor(
        self: Lacuna,
        server: ServerDocument,
        automation: ServerModulesAutomation,
        eventParams: AutomationEventParams
    ) {
        this.self = self

        this.server = server

        this.automation = automation

        this.guild = eventParams.guild

        this.eventParams = eventParams

        this.storage = new this.self.db.qdb.table('public-storage')

        const isolateState =
            this.self.isolates.get(this.guild.id) ??
            this.self.isolates
                .set(this.guild.id, {
                    value: new Isolate({
                        memoryLimit: 8,
                        onCatastrophicError: message => Logger.error({ message }, 'ivm catastrophic error')
                    }),
                    lastUsed: Date.now()
                })
                .get(this.guild.id)

        isolateState.lastUsed = Date.now()
        this.isolate = isolateState.value

        this.usedPatterns = []

        this.usedFunctions = []
    }

    public async getGlobalValues() {
        const { channel, interaction, member, message, voiceState } = this.eventParams

        return {
            channel: channel ? serializeChannel(channel) : undefined,
            guild: serializeGuild(this.guild),
            interaction: interaction
                ? {
                      customId: interaction.customId,
                      fields:
                          'fields' in interaction
                              ? interaction.fields.fields.map(v => ({
                                    customId: v.customId,
                                    value: 'value' in v ? v.value : null
                                }))
                              : undefined,
                      guildLocale: interaction.guildLocale,
                      id: interaction.id,
                      locale: interaction.locale,
                      values: 'values' in interaction ? interaction.values : undefined
                  }
                : undefined,
            member: member ? serializeMember(member) : undefined,
            message: message ? serializeMessage(message) : undefined,
            voiceState: voiceState ? serializeVoiceState(voiceState) : undefined
        }
    }

    async execute() {
        const ctx = this.isolate.createContextSync()
        ctx.global.setSync('global', ctx.global.derefInto())

        const globalValues = await this.getGlobalValues()

        for (const value of Object.keys(globalValues)) {
            ctx.global.setSync(value, globalValues[value], { copy: true })
        }

        extendStorage(this, ctx, this.server._id)

        if ('scripts' in this.automation) await this.executeScripts(ctx, this.automation.scripts)
        else if ('components' in this.automation) {
            const script = convertComponentsToScript(this.automation.components)
            await this.executeScripts(ctx, [{ name: null, language: 1, code: script }])
        }

        this.self.logger.info(
            { guildId: this.guild.id, userId: globalValues.member.user.id, usedPatterns: this.usedPatterns },
            'automation execution'
        )
        this.self.emit('moduleExecution', {
            guildId: this.guild.id,
            targetId: globalValues.member.user.id,
            module: 'Automation',
            category: snakeToPascalCase(this.automation.trigger)
        })

        ctx.release()

        return true
    }

    private async executeScripts(ctx: Context, scripts: ServerModulesCustomCommandScript[]) {
        scripts = scripts
            .filter(v => v.language === ServerModulesCustomCommandScriptLanguages.JavaScript && v.code.length > 0)
            .slice(0, this.server.premium.available ? 10 : 1)
        const maxScriptLength = this.server.premium.available ? 20_000 : 2000

        for (const script of scripts) {
            try {
                await runScript(this, ctx, script.code, { throwError: true, maxScriptLength })
            } catch (err) {
                break
            }
        }
    }

    public useFunction(name: string) {
        this.usedFunctions.push(name)
        return this.usedFunctions.filter(i => i === name).length
    }

    public static async handleEvent(
        event: ServerModulesAutomationTriggers,
        self: Lacuna,
        server: ServerDocument,
        signal: AutomationSignal,
        options: AutomationOptions = {}
    ) {
        const ams = server.modules.automation
            .slice(0, server.premium.available ? 20 : 2)
            .filter(i => i.trigger === event && !i.options.includes(ServerModulesAutomationOptions.Disabled))

        if (ams.length) {
            if ('customId' in signal) {
                signal['customId' as any] = signal.customId.replace('UD-', '')
            }

            const shouldOverwriteProps = !!Object.keys(options.overwriteSignalProps ?? {}).length
            if (shouldOverwriteProps) {
                signal = Object.create(signal)

                for (const prop of Object.keys(options.overwriteSignalProps)) {
                    signal[prop] = options.overwriteSignalProps[prop]
                }
            }

            let eventParams: AutomationEventParams
            if ('avatar' in signal) {
                eventParams = {
                    guild: signal.guild,
                    channel: signal.guild.systemChannel,
                    member: signal
                }
            } else if ('customId' in signal) {
                eventParams = {
                    guild: signal.guild,
                    channel: signal.channel,
                    member: signal.member,
                    interaction: signal
                }
            } else if ('content' in signal) {
                let member = signal.member
                if (!member) member = await signal.guild.members.fetch(signal.author.id)

                eventParams = {
                    guild: signal.guild,
                    channel: signal.channel,
                    member,
                    message: signal
                }
            } else if ('sessionId' in signal) {
                eventParams = {
                    guild: signal.guild,
                    channel: signal.channel,
                    member: signal.member,
                    voiceState: signal
                }
            }

            for (const automation of ams) {
                const am = new Automation(self, server, automation, eventParams)
                await am.execute()
            }
        }
    }
}

export interface AutomationEventParams {
    guild: Guild
    channel: GuildTextBasedChannel
    member: GuildMember
    interaction?: MessageComponentInteraction<'cached'> | ModalSubmitInteraction<'cached'>
    message?: Message<true>
    voiceState?: VoiceState
}

export type AutomationSignal =
    | GuildMember
    | ButtonInteraction<'cached'>
    | AnySelectMenuInteraction<'cached'>
    | ModalSubmitInteraction<'cached'>
    | Message<true>
    | VoiceState

export interface MessageReactionAutomationSignal {
    message: Message<true>
    emoji: string
    count: number
    userId: User
}

export type AutomationOptions = {
    overwriteSignalProps?: Record<string, any>
}
