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
        await sendWebhookNotification(user.webhookUrl, payload)
    }
}

/**
 * Send email notification using Resend or SMTP
 */
async function sendEmailNotification(
    email: string,
    userName: string | null,
    payload: NotificationPayload
): Promise<void> {
    // Check if we have email configured
    const resendApiKey = process.env.RESEND_API_KEY

    if (resendApiKey) {
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: process.env.EMAIL_FROM || 'ChatBot AI <notifications@chatbot.ai>',
                    to: email,
                    subject: `💬 שיחה חדשה ב-${payload.botName}`,
                    html: generateEmailHtml(userName, payload),
                }),
            })

            if (!response.ok) {
                console.error('Failed to send email:', await response.text())
            }
        } catch (error) {
            console.error('Email notification error:', error)
        }
    } else {
        console.log('Email notification skipped - RESEND_API_KEY not configured')
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
    payload: NotificationPayload
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
