const EPOCH = new Date('2020-09-05T00:00:00.000Z').getTime()
let INCREMENT = BigInt(0)

export function generateSnowflake(timestamp: number | Date = Date.now()) {
    if (timestamp instanceof Date) timestamp = timestamp.getTime()
    if (typeof timestamp !== 'number' || isNaN(timestamp)) throw new TypeError('"timestamp" argument must be a number')

    if (INCREMENT >= 4095n) INCREMENT = BigInt(0)

    return ((BigInt(timestamp - EPOCH) << 22n) | (1n << 17n) | INCREMENT++).toString()
}

export function getTimestampFromSnowflake(snowflake: string) {
    return Number(BigInt(snowflake) >> 22n) + EPOCH
}
