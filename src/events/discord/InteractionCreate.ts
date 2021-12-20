import { ButtonInteraction, CommandInteraction, ContextMenuInteraction } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { buttonPressed } from '../../internals/structures/Giveaway'
import { resolveObjectPath } from '../../internals/utility/Utils'

const handler = async (self: Lacuna, interaction: CommandInteraction | ContextMenuInteraction | ButtonInteraction) => {
    if (!interaction.inGuild() || interaction.inRawGuild()) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: interaction.guildId })

    if (interaction.isCommand()) {
        const command = self.commands.find(c => c.is_slash_command && c.name == interaction.commandName)

        if (command) await command.executeSlash(server, interaction)
    }

    if (interaction.isContextMenu()) {
        const locale = self.translator.locale(server.locale)

        const command = self.commands.find(c => (c.is_message_command || c.is_user_command) && resolveObjectPath(c.pretty_name, locale) == interaction.commandName)

        if (command) await command.executeContext(server, interaction)
    }

    if (interaction.isButton()) {
        if (/GIVEAWAY\-\d+/.test(interaction.customId)) {
            await buttonPressed(self, server, interaction)
        }
    }
}

export default {
    name: 'interactionCreate',
    handler
}