import { RedisStoreAdapter } from '@lacunahub/letsfrag'
import { ConnectOptions, connect } from 'mongoose'
import { Database as QDatabase, QuickMongoOptions } from 'quickmongo'
import Payments, { PaymentAmountCurrencyCode, PaymentMetadataProduct } from './schemas/Payments'
import Reports from './schemas/Reports'
import ServerBans from './schemas/ServerBans'
import Servers from './schemas/Servers'
import Subscriptions from './schemas/Subscriptions'
import TelegramSubs from './schemas/TelegramSubs'
import TwitchSubs from './schemas/TwitchSubs'
import Users from './schemas/Users'
import ViolativeMessages from './schemas/ViolativeMessages'
import YouTubeSubs from './schemas/YouTubeSubs'

class Database {
    public db: typeof import('mongoose')
    public qdb: QDatabase

    public payments = Payments
    public reports = Reports
    public serverBans = ServerBans
    public servers = Servers
    public subscriptions = Subscriptions
    public telegramSubs = TelegramSubs
    public twitchSubs = TwitchSubs
    public users = Users
    public violativeMessages = ViolativeMessages
    public youtubeSubs = YouTubeSubs

    constructor(public options: DatabaseOptions) {}

    public async connect(): Promise<this> {
        this.db = await connect(this.options.uri, this.options.options)
        this.qdb = new QDatabase(this.options.qdb.uri, this.options.qdb.options)
        this.qdb.connect()

        return this
    }

    public async getRootUsers(): Promise<string[]> {
        let rootUsers: string[] = await this.qdb.get('rootUsers')

        if (!rootUsers) {
            rootUsers = ['258317078560243712']

            await this.qdb.set('rootUsers', rootUsers)
        }

        return rootUsers
    }

    public async getProducts(): Promise<Product[]> {
        let products: Product[] = await this.qdb.get('products')

        if (!products) {
            products = [
                {
                    type: ProductType.OneTime,
                    active: true,
                    product_id: PaymentMetadataProduct.Diamond,
                    prices: [
                        {
                            currency_code: 'TKN',
                            amount: 1,
                            sale_amount: 0
                        }
                    ],
                    tier: DiamondProductTier.OneDay
                },
                {
                    type: ProductType.OneTime,
                    active: true,
                    product_id: PaymentMetadataProduct.Diamond,
                    prices: [
                        {
                            currency_code: 'TKN',
                            amount: 7,
                            sale_amount: 0
                        }
                    ],
                    tier: DiamondProductTier.SevenDays
                },
                {
                    type: ProductType.OneTime,
                    active: true,
                    product_id: PaymentMetadataProduct.Diamond,
                    prices: [
                        {
                            currency_code: 'USD',
                            amount: 2,
                            sale_amount: 0
                        },
                        {
                            currency_code: 'RUB',
                            amount: 160,
                            sale_amount: 0
                        },
                        {
                            currency_code: 'TKN',
                            amount: 30,
                            sale_amount: 0
                        }
                    ],
                    tier: DiamondProductTier.OneMonth
                },
                {
                    type: ProductType.OneTime,
                    active: true,
                    product_id: PaymentMetadataProduct.Diamond,
                    prices: [
                        {
                            currency_code: 'USD',
                            amount: 4,
                            sale_amount: 0
                        },
                        {
                            currency_code: 'RUB',
                            amount: 320,
                            sale_amount: 0
                        }
                    ],
                    tier: DiamondProductTier.TwoMonths
                },
                {
                    type: ProductType.OneTime,
                    active: true,
                    product_id: PaymentMetadataProduct.Diamond,
                    prices: [
                        {
                            currency_code: 'USD',
                            amount: 20,
                            sale_amount: 0
                        },
                        {
                            currency_code: 'RUB',
                            amount: 1700,
                            sale_amount: 0
                        }
                    ],
                    tier: DiamondProductTier.TwelveMonths
                }
            ]

            await this.qdb.set('products', products)
        }

        return products
    }

    public async getBlockedUsers(): Promise<string[]> {
        let blockedUsers: string[] = await this.qdb.get('blockedUsers')

        if (!blockedUsers) {
            blockedUsers = []

            await this.qdb.set('blockedUsers', blockedUsers)
        }

        return blockedUsers
    }

    public async getEnv(): Promise<EnvData> {
        let env: EnvData = await this.qdb.get('env')

        if (!env) {
            env = {
                diamondForTokensDisabled: false,
                diamondForBoostsDisabled: false,
                maxAllowedDiamondBoosts: 21
            }

            await this.qdb.set('env', env)
        }

        return env
    }

    public async getVerifiedPluginRepositories() {
        let repos = await this.qdb.get<string[]>('verifiedPluginRepositories')

        if (!repos) {
            repos = []

            await this.qdb.set('verifiedPluginRepositories', repos)
        }

        return repos.map(v => {
            const [fullName, sha] = v.split('@')
            return { fullName, sha }
        })
    }

    public async getInternalData(): Promise<InternalData> {
        const rootUsers = await this.getRootUsers(),
            products = await this.getProducts(),
            blockedUsers = await this.getBlockedUsers(),
            env = await this.getEnv(),
            verifiedPluginRepositories = await this.getVerifiedPluginRepositories()
        const allowedAPIReferrers: string[] = (await this.qdb.get('allowedAPIReferrers')) || [],
            publicAPIPaths: string[] = (await this.qdb.get('publicAPIPaths')) || [],
            allowedImageHosts: string[] = (await this.qdb.get('allowedImageHosts')) || [],
            allowedMusicHosts: string[] = (await this.qdb.get('allowedMusicHosts')) || []

        return {
            rootUsers,
            products,
            blockedUsers,
            env,
            verifiedPluginRepositories,
            allowedAPIReferrers,
            publicAPIPaths,
            allowedImageHosts,
            allowedMusicHosts
        }
    }
}

export default new Database({
    uri: process.env.LCN_DB_URI,
    options: {
        dbName: 'lacuna',
        useNewUrlParser: true,
        useUnifiedTopology: true
    },
    qdb: {
        uri: process.env.LCN_DB_URI,
        options: {
            dbName: 'lcnqm',
            collectionName: 'internal-storage'
        }
    }
})

export const redisStore = new RedisStoreAdapter(process.env.LCN_REDIS_URI).setMaxListeners(0)

export interface DatabaseOptions {
    uri: string
    options: ConnectOptions
    qdb: {
        uri: string
        options: QuickMongoOptions
    }
}

export interface InternalData {
    rootUsers: string[]
    products: Product[]
    blockedUsers: string[]
    env: EnvData
    verifiedPluginRepositories: { fullName: string; sha: string }[]
    allowedAPIReferrers: string[]
    publicAPIPaths: string[]
    allowedImageHosts: string[]
    allowedMusicHosts: string[]
}

export interface EnvData {
    [key: string]: any
    diamondForTokensDisabled: boolean
    diamondForBoostsDisabled: boolean
    maxAllowedDiamondBoosts: number
    aiClosedBetaServerIds?: string[]
    aiModDisabled?: boolean
    aiModSystemInstruction?: string
    aiModPoolTTL?: number
    aiModPoolMaxMessages?: number
}

export interface BaseProduct {
    type: ProductType
    active: boolean
    product_id: PaymentMetadataProduct
    prices: ProductPrice[]
}

export enum ProductType {
    OneTime
}

export interface ProductPrice {
    currency_code: ProductPriceCurrencyCode
    amount: number
    sale_amount: number
}

export type ProductPriceCurrencyCode = Exclude<PaymentAmountCurrencyCode, 'DRC'>

export interface DiamondProduct extends BaseProduct {
    product_id: PaymentMetadataProduct.Diamond
    tier: DiamondProductTier
}

export enum DiamondProductTier {
    SixHours,
    OneDay,
    SevenDays,
    OneMonth,
    TwoMonths,
    ThreeMonths,
    FourMonths,
    FiveMonths,
    SixMonths,
    SevenMonths,
    EightMonths,
    NineMonths,
    TenMonths,
    ElevenMonths,
    TwelveMonths
}

export type Product = DiamondProduct
