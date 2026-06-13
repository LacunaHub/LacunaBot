import { join } from 'path'
import { DestinationStream, multistream, pino, StreamEntry, transport } from 'pino'
import pinoLoki from 'pino-loki'

/**
 * Configure logging streams for console output, file rotation, and optional Grafana Loki
 */
const streams: (DestinationStream | StreamEntry)[] = [
    // Pretty-formatted console output for development
    {
        level: 'trace',
        stream: transport({
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
                ignore: 'pid,hostname'
            }
        })
    },
    // File-based logging with daily rotation and size limits
    {
        level: 'trace',
        stream: transport({
            target: 'pino-roll',
            options: {
                file: join('logs', 'trace'),
                frequency: 'daily', // Rotate daily
                size: '50m', // Max 50MB per file
                mkdir: true, // Create logs directory if it doesn't exist
                extension: 'log',
                dateFormat: 'yyyy-MM-dd-hh-mm',
                limit: {
                    count: 30 // Keep last 30 log files
                }
            }
        })
    }
]

// Parse Grafana Loki configuration from environment variable
// Format: "host" or "host;username;password" (with basic auth)
const lokiConfig = process.env.GRAFANA_LOKI?.split(';').map(v => v.trim()) ?? []
const [lokiHost, lokiUsername, lokiPassword] = lokiConfig

// Add Grafana Loki stream if host is provided
if (lokiHost) {
    const lokiOptions: Parameters<typeof pinoLoki>[0] = {
        batching: {
            interval: 5
        }, // Batch logs for better performance
        host: lokiHost,
        labels: { env: process.env.NODE_ENV || 'dev' }
    }

    // Add basic auth if credentials are provided
    if (lokiUsername && lokiPassword) {
        lokiOptions.basicAuth = {
            username: lokiUsername,
            password: lokiPassword
        }
    }

    streams.push({ level: 'trace', stream: pinoLoki(lokiOptions) })
}

/**
 * Configured Pino logger instance with multiple output streams
 * - Console output with pretty formatting for development
 * - Daily rotating file logs with size limits
 * - Optional Grafana Loki integration for centralized logging
 */
export default pino({ level: 'trace' }, multistream(streams))
