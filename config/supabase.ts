export const supabaseConfig = {
  url: 'https://sxjflzdzzjrzwscsfhgo.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4amZsemR6empyendzY3NmaGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMTU0NzksImV4cCI6MjA3Mzg5MTQ3OX0.J35RAyB_6T6TZ4IJs9op13J9Hp9TqJj3sTFt11NvDRE'
}

export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key',
  secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret'
}

export const emailConfig = {
  sendgridApiKey: process.env.SENDGRID_API_KEY || 'your_sendgrid_api_key',
  fromEmail: process.env.FROM_EMAIL || 'noreply@tryb4buy.com'
}

export const smsConfig = {
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || 'your_twilio_account_sid',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || 'your_twilio_auth_token',
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || 'your_twilio_phone_number'
}
