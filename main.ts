import moment, {Moment} from 'moment'


const TIME_REGEX = RegExp('/[0-9]{2}:[0-9]{2}/', 'g')


if (process.argv.length < 3) {
    throw Error("Usage: ts-node main.ts <woke-up-time> [min-wake-up-time]")
}

const currentTime = moment()
const [wokeArg, wakeArg] = [process.argv[2], process.argv[3]]

const assertTimeArg = (arg: string) => {
    if (!arg.matchAll(TIME_REGEX)) {
        throw Error(`${arg} is of incorrect format. Must be 'HH:mm'.`)
    }
}

const assertHour = (hour: number) => {
    if (hour >= 24 || hour < 0) {
        throw Error("Hours cannot be greater than or equal to 24 or less than 0.")
    }
}

const assertMinute = (minute: number) => {
    if (minute >= 60 || minute < 0) {
        throw Error("Minutes cannot be greater than or equal to 60 or less than 0.")
    }
}

const parseTimeArg = (arg: string): Moment => {
    assertTimeArg(arg)
    const [h, m] = arg.split(':').map(it => Number(it))
    assertHour(h)
    assertMinute(m)
    const time = currentTime.clone()
    time.hour(h)
    time.minute(m)
    time.seconds(0)
    time.millisecond(0)
    return time
}

// Get wokeTime
const wokeTime = parseTimeArg(wokeArg)
if (wokeTime > currentTime) wokeTime.subtract(1, 'days')

// Get wakeTime
let wakeTime: Moment | undefined = undefined
if (wakeArg) {
    wakeTime = parseTimeArg(wakeArg)
    if (wakeTime < currentTime) wakeTime.add(1, 'days')
}


const sleepcalc = (wokeTime: Moment, wakeTime?: Moment) => {
    /*
     * Assumed Equations:
     * y = x + z
     * z = (a + x) / 2
     * Derived Equations:
     * y = (3x + a) / 2
     * x = (2y - a) / 3
     */
    
    // y
    let ms_until_waking: number
    // x
    let ms_until_sleep: number
    // z
    let ms_sleep_needed: number
    // a
    const ms_since_awoke = currentTime.diff(wokeTime)
    
    // Calculate ms_until_waking(y) if wakeTime is undefined, else calculate ms_until_sleep(x).
    if (wakeTime === undefined) {
        ms_until_sleep = 0
        ms_sleep_needed = ms_since_awoke / 2
        ms_until_waking = ms_sleep_needed 
    } else {
        ms_until_waking = wakeTime.diff(currentTime)
        ms_until_sleep = (2 * ms_until_waking - ms_since_awoke) / 3
        ms_sleep_needed = (ms_since_awoke + ms_until_sleep) / 2
    }
    
    // Round hours to 1dp.
    const hours_until_sleep = Math.round((ms_until_sleep / (1000 * 60 * 60)) * 100) / 100
    const hours_sleep_needed = Math.round((ms_sleep_needed / (1000 * 60 * 60)) * 100) / 100
    
    const sleepAtTime = currentTime.clone().add(ms_until_sleep, 'ms')
    const actualWakeTime = sleepAtTime.clone().add(ms_sleep_needed, 'ms')
    
    const format = (moment: Moment) => moment.format('HH:mm')
    
    const sleepAtDesc = ms_until_sleep ? `at ${format(sleepAtTime)} (in ${hours_until_sleep}h)` : 'NOW'
    

    console.info(
        `If you go to sleep ${sleepAtDesc} you can wake up at ${format(actualWakeTime)} fully refreshed after ${hours_sleep_needed}h of sleep.`
    )
}

sleepcalc(wokeTime, wakeTime)

