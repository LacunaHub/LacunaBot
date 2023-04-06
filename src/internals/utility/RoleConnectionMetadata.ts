import { ApplicationRoleConnectionMetadataType } from 'discord.js'

export default [
    {
        name: 'role_connections.registration_date.name',
        description: 'role_connections.registration_date.description',
        key: 'account_created_at',
        type: ApplicationRoleConnectionMetadataType.DatetimeGreaterThanOrEqual
    }
]
