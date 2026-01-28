import Link from 'next/link'
import { Bot, Zap, Shield, Globe, Users, MessageSquare, ArrowLeft, CheckCircle } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🤖</span>
            <span className="text-2xl font-bold text-white">ChatBot AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-white/80 hover:text-white transition"
            >
              התחברות
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 bg-white text-purple-900 font-medium rounded-lg hover:bg-purple-100 transition"
            >
              התחל בחינם
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur rounded-full text-purple-200 text-sm mb-6">
            🎉 100 קרדיטים חינם בהרשמה!
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            צ'אטבוט חכם
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {' '}לאתר שלך
            </span>
          </h1>
          <p className="text-xl text-purple-200 mb-10 max-w-2xl mx-auto">
            הבוט שלנו לומד את תוכן האתר שלך ומגיב לגולשים בזמן אמת.
            אוטומציה חכמה שאוספת לידים ומגדילה מכירות.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105"
            >
              התחל בחינם
              <ArrowLeft size={20} />
            </Link>
            <Link
              href="#demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur text-white font-semibold rounded-xl hover:bg-white/20 transition"
            >
              צפה בהדגמה
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          למה לבחור ב-ChatBot AI?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap className="text-yellow-400" size={28} />,
              title: 'הגדרה ב-5 דקות',
              desc: 'הוסף קישור לאתר וקבל צ\'אטבוט מאומן מיד'
            },
            {
              icon: <Shield className="text-green-400" size={28} />,
              title: 'AI מתקדם',
              desc: 'מבוסס GPT-4 עם הבנה מעמיקה של תוכן האתר'
            },
            {
              icon: <Globe className="text-blue-400" size={28} />,
              title: 'עברית מושלמת',
              desc: 'תמיכה מלאה בעברית ו-RTL מובנה'
            },
            {
              icon: <Users className="text-pink-400" size={28} />,
              title: 'איסוף לידים',
              desc: 'טופס חכם לאיסוף פרטי לקוחות פוטנציאליים'
            },
            {
              icon: <MessageSquare className="text-purple-400" size={28} />,
              title: 'צ\'אט חי',
              desc: 'השתלט על השיחה בכל רגע ודבר עם הגולש'
            },
            {
              icon: <Bot className="text-orange-400" size={28} />,
              title: 'התאמה אישית',
              desc: 'צבעים, מיקום ועיצוב שמתאימים לאתר שלך'
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition"
            >
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-purple-200">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">
          תמחור פשוט
        </h2>
        <p className="text-purple-200 text-center mb-12">
          שלם רק על מה שאתה משתמש
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { name: 'Starter', price: 99, messages: '500', bots: '1', features: ['צ\'אטבוט בסיסי', 'איסוף לידים', 'תמיכה במייל'] },
            { name: 'Pro', price: 249, messages: '2,000', bots: '5', features: ['כל התכונות של Starter', 'צ\'אט חי', 'התראות בזמן אמת', 'אנליטיקה מתקדמת'], popular: true },
            { name: 'Business', price: 499, messages: '10,000', bots: '∞', features: ['כל התכונות של Pro', 'White Label', 'API מלא', 'תמיכה VIP'] },
          ].map((plan, i) => (
            <div
              key={i}
              className={`relative bg-white/5 backdrop-blur border rounded-2xl p-8 ${plan.popular ? 'border-purple-500 scale-105' : 'border-white/10'
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-full">
                  הכי פופולרי
                </div>
              )}
              <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">₪{plan.price}</span>
                <span className="text-purple-200">/חודש</span>
              </div>
              <div className="text-sm text-purple-200 mb-6">
                <p>{plan.messages} הודעות AI</p>
                <p>{plan.bots} בוטים</p>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-purple-100">
                    <CheckCircle className="text-green-400" size={16} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`block w-full py-3 text-center font-medium rounded-lg transition ${plan.popular
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                    : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
              >
                התחל עכשיו
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            מוכן להגדיל את המכירות?
          </h2>
          <p className="text-purple-100 mb-8 max-w-xl mx-auto">
            הצטרף לאלפי עסקים שכבר משתמשים ב-ChatBot AI לשיפור השירות ללקוחות
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-900 font-semibold rounded-xl hover:bg-purple-100 transition"
          >
            התחל בחינם עכשיו
            <ArrowLeft size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-10 border-t border-white/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <span className="text-lg font-bold text-white">ChatBot AI</span>
          </div>
          <p className="text-purple-200 text-sm">
            © 2024 ChatBot AI. כל הזכויות שמורות.
          </p>
        </div>
      </footer>
    </div>
  )
}
