/**
 * Business Hours Utility
 * Checks if a bot should be active based on business hours settings
 */

interface BusinessHoursConfig {
    businessHoursEnabled: boolean
    businessHoursStart: string // "HH:MM"
    businessHoursEnd: string   // "HH:MM"
    workingDays: number[] | null // [0-6] where 0 = Sunday
    shabbatModeEnabled: boolean
    offlineMessage: string | null
}

/**
 * Check if current time is within business hours
 */
export function isWithinBusinessHours(config: BusinessHoursConfig): { isOpen: boolean; message?: string } {
    // If business hours not enabled, always open
    if (!config.businessHoursEnabled) {
        return { isOpen: true }
    }

    // Get current time in Israel timezone
    const now = new Date()
    const israelTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }))

    const currentDay = israelTime.getDay() // 0 = Sunday
    const currentHour = israelTime.getHours()
    const currentMinute = israelTime.getMinutes()
    const currentTimeMinutes = currentHour * 60 + currentMinute

    // Check Shabbat mode
    if (config.shabbatModeEnabled && isShabbat(israelTime)) {
        return {
            isOpen: false,
            message: config.offlineMessage || 'הבוט לא פעיל בשבת. נחזור אליך במוצאי שבת.'
        }
    }

    // Check working days
    const workingDays = config.workingDays || [0, 1, 2, 3, 4] // Default: Sun-Thu
    if (!workingDays.includes(currentDay)) {
        return {
            isOpen: false,
            message: config.offlineMessage || 'הבוט לא פעיל היום. נחזור אליך בימי העבודה.'
        }
    }

    // Check working hours
    const [startHour, startMinute] = config.businessHoursStart.split(':').map(Number)
    const [endHour, endMinute] = config.businessHoursEnd.split(':').map(Number)

    const startTimeMinutes = startHour * 60 + startMinute
    const endTimeMinutes = endHour * 60 + endMinute

    if (currentTimeMinutes < startTimeMinutes || currentTimeMinutes >= endTimeMinutes) {
        return {
            isOpen: false,
            message: config.offlineMessage || `הבוט פעיל בין ${config.businessHoursStart} ל-${config.businessHoursEnd}. נחזור אליך בשעות הפעילות.`
        }
    }

    return { isOpen: true }
}

/**
 * Simple Shabbat check
 * Shabbat: Friday sunset (~18:00) to Saturday sunset (~19:00)
 * This is a simplified check - for production, use a proper Hebrew calendar library
 */
function isShabbat(israelTime: Date): boolean {
    const day = israelTime.getDay()
    const hour = israelTime.getHours()

    // Friday after 18:00 (approximate candle lighting)
    if (day === 5 && hour >= 18) {
        return true
    }

    // Saturday before 20:00 (approximate havdalah, summer time approximation)
    if (day === 6 && hour < 20) {
        return true
    }

    return false
}
