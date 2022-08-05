import Lacuna from '../Lacuna'

export default class Event {
    public self: Lacuna
    public name: string
    public once: boolean
    public initial: boolean
    public handler: EventOptions['handler']

    constructor(self: Lacuna, options: EventOptions) {
        this.self = self

        this.name = options.name

        this.once = Boolean(options.once)

        this.initial = Boolean(options.initial)

        this.handler = options.handler

        this.once ? this.self.once(this.name, this.handler.bind(null, this.self)) : this.self.on(this.name, this.handler.bind(null, this.self))

        this.self.events.set(this.name, this)
    }
}

export interface EventOptions {
    name: string
    once?: boolean
    initial?: boolean
    handler(self: Lacuna, ...args: any[]): Promise<boolean>
}
