const twilio = require('twilio');
const { formatPhoneForWhatsApp } = require('../utils/helpers');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.initializeClient();
  }

  initializeClient() {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.warn('⚠️  Twilio WhatsApp credentials not configured');
      return;
    }

    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async sendConfirmationMessage(phone, form, response) {
    if (!this.client) {
      throw new Error('WhatsApp service not configured');
    }

    const formattedPhone = formatPhoneForWhatsApp(phone);
    const { whatsapp: whatsappSettings } = form.settings.notifications;
    
    // Generate message content
    const message = whatsappSettings.template || 
      this.generateDefaultMessage(form, response);

    try {
      const result = await this.client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
        to: `whatsapp:${formattedPhone}`,
        body: message
      });

      console.log('✅ WhatsApp message sent:', result.sid);
      return result.sid;
    } catch (error) {
      console.error('❌ WhatsApp message failed:', error);
      throw error;
    }
  }

  generateDefaultMessage(form, response) {
    const submitterInfo = response.submitterInfo;
    
    return `
🎉 *${form.title}*

Merhaba ${submitterInfo.name || 'Değerli Müşterimiz'},

Formunuz başarıyla alınmıştır. En kısa sürede size dönüş yapacağız.

📅 *Gönderilme Tarihi:* ${response.createdAt.toLocaleDateString('tr-TR')}

Herhangi bir sorunuz varsa lütfen bizimle iletişime geçin.

Teşekkürler! 🙏
    `.trim();
  }

  async sendCustomMessage(phone, message) {
    if (!this.client) {
      throw new Error('WhatsApp service not configured');
    }

    const formattedPhone = formatPhoneForWhatsApp(phone);

    try {
      const result = await this.client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
        to: `whatsapp:${formattedPhone}`,
        body: message
      });

      console.log('✅ Custom WhatsApp message sent:', result.sid);
      return result.sid;
    } catch (error) {
      console.error('❌ Custom WhatsApp message failed:', error);
      throw error;
    }
  }

  async sendAppointmentReminder(phone, form, response, appointmentDate) {
    if (!this.client) {
      throw new Error('WhatsApp service not configured');
    }

    const formattedPhone = formatPhoneForWhatsApp(phone);
    const submitterInfo = response.submitterInfo;

    const message = `
⏰ *Randevu Hatırlatması*

Merhaba ${submitterInfo.name || 'Değerli Müşterimiz'},

${form.title} için randevunuz yarın:

📅 *Tarih:* ${appointmentDate.toLocaleDateString('tr-TR')}
🕐 *Saat:* ${appointmentDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}

Lütfen randevunuzu unutmayın!

Herhangi bir değişiklik için lütfen bizimle iletişime geçin.

Görüşmek üzere! 👋
    `.trim();

    try {
      const result = await this.client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
        to: `whatsapp:${formattedPhone}`,
        body: message
      });

      console.log('✅ WhatsApp reminder sent:', result.sid);
      return result.sid;
    } catch (error) {
      console.error('❌ WhatsApp reminder failed:', error);
      throw error;
    }
  }

  async sendStatusUpdate(phone, form, status, message = null) {
    if (!this.client) {
      throw new Error('WhatsApp service not configured');
    }

    const formattedPhone = formatPhoneForWhatsApp(phone);
    
    const statusMessages = {
      'processed': '✅ Formunuz işleme alınmıştır.',
      'completed': '🎉 İşleminiz tamamlanmıştır.',
      'failed': '❌ İşleminizde bir sorun oluşmuştur.'
    };

    const statusMessage = `
📋 *${form.title} - Durum Güncellemesi*

${statusMessages[status] || 'Formunuzun durumu güncellendi.'}

${message ? `\n💬 *Açıklama:* ${message}` : ''}

Herhangi bir sorunuz varsa lütfen bizimle iletişime geçin.
    `.trim();

    try {
      const result = await this.client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
        to: `whatsapp:${formattedPhone}`,
        body: statusMessage
      });

      console.log('✅ WhatsApp status update sent:', result.sid);
      return result.sid;
    } catch (error) {
      console.error('❌ WhatsApp status update failed:', error);
      throw error;
    }
  }

  async testConnection() {
    if (!this.client) {
      throw new Error('WhatsApp service not configured');
    }

    try {
      // Test by getting account info
      const account = await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      console.log('✅ WhatsApp service connected successfully');
      return true;
    } catch (error) {
      console.error('❌ WhatsApp connection failed:', error);
      return false;
    }
  }

  isValidPhoneNumber(phone) {
    try {
      const formatted = formatPhoneForWhatsApp(phone);
      return formatted.startsWith('+90') && formatted.length === 13;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new WhatsAppService();