import { Context } from 'koa'
import database from '../../../../database'

export default async function getDiamondPrices(ctx: Context) {
    const diamondPrices = await database.getDiamondPrices()

    ctx.status = 200
    ctx.body = diamondPrices
}
