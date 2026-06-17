import database from '@/database/index.js'
import {
    type ReportDocument,
    ReportType,
    type UserReportDocument,
    UserReportMetadataCategory
} from '@/database/schemas/Reports.js'
import { type Context } from 'koa'
import { type FilterQuery } from 'mongoose'

export default async function getUserReports(ctx: Context) {
    const userId = ctx.params.userId
    let page = Math.abs(+ctx.query.page! || 0),
        limit = Math.abs(+ctx.query.limit! || 100)

    if (limit < 2) limit = 2
    else if (limit > 100) limit = 100

    const filterQuery: FilterQuery<ReportDocument> = {
        type: ReportType.User,
        accused_id: userId,
        checked_at: { $ne: null },
        'metadata.category': { $exists: true, $ne: UserReportMetadataCategory.Meaningless }
    }

    const reports = (await database.reports
            .find(filterQuery)
            .sort({ created_at: 1 })
            .skip(limit * page)
            .limit(limit)) as UserReportDocument[],
        reportCount = await database.reports.countDocuments(filterQuery)

    ctx.status = 200
    ctx.body = {
        page_count: Math.ceil(reportCount / limit),
        result_count: reportCount,
        results: reports.map(v => {
            return {
                id: v._id,
                content: v.content,
                checked_at: v.checked_at,
                category: v.metadata.category,
                created_at: v.created_at
            }
        })
    }
}
