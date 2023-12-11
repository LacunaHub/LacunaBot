import { ApplicationRoleConnectionMetadataType } from 'discord.js'

export default [
    {
        name: 'RoleConnections.RegistrationDate.Name',
        description: 'RoleConnections.RegistrationDate.Description',
        key: 'account_created_at',
        type: ApplicationRoleConnectionMetadataType.DatetimeGreaterThanOrEqual
    }
]
