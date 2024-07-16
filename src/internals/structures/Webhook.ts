import { RequestManager } from '@lacunahub/letsfrag'
import { REST, WebhookClient, WebhookClientData, WebhookClientOptions } from 'discord.js'
import { redis } from '../../database'

export class Webhook extends WebhookClient {
    // @ts-ignore
    public declare rest: RequestManager | REST

    constructor(data: WebhookClientData, options?: WebhookOptions) {
        super(data, options)

        const useRequestManager = options?.useRequestManager ?? true

        if (useRequestManager) {
            this.rest = new RequestManager({
                ...options?.rest,
                store: { store: redis }
            })
        } else {
            this.rest = new REST(options?.rest)
        }
    }
}

export interface WebhookOptions extends WebhookClientOptions {
    useRequestManager?: boolean
}
