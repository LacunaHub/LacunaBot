import { RequestManager } from '@lacunahub/letsfrag'
import { REST, WebhookClient, WebhookClientData, WebhookClientOptions } from 'discord.js'

export class Webhook extends WebhookClient {
    // @ts-ignore
    public declare rest: RequestManager | REST

    constructor(data: WebhookClientData, options?: WebhookOptions) {
        super(data, options)

        const useRequestManager = options?.useRequestManager ?? true

        if (useRequestManager) {
            this.rest = new RequestManager({
                ...options?.rest,
                store: { uri: process.env.LCN_REDIS_URI }
            })
        } else {
            this.rest = new REST(options.rest)
        }
    }
}

export interface WebhookOptions extends WebhookClientOptions {
    useRequestManager?: boolean
}
