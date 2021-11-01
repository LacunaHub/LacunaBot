const { buttonPressed } = require('../../internals/structures/Giveaway')
const { resolveObjectPath } = require('../../internals/utility/Utils')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').CommandInteraction | import('discord.js').ContextMenuInteraction | import('discord.js').ButtonInteraction} interaction
 */
const handler = async (self, interaction) => {
    if (!interaction.inGuild() || interaction.inRawGuild()) return false

    const server = await self.db.servers.fetch({ _id: interaction.guild })

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

module.exports = {
    name: 'interactionCreate',
    handler
}