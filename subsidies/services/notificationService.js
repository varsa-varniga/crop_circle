const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { getString } = require('../utils/languageHelper');

class NotificationService {
  constructor() {
    this.initializeFirebase();
    this.initializeEmail();
    this.initializeSMS();
  }

  // Initialize Firebase Admin SDK for Push Notifications
  initializeFirebase() {
    try {
      // For production, use environment variables
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID || "agrovihan-test",
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
      };

      if (process.env.FIREBASE_PRIVATE_KEY) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase initialized for push notifications');
      } else {
        console.log('⚠️ Firebase not configured - push notifications disabled');
      }
    } catch (error) {
      console.log('⚠️ Firebase initialization failed:', error.message);
    }
  }

  // Initialize Email Transport
  initializeEmail() {
    this.emailTransporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'agrovihan.notifications@gmail.com',
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Test email configuration
    this.emailTransporter.verify((error) => {
      if (error) {
        console.log('⚠️ Email configuration failed:', error.message);
      } else {
        console.log('✅ Email service ready');
      }
    });
  }

  // Initialize SMS Service (Twilio)
  initializeSMS() {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      console.log('✅ SMS service ready');
    } else {
      console.log('⚠️ Twilio not configured - SMS notifications disabled');
    }
  }

  // Send Push Notification
  async sendPushNotification(user, notification) {
    try {
      if (!admin.apps.length || !user.fcmToken) {
        return { success: false, message: 'FCM not configured or no token' };
      }

      const message = {
        token: user.fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        android: {
          priority: 'high',
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('✅ Push notification sent:', response);
      return { success: true, messageId: response };

    } catch (error) {
      console.error('❌ Push notification failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Send Email Notification
  async sendEmailNotification(user, email) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'AgroVihan <notifications@agrovihan.com>',
        to: user.email,
        subject: email.subject,
        html: this.getEmailTemplate(user, email),
        text: email.body
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      console.log('✅ Email sent:', result.messageId);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Send SMS Notification
  async sendSMSNotification(user, sms) {
    try {
      if (!this.twilioClient) {
        return { success: false, message: 'SMS service not configured' };
      }

      const message = await this.twilioClient.messages.create({
        body: sms.body,
        from: process.env.TWILIO_PHONE_NUMBER || '+15005550006',
        to: user.phone
      });

      console.log('✅ SMS sent:', message.sid);
      return { success: true, messageId: message.sid };

    } catch (error) {
      console.error('❌ SMS sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Send Multi-channel Notification
  async sendNotification(user, notification) {
    const results = {
      push: { success: false },
      email: { success: false },
      sms: { success: false }
    };

    const userLanguage = user.language || 'ta';

    // Prepare notification content based on user language
    const notificationContent = this.prepareNotificationContent(notification, userLanguage);

    // Send push notification if FCM token exists
    if (user.fcmToken) {
      results.push = await this.sendPushNotification(user, notificationContent.push);
    }

    // Send email notification
    if (user.email) {
      results.email = await this.sendEmailNotification(user, notificationContent.email);
    }

    // Send SMS for critical notifications or if user prefers SMS
    if (user.phone && (notification.priority === 'high' || user.preferences?.smsEnabled)) {
      results.sms = await this.sendSMSNotification(user, notificationContent.sms);
    }

    return {
      success: Object.values(results).some(r => r.success),
      channels: results,
      user: {
        id: user._id,
        name: user.name,
        language: user.language
      }
    };
  }

  // Prepare notification content in user's preferred language
  prepareNotificationContent(notification, language) {
    const templates = {
      // Application Submitted
      application_submitted: {
        push: {
          title: getString('notification.application.submitted.title', language),
          body: getString('notification.application.submitted.body', language)
        },
        email: {
          subject: getString('notification.application.submitted.email_subject', language),
          body: getString('notification.application.submitted.email_body', language)
        },
        sms: {
          body: getString('notification.application.submitted.sms', language)
        }
      },

      // Application Approved
      application_approved: {
        push: {
          title: getString('notification.application.approved.title', language),
          body: getString('notification.application.approved.body', language)
        },
        email: {
          subject: getString('notification.application.approved.email_subject', language),
          body: getString('notification.application.approved.email_body', language)
        },
        sms: {
          body: getString('notification.application.approved.sms', language)
        }
      },

      // Scheme Recommendation
      scheme_recommendation: {
        push: {
          title: getString('notification.scheme.recommendation.title', language),
          body: getString('notification.scheme.recommendation.body', language)
        },
        email: {
          subject: getString('notification.scheme.recommendation.email_subject', language),
          body: getString('notification.scheme.recommendation.email_body', language)
        },
        sms: {
          body: getString('notification.scheme.recommendation.sms', language)
        }
      },

      // KYC Verified
      kyc_verified: {
        push: {
          title: getString('notification.kyc.verified.title', language),
          body: getString('notification.kyc.verified.body', language)
        },
        email: {
          subject: getString('notification.kyc.verified.email_subject', language),
          body: getString('notification.kyc.verified.email_body', language)
        },
        sms: {
          body: getString('notification.kyc.verified.sms', language)
        }
      },

      // Payment Disbursed
      payment_disbursed: {
        push: {
          title: getString('notification.payment.disbursed.title', language),
          body: getString('notification.payment.disbursed.body', language)
        },
        email: {
          subject: getString('notification.payment.disbursed.email_subject', language),
          body: getString('notification.payment.disbursed.email_body', language)
        },
        sms: {
          body: getString('notification.payment.disbursed.sms', language)
        }
      }
    };

    const template = templates[notification.type] || templates.application_submitted;
    
    // Replace variables in templates
    return this.replaceTemplateVariables(template, notification.variables || {});
  }

  // Replace variables in notification templates
  replaceTemplateVariables(template, variables) {
    const result = JSON.parse(JSON.stringify(template));
    
    const replaceInObject = (obj) => {
      for (let key in obj) {
        if (typeof obj[key] === 'string') {
          for (let variable in variables) {
            obj[key] = obj[key].replace(`{${variable}}`, variables[variable]);
          }
        } else if (typeof obj[key] === 'object') {
          replaceInObject(obj[key]);
        }
      }
    };

    replaceInObject(result);
    return result;
  }

  // Get HTML email template
  getEmailTemplate(user, email) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌾 AgroVihan</h1>
            <p>Financial Empowerment Center</p>
          </div>
          <div class="content">
            <h2>${email.subject}</h2>
            <p>${email.body.replace(/\n/g, '<br>')}</p>
            
            ${email.ctaUrl ? `
            <div style="text-align: center;">
              <a href="${email.ctaUrl}" class="button">View Details</a>
            </div>
            ` : ''}
            
            <br>
            <p>Best regards,<br>AgroVihan Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© 2025 AgroVihan. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Batch notifications for multiple users
  async sendBatchNotifications(users, notification) {
    const results = [];
    
    for (const user of users) {
      try {
        const result = await this.sendNotification(user, notification);
        results.push({
          userId: user._id,
          ...result
        });
      } catch (error) {
        results.push({
          userId: user._id,
          success: false,
          error: error.message
        });
      }
    }

    return {
      total: users.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      details: results
    };
  }
}

module.exports = new NotificationService();