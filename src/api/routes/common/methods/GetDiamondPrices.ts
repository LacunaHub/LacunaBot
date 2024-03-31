import { Context } from 'koa'
import database from '../../../../database'

export default async function getDiamondPrices(ctx: Context) {
    ctx.status = 200
    ctx.body = await database.getDiamondPrices()
}
