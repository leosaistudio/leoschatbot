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
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 24px; text-align: center; }
        .content { padding: 24px; }
        .message { background: #f3f4f6; border-radius: 12px; padding: 16px; margin: 16px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; }
        .footer { text-align: center; padding: 16px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0;">💬 שיחה חדשה!</h1>
        </div>
        <div class="content">
          <p>שלום ${userName || 'משתמש יקר'},</p>
          <p>מישהו התחיל שיחה עם הבוט <strong>${payload.botName}</strong>:</p>
          
          <div class="message">
            <strong>הודעה ראשונה:</strong><br>
            "${payload.firstMessage}"
          </div>
          
          ${payload.pageUrl ? `<p><small>מדף: ${payload.pageUrl}</small></p>` : ''}
          
          <center>
            <a href="${payload.dashboardUrl}" class="button">צפה בשיחה והשתלט</a>
          </center>
        </div>
        <div class="footer">
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
        <div style="margin: 8px 0; text-align: ${isUser ? 'left' : 'right'};">
            <div style="display: inline-block; max-width: 80%; padding: 10px 14px; border-radius: 12px; background: ${isUser ? '#e8e8e8' : '#8B5CF6'}; color: ${isUser ? '#333' : 'white'}; font-size: 14px; text-align: right;">
                <strong>${isUser ? '👤 מבקר' : '🤖 בוט'}</strong> <small style="opacity:0.7">${time}</small><br>
                ${truncatedContent.replace(/\n/g, '<br>')}
            </div>
        </div>`
    }).join('')

    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #8B5CF6, #6366F1); color: white; padding: 24px; text-align: center;">
            <h1 style="margin:0;">📋 סיכום שיחה</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">${botName}</p>
        </div>
        <div style="padding: 24px;">
            <p>שלום ${userName || 'משתמש יקר'},</p>
            
            <div style="background: #f0f9ff; border-right: 4px solid #8B5CF6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <strong>📝 סיכום:</strong><br>
                ${summary}
            </div>

            <h3 style="color: #444; margin-top: 24px;">💬 תמלול השיחה (${messages.length} הודעות):</h3>
            <div style="background: #fafafa; border-radius: 12px; padding: 16px; max-height: 500px; overflow: auto;">
                ${messagesHtml}
            </div>

            <center style="margin-top: 24px;">
                <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6, #6366F1); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">צפה בשיחה המלאה</a>
            </center>
        </div>
        <div style="text-align: center; padding: 16px; color: #888; font-size: 12px;">
            ChatBot AI - מערכת צ'אטבוט חכמה
        </div>
      </div>
    </body>
    </html>
    `
}
