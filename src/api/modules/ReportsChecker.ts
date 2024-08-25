import { SchemaType } from '@google/generative-ai'
import { ReportType, UserReportMetadataCategory, UserReportMetadataRecommendedAction } from '@lacunahub/lacuna-database-driver'
import { Job, Range, RecurrenceRule, scheduleJob } from 'node-schedule'
import database from '../../database'
import Logger from '../../internals/Logger'
import GeminiAPI, { defaultModelParams } from '../utility/GeminiAPI'

const generativeModel = GeminiAPI.getGenerativeModel({
    ...defaultModelParams,
    generationConfig: {
        ...defaultModelParams.generationConfig,
        responseMimeType: 'application/json',
        responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
                category: {
                    type: SchemaType.STRING,
                    enum: [
                        'AggressionAndInsult',
                        'Spam',
                        'Fraud',
                        'IncitementToDiscord',
                        'CopyrightInfringement',
                        'UnauthorizedAccess',
                        'PornographyAndObscenity',
                        'ViolenceAndAbuse',
                        'Disinformation',
                        'IllegalActivity',
                        'MultiAccounting',
                        'ViolationOfCommunityRules',
                        'DisclosureOfPersonalInformation',
                        'Meaningless',
                        'Toxicity',
                        'Other'
                    ]
                },
                recommended_action: {
                    type: SchemaType.STRING,
                    enum: ['Nothing', 'Ban', 'Kick', 'Mute', 'Warn']
                }
            },
            required: ['category', 'recommended_action']
        }
    },
    systemInstruction:
        "You're a diligent community administrator with extensive experience in managing user behavior and resolving complaints within online communities. You have a keen eye for identifying bad behavior and are committed to fostering a respectful and healthy environment for all users. Your role involves carefully assessing user complaints, determining their validity, and recommending appropriate actions in response.\n\nYour task is to evaluate a user complaint against another user. Here are the details of the complaint I received:\n- Complaint Content\n- User ID of the Complainant\n- User ID of the Accused\n\nPlease ensure to only consider complaints that exhibit clear misconduct or unacceptable behavior. Analyze the complaint thoroughly and provide a well-reasoned recommendation for actions that should be taken against the accused user based on the content provided. Your response should reflect a balanced approach while also maintaining the integrity of the community guidelines."
})

function createSchedule(): Job {
    const rule = new RecurrenceRule()
    rule.minute = 0
    rule.hour = new Range(0, 23, 6)

    return scheduleJob('reportsCheckerSchedule', rule, async () => {
        const reports = await database.reports.find({ type: ReportType.User, checked_at: null }).sort({ created_at: 1 }).limit(15)
        if (reports.length) Logger.log('[ReportsChecker] Review of complaints against users has begun')

        for (const report of reports) {
            try {
                const result = await generativeModel.generateContent(
                    `- Complaint Content: ${report.content}\n- User ID of the Complainant: ${report.complainant_id}\n- User ID of the Accused: ${report.accused_id}`
                )
                const conclusion: { category: string; recommended_action: string } = JSON.parse(result.response.text())

                await database.reports.updateOne(
                    { _id: report._id },
                    {
                        $set: {
                            checked_at: Date.now(),
                            'metadata.category': UserReportMetadataCategory[conclusion.category],
                            'metadata.recommended_action': UserReportMetadataRecommendedAction[conclusion.recommended_action]
                        }
                    }
                )
            } catch (err) {
                Logger.error('[ReportsChecker]', err)
                break
            }
        }
    })
}

export default {
    createSchedule
}
