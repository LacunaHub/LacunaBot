import { ReportDocument, ReportType, UserReportMetadataCategory } from '@/database/schemas/Reports'
import { Context } from 'koa'
import { FilterQuery } from 'mongoose'
import database from '../../../../database'

export default async function getCurrentUserSubmittedReports(ctx: Context) {
    const userId = ctx.params.userId
    let page = Math.abs(+ctx.query.page || 0),
        limit = Math.abs(+ctx.query.limit || 100)

    if (limit < 2) limit = 2
    else if (limit > 100) limit = 100

    const filterQuery: FilterQuery<ReportDocument> = { complainant_id: userId }
    const reports = await database.reports
            .find(filterQuery)
            .sort({ created_at: 1 })
            .skip(limit * page)
            .limit(limit),
        reportCount = await database.reports.countDocuments(filterQuery)

    ctx.status = 200
    ctx.body = {
        page_count: Math.ceil(reportCount / limit),
        result_count: reportCount,
        results: reports.map(v => {
            const value = {
                id: v._id,
                type: ReportType[v.type],
                accused_id: v.accused_id,
                content: v.content,
                checked_at: v.checked_at,
                created_at: v.created_at
            }

            if (v.type === ReportType.Guild) {
                return {
                    ...value,
                    reported_categories: v.metadata.reported_categories,
                    violations_are_detected: v.metadata.violations_are_detected
                }
            } else if (v.type === ReportType.User) {
                return {
                    ...value,
                    from_guild_id: v.metadata.from_guild_id,
                    category: UserReportMetadataCategory[v.metadata.category]
                }
            }
        })
    }
}
