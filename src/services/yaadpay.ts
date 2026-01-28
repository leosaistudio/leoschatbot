/**
 * YaadPay Payment Gateway Service
 * 
 * API Documentation: https://yaadpay.docs.apiary.io/
 * 
 * Test Credentials:
 * - Masof: 0010131918
 * - PassP: yaad
 * - KEY: 7110eda4d09e062aa5e4a390b0a572ac0d2c0220
 */

import crypto from 'crypto'

// Environment configuration
const YAADPAY_CONFIG = {
    apiUrl: process.env.YAADPAY_API_URL || 'https://icom.yaad.net/p/',
    masof: process.env.YAADPAY_MASOF || '0010131918',
    passP: process.env.YAADPAY_PASSP || 'yaad',
    apiKey: process.env.YAADPAY_API_KEY || '7110eda4d09e062aa5e4a390b0a572ac0d2c0220',
    testMode: process.env.YAADPAY_TEST_MODE === 'true' || process.env.NODE_ENV !== 'production',
}

interface CreatePaymentOptions {
    amount: number
    orderId: string
    description: string
    clientName: string
    clientEmail: string
    clientPhone?: string
    successUrl: string
    cancelUrl: string
    pageLang?: 'HEB' | 'ENG'
    // For recurring payments (הוראות קבע)
    recurring?: {
        payments: number // Number of payments (0 = unlimited)
        frequency: 'monthly' // Currently only monthly is supported
    }
}

interface PaymentCallbackData {
    Id: string
    CCode: string
    Amount: string
    ACode: string
    Order: string
    Fild1?: string
    Fild2?: string
    Fild3?: string
    Sign?: string
    hkId?: string  // For recurring payments
    Tmonth?: string
    Tyear?: string
    L4digit?: string
    Token?: string
    Errcode?: string
    Errdesc?: string
}

/**
 * Generate signature for API requests
 */
function generateSignature(params: Record<string, string>): string {
    const sortedKeys = Object.keys(params).sort()
    const signString = sortedKeys.map(key => `${key}=${params[key]}`).join('&')
    return crypto.createHash('sha256')
        .update(signString + YAADPAY_CONFIG.apiKey)
        .digest('hex')
}

/**
 * Create a payment URL for redirecting user to YaadPay payment page
 */
export function createPaymentUrl(options: CreatePaymentOptions): string {
    const baseUrl = YAADPAY_CONFIG.apiUrl

    const params: Record<string, string> = {
        action: 'pay',
        Masof: YAADPAY_CONFIG.masof,
        PassP: YAADPAY_CONFIG.passP,
        Amount: options.amount.toFixed(2),
        Coin: '1', // 1 = ILS
        Order: options.orderId,
        Info: options.description,
        ClientName: options.clientName,
        email: options.clientEmail,
        PageLang: options.pageLang || 'HEB',
        UTF8: 'True',
        UTF8out: 'True',
        MoreData: 'True',
        sendemail: 'True',
        Pritim: 'True',
        tmp: '1',
        UserId: '000000000',
        phone: options.clientPhone || '',
    }

    // Add recurring payment params if specified (הוראות קבע)
    if (options.recurring) {
        params['J'] = options.recurring.payments.toString()
        params['HK'] = 'True'
        params['Tash'] = '1'
    }

    // Sort parameters alphabetically (required for signature)
    const sortedKeys = Object.keys(params).sort()
    const sortedQueryString = sortedKeys
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&')

    // Generate signature: sorted query string + API Key, then SHA256
    const signData = sortedQueryString + YAADPAY_CONFIG.apiKey
    const signature = crypto.createHash('sha256').update(signData).digest('hex')

    return `${baseUrl}?${sortedQueryString}&signature=${signature}`
}

/**
 * Verify callback signature from YaadPay
 */
export function verifyCallback(data: PaymentCallbackData): boolean {
    if (!data.Sign) return false

    // Rebuild signature
    const params: Record<string, string> = {
        Id: data.Id || '',
        CCode: data.CCode || '',
        Amount: data.Amount || '',
        ACode: data.ACode || '',
        Order: data.Order || '',
    }

    const expectedSign = generateSignature(params)
    return data.Sign === expectedSign
}

/**
 * Parse callback data from YaadPay
 */
export function parseCallback(searchParams: URLSearchParams): PaymentCallbackData {
    return {
        Id: searchParams.get('Id') || '',
        CCode: searchParams.get('CCode') || '',
        Amount: searchParams.get('Amount') || '',
        ACode: searchParams.get('ACode') || '',
        Order: searchParams.get('Order') || '',
        Fild1: searchParams.get('Fild1') || undefined,
        Fild2: searchParams.get('Fild2') || undefined,
        Fild3: searchParams.get('Fild3') || undefined,
        Sign: searchParams.get('Sign') || undefined,
        hkId: searchParams.get('hkId') || undefined,
        Tmonth: searchParams.get('Tmonth') || undefined,
        Tyear: searchParams.get('Tyear') || undefined,
        L4digit: searchParams.get('L4digit') || undefined,
        Token: searchParams.get('Token') || undefined,
        Errcode: searchParams.get('Errcode') || undefined,
        Errdesc: searchParams.get('Errdesc') || undefined,
    }
}

/**
 * Check if payment was successful
 */
export function isPaymentSuccessful(data: PaymentCallbackData): boolean {
    // CCode 0 = success
    return data.CCode === '0' && !!data.Id && !!data.ACode
}

/**
 * Get error message from callback
 */
export function getErrorMessage(data: PaymentCallbackData): string {
    if (data.CCode === '0') return ''

    const errorMessages: Record<string, string> = {
        '1': 'כרטיס אשראי לא תקין',
        '2': 'כרטיס חסום',
        '3': 'שגיאה בתקשורת',
        '4': 'העסקה נדחתה',
        '5': 'חריגה מהמסגרת',
        '6': 'CVV לא תקין',
        '7': 'תוקף לא תקין',
        '999': 'העסקה בוטלה על ידי המשתמש',
    }

    return errorMessages[data.CCode] || data.Errdesc || 'שגיאה לא ידועה'
}

/**
 * Create order ID with prefix
 */
export function generateOrderId(prefix: string = 'ORD'): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `${prefix}-${timestamp}-${random}`.toUpperCase()
}

export const yaadpay = {
    createPaymentUrl,
    verifyCallback,
    parseCallback,
    isPaymentSuccessful,
    getErrorMessage,
    generateOrderId,
    config: YAADPAY_CONFIG,
}

export default yaadpay
