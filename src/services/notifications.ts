import { prisma } from '@/lib/db'

interface NotificationPayload {
    conversationId: string
    botId: string
    botName: string
    visitorId: string
    visitorName?: string
    firstMessage: string
    pageUrl?: string
    dashboardUrl: string
}

/**
 * Send notification when a new conversation starts
 */
export async function notifyNewConversation(
    userId: string,
    payload: NotificationPayload
): Promise<void> {
    // Get user settings
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            email: true,
            name: true,
            notifyEmail: true,
            whatsappNumber: true,
            webhookUrl: true,
        },
    })

    if (!user) return

    // Send email notification
    if (user.notifyEmail && user.email) {
        await sendEmailNotification(user.email, user.name, payload)
    }

    // Send webhook (for Make/Zapier/n8n)
    if (user.webhookUrl) {
        await sendWebhookNotification(user.webhookUrl, payload, user.whatsappNumber)
    }
}

/**
 * Send email notification using Postmark API
 */
async function sendEmailNotification(
    email: string,
    userName: string | null,
    payload: NotificationPayload
): Promise<void> {
    const postmarkToken = process.env.POSTMARK_SERVER_TOKEN

    if (postmarkToken) {
        try {
            const response = await fetch('https://api.postmarkapp.com/email', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Postmark-Server-Token': postmarkToken,
                },
                body: JSON.stringify({
                    From: process.env.EMAIL_FROM || 'no-reply@leos.es',
                    To: email,
                    Subject: `💬 שיחה חדשה ב-${payload.botName}`,
                    HtmlBody: generateEmailHtml(userName, payload),
                    MessageStream: 'outbound',
                }),
            })

            if (!response.ok) {
                const errorBody = await response.text()
                console.error('Failed to send email via Postmark:', errorBody)
            } else {
                console.log('Email notification sent successfully to:', email)
            }
        } catch (error) {
            console.error('Email notification error:', error)
        }
    } else {
        console.log('Email notification skipped - POSTMARK_SERVER_TOKEN not configured')
    }
}

/**
 * Generate HTML email content
 */
function generateEmailHtml(userName: string | null, payload: NotificationPayload): string {
    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; direction: rtl; text-align: right;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); direction: rtl; text-align: right;">
        <div style="background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 24px; text-align: center;">
          <h1 style="margin:0; direction: rtl;">💬 שיחה חדשה!</h1>
        </div>
        <div style="padding: 24px; direction: rtl; text-align: right;">
          <p style="direction: rtl; text-align: right;">שלום ${userName || 'משתמש יקר'},</p>
          <p style="direction: rtl; text-align: right;">מישהו התחיל שיחה עם הבוט <strong>${payload.botName}</strong>:</p>
          
          <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin: 16px 0; direction: rtl; text-align: right;">
            <strong>הודעה ראשונה:</strong><br>
            "${payload.firstMessage}"
          </div>
          
          ${payload.pageUrl ? `<p style="direction: rtl; text-align: right;"><small>מדף: ${payload.pageUrl}</small></p>` : ''}
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="${payload.dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">צפה בשיחה והשתלט</a>
          </div>
        </div>
        <div style="text-align: center; padding: 16px; color: #888; font-size: 12px;">
          ChatBot AI - מערכת צ'אטבוט חכמה
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Send webhook to Make/Zapier/n8n for WhatsApp or other integrations
 */
async function sendWebhookNotification(
    webhookUrl: string,
    payload: NotificationPayload,
    whatsappNumber: string | null
): Promise<void> {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event: 'new_conversation',
                timestamp: new Date().toISOString(),
                whatsappNumber: whatsappNumber || null,
                conversation: {
                    id: payload.conversationId,
                    botId: payload.botId,
                    botName: payload.botName,
                    visitorId: payload.visitorId,
                    visitorName: payload.visitorName,
                    firstMessage: payload.firstMessage,
                    pageUrl: payload.pageUrl,
                    dashboardUrl: payload.dashboardUrl,
                },
            }),
        })

        if (!response.ok) {
            console.error('Webhook notification failed:', response.status)
        }
    } catch (error) {
        console.error('Webhook notification error:', error)
    }
}

/**
 * Send conversation summary email when conversation ends
 */
export async function notifyConversationSummary(
    userId: string,
    conversationId: string,
    summary: string,
    botName: string,
    messages: { role: string; content: string; createdAt: Date }[],
    dashboardUrl: string
): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            email: true,
            name: true,
            notifyEmail: true,
        },
    })

    if (!user || !user.notifyEmail || !user.email) return

    const postmarkToken = process.env.POSTMARK_SERVER_TOKEN
    if (!postmarkToken) {
        console.log('Summary email skipped - POSTMARK_SERVER_TOKEN not configured')
        return
    }

    try {
        const response = await fetch('https://api.postmarkapp.com/email', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Postmark-Server-Token': postmarkToken,
            },
            body: JSON.stringify({
                From: process.env.EMAIL_FROM || 'no-reply@leos.es',
                To: user.email,
                Subject: `📋 סיכום שיחה - ${botName}`,
                HtmlBody: generateSummaryEmailHtml(user.name, botName, summary, messages, dashboardUrl),
                MessageStream: 'outbound',
            }),
        })

        if (!response.ok) {
            const errorBody = await response.text()
            console.error('Failed to send summary email:', errorBody)
        } else {
            console.log('Summary email sent successfully to:', user.email)
        }
    } catch (error) {
        console.error('Summary email error:', error)
    }
}

/**
 * Send daily summary email to admin
 */
export async function notifyAdminDailySummary(
    toEmail: string,
    data: {
        totalUsers: number,
        todayConvs: number,
        todayLeads: number,
        totalCreditsUsed: number,
        estimatedCostIls: number,
        users: { name: string, email: string, plan: string, bots: number, balance: number }[]
    }
): Promise<void> {
    const postmarkToken = process.env.POSTMARK_SERVER_TOKEN
    if (!postmarkToken) {
        console.log('Admin summary email skipped - POSTMARK_SERVER_TOKEN not configured')
        return
    }

    try {
        await fetch('https://api.postmarkapp.com/email', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Postmark-Server-Token': postmarkToken,
            },
            body: JSON.stringify({
                From: process.env.EMAIL_FROM || 'no-reply@leos.es',
                To: toEmail,
                Subject: `📊 סיכום יומי - ChatBot AI (${new Date().toLocaleDateString('he-IL')})`,
                HtmlBody: generateAdminDailySummaryHtml(data),
                MessageStream: 'outbound',
            }),
        })
    } catch (error) {
        console.error('Admin summary email error:', error)
    }
}

/**
 * Generate HTML for conversation summary email
 */
function generateSummaryEmailHtml(
    userName: string | null,
    botName: string,
    summary: string,
    messages: { role: string; content: string; createdAt: Date }[],
    dashboardUrl: string
): string {
    const messagesHtml = messages.map(m => {
        const isUser = m.role === 'user'
        const time = new Date(m.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
        const truncatedContent = m.content.length > 300 ? m.content.substring(0, 300) + '...' : m.content
        return `
        <div style="margin: 8px 0; text-align: ${isUser ? 'left' : 'right'}; direction: rtl;">
            <div style="display: inline-block; max-width: 80%; padding: 10px 14px; border-radius: 12px; background: ${isUser ? '#f3f4f6' : '#8B5CF6'}; color: ${isUser ? '#333' : 'white'}; font-size: 14px; text-align: right; direction: rtl;">
                <strong style="direction: rtl;">${isUser ? '👤 מבקר' : '🤖 בוט'}</strong> <small style="opacity:0.7">${time}</small><br>
                <div style="direction: rtl; text-align: right;">${truncatedContent.replace(/\n/g, '<br>')}</div>
            </div>
        </div>`
    }).join('')

    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; direction: rtl; text-align: right;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); direction: rtl; text-align: right;">
        <div style="background: linear-gradient(135deg, #8B5CF6, #6366F1); color: white; padding: 24px; text-align: center;">
            <h1 style="margin:0; direction: rtl;">📋 סיכום שיחה</h1>
            <p style="margin: 8px 0 0; opacity: 0.9; direction: rtl;">${botName}</p>
        </div>
        <div style="padding: 24px; direction: rtl; text-align: right;">
            <p style="direction: rtl; text-align: right;">שלום ${userName || 'משתמש יקר'},</p>
            
            <div style="background: #f0f9ff; border-right: 4px solid #8B5CF6; padding: 16px; border-radius: 8px; margin: 16px 0; direction: rtl; text-align: right;">
                <strong style="direction: rtl;">📝 סיכום:</strong><br>
                <div style="direction: rtl; text-align: right;">${summary}</div>
            </div>

            <h3 style="color: #444; margin-top: 24px; direction: rtl; text-align: right;">💬 תמלול השיחה (${messages.length} הודעות):</h3>
            <div style="background: #fafafa; border-radius: 12px; padding: 16px; max-height: 500px; overflow: auto; direction: rtl;">
                ${messagesHtml}
            </div>

            <div style="text-align: center; margin-top: 24px;">
                <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6, #6366F1); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">צפה בשיחה המלאה</a>
            </div>
        </div>
        <div style="text-align: center; padding: 16px; color: #888; font-size: 12px; direction: rtl;">
            ChatBot AI - מערכת צ'אטבוט חכמה
        </div>
      </div>
    </body>
    </html>
    `
}

/**
 * Generate HTML for admin daily summary email
 */
function generateAdminDailySummaryHtml(data: {
    totalUsers: number,
    todayConvs: number,
    todayLeads: number,
    totalCreditsUsed: number,
    estimatedCostIls: number,
    users: { name: string, email: string, plan: string, bots: number, balance: number }[]
}): string {
    const userRows = data.users.map(u => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; text-align: right;">${u.name}<br><small style="color:#666">${u.email}</small></td>
            <td style="padding: 10px; text-align: center;">${u.plan}</td>
            <td style="padding: 10px; text-align: center;">${u.bots}</td>
            <td style="padding: 10px; text-align: center; font-weight: bold;">${u.balance}</td>
        </tr>
    `).join('')

    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; direction: rtl; text-align: right;">
      <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); direction: rtl; text-align: right;">
        <div style="background: #1e293b; color: white; padding: 24px; text-align: center;">
            <h1 style="margin:0; direction: rtl;">📊 סיכום יומי ChatBot AI</h1>
            <p style="margin: 8px 0 0; opacity: 0.8; direction: rtl;">נכון לתאריך ${new Date().toLocaleDateString('he-IL')}</p>
        </div>
        <div style="padding: 24px; direction: rtl; text-align: right;">
            <div style="display: flex; flex-wrap: wrap; margin: -10px; padding-bottom: 24px;">
                <div style="flex: 1; min-width: 140px; background: #f8fafc; padding: 15px; border-radius: 12px; margin: 10px; text-align: center;">
                    <small style="color:#64748b">שיחות היום</small><br>
                    <strong style="font-size: 20px;">${data.todayConvs}</strong>
                </div>
                <div style="flex: 1; min-width: 140px; background: #f8fafc; padding: 15px; border-radius: 12px; margin: 10px; text-align: center;">
                    <small style="color:#64748b">לידים חדשים</small><br>
                    <strong style="font-size: 20px;">${data.todayLeads}</strong>
                </div>
                <div style="flex: 1; min-width: 140px; background: #f8fafc; padding: 15px; border-radius: 12px; margin: 10px; text-align: center;">
                    <small style="color:#64748b">עלות AI תוצאתית</small><br>
                    <strong style="font-size: 20px; color: #10b981;">₪${data.estimatedCostIls.toFixed(2)}</strong>
                </div>
            </div>

            <h3 style="margin-top: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; direction: rtl;">רשימת משתמשים ויתרות:</h3>
            <table style="width: 100%; border-collapse: collapse; direction: rtl;">
                <thead>
                    <tr style="background: #f8fafc;">
                        <th style="padding: 10px; text-align: right;">שם</th>
                        <th style="padding: 10px; text-align: center;">תוכנית</th>
                        <th style="padding: 10px; text-align: center;">בוטים</th>
                        <th style="padding: 10px; text-align: center;">יתרה</th>
                    </tr>
                </thead>
                <tbody>
                    ${userRows}
                </tbody>
            </table>
        </div>
        <div style="text-align: center; padding: 16px; color: #888; font-size: 12px; background: #f8fafc;">
            הודעה זו נשלחה אוטומטית על ידי מערכת ChatBot AI
        </div>
      </div>
    </body>
    </html>
    `
}
