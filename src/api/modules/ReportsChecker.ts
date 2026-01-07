import { ReportType, UserReportMetadataCategory, UserReportMetadataRecommendedAction } from '@/database/schemas/Reports'
import { SchemaType } from '@google/generative-ai'
import { Job, Range, RecurrenceRule, scheduleJob } from 'node-schedule'
import database from '../../database'
import Logger from '../../internals/Logger'
import { parseJSON } from '../../internals/utility/Utils'
import GeminiAPI, { defaultModelParams } from '../utility/GeminiAPI'

const generativeModel = GeminiAPI.getGenerativeModel({
    ...defaultModelParams,
    generationConfig: {
        ...defaultModelParams.generationConfig,
        responseMimeType: 'application/json',
        responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
                reports: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            report_id: {
                                type: SchemaType.STRING
                            },
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
                        required: ['report_id', 'category', 'recommended_action']
                    }
                }
            }
        }
    },
    systemInstruction:
        "You're a diligent community administrator with extensive experience in managing user behavior and resolving complaints within online communities. You have a keen eye for identifying bad behavior and are committed to fostering a respectful and healthy environment for all users. Your role involves carefully assessing user complaints, determining their validity, and recommending appropriate actions in response.\n\nYour task is to evaluate a user complaint against another user.\n\nPlease ensure to only consider complaints that exhibit clear misconduct or unacceptable behavior. Analyze the complaint thoroughly and provide a well-reasoned recommendation for actions that should be taken against the accused user based on the content provided. Your response should reflect a balanced approach while also maintaining the integrity of the community guidelines."
})

function createSchedule(): Job {
    const rule = new RecurrenceRule()
    rule.minute = 0
    rule.hour = new Range(0, 23, 6)

    return scheduleJob('reportsCheckerSchedule', rule, async () => {
        const reports = await database.reports.find({ type: ReportType.User, checked_at: null }).sort({ created_at: 1 }).limit(15),
            lastReport = reports.pop()

        if (!lastReport) return null
        if (reports.length) Logger.log('[ReportsChecker] Review of complaints against users has begun')

        const chatSession = generativeModel.startChat({
            history: reports.map(v => {
                return {
                    role: 'user',
                    parts: [
                        {
                            text: `Report ID: ${v._id}\nComplainant ID: ${v.complainant_id}\nAccused ID: ${v.accused_id}\nComplaint content: ${v.content}\n`
                        }
                    ]
                }
            })
        })

        const result = await chatSession.sendMessage(
                `Report ID: ${lastReport._id}\nComplainant ID: ${lastReport.complainant_id}\nAccused ID: ${lastReport.accused_id}\nComplaint content: ${lastReport.content}\n`
            ),
            resultText = result.response.text(),
            resultJSON = parseJSON<ModelResponse>(resultText)

        if (Array.isArray(resultJSON?.reports)) {
            for (const report of resultJSON.reports) {
                await database.reports.updateOne(
                    { _id: report.report_id },
                    {
                        $set: {
                            checked_at: Date.now(),
                            'metadata.category': UserReportMetadataCategory[report.category],
                            'metadata.recommended_action': UserReportMetadataRecommendedAction[report.recommended_action]
                        }
                    }
                )
            }
        }
    })
}

export default {
    createSchedule
}

export interface ModelResponse {
    reports: ModelResponseReport[]
}

export interface ModelResponseReport {
    report_id: string
    category: string
    recommended_action: string
}
