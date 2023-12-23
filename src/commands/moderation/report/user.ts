import {
    ActionRowBuilder,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    UserContextMenuCommandInteraction
} from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { capitalizeFirstLetter } from '../../../internals/utility/Utils'

export default async (self: Lacuna, server: ServerDocument, interaction: UserContextMenuCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    self.cache.set(`REPORT-${interaction.targetId}-${interaction.user.id}`, {
        targetMember: interaction.targetMember,
        targetUser: interaction.targetUser
    })

    const modal = new ModalBuilder()
        .setCustomId(`REPORT-${interaction.targetId}`)
        .setTitle(t('Commands.ReportCommand.Description'))
        .addComponents([
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('REPORT-REASON')
                    .setLabel(capitalizeFirstLetter(t('Commands.Options.Reason')))
                    .setStyle(TextInputStyle.Paragraph)
                    .setMinLength(20)
                    .setMaxLength(1000)
                    .setRequired(true)
            )
        ])

    await interaction.showModal(modal)

    return true
}
