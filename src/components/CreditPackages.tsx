'use client'

import { Zap } from 'lucide-react'
import CheckoutButton from '@/components/CheckoutButton'

const packages = [
    { credits: 500, price: 49, popular: false },
    { credits: 2000, price: 149, popular: true },
    { credits: 5000, price: 299, popular: false },
]

export default function CreditPackages() {
    return (
        <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">רכוש קרדיטים</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                    <div
                        key={pkg.credits}
                        className={`bg-white rounded-xl border-2 p-6 relative ${pkg.popular ? 'border-purple-500' : 'border-slate-200'
                            }`}
                    >
                        {pkg.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                הכי פופולרי
                            </div>
                        )}

                        <div className="flex items-center gap-2 mb-3">
                            <Zap className="text-amber-500" size={20} />
                            <h3 className="text-xl font-bold text-slate-800">
                                {pkg.credits.toLocaleString()} קרדיטים
                            </h3>
                        </div>

                        <p className="text-4xl font-bold text-slate-800 mb-1">
                            ₪{pkg.price}
                        </p>
                        <p className="text-slate-500 mb-4">
                            ₪{(pkg.price / pkg.credits).toFixed(3)} לקרדיט
                        </p>

                        <CheckoutButton
                            type="credits"
                            creditsAmount={pkg.credits}
                            className={`w-full py-3 rounded-xl font-medium transition ${pkg.popular
                                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                                }`}
                        >
                            רכוש עכשיו
                        </CheckoutButton>
                    </div>
                ))}
            </div>
        </div>
    )
}
