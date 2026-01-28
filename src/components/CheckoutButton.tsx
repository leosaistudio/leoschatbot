'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface CheckoutButtonProps {
    type: 'subscription' | 'credits'
    planId?: string
    creditsAmount?: number
    children: React.ReactNode
    className?: string
    disabled?: boolean
}

export default function CheckoutButton({
    type,
    planId,
    creditsAmount,
    children,
    className = '',
    disabled = false,
}: CheckoutButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleCheckout = async () => {
        setLoading(true)

        try {
            const res = await fetch('/api/payments/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    planId,
                    creditsAmount,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                alert(data.error || 'שגיאה ביצירת תשלום')
                return
            }

            // Redirect to YaadPay payment page
            window.location.href = data.paymentUrl

        } catch (error) {
            console.error('Checkout error:', error)
            alert('שגיאה בתהליך התשלום')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleCheckout}
            disabled={disabled || loading}
            className={`${className} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            {loading ? (
                <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    מעבד...
                </span>
            ) : (
                children
            )}
        </button>
    )
}
