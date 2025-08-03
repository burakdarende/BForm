const nodemailer = require('nodemailer');
const { formatDate } = require('../utils/helpers');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️  Email credentials not configured');
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Use App Password for Gmail
      }
    });
  }

  async sendFormSubmissionEmail(form, response, submitterInfo) {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    const { email: notifications } = form.settings.notifications;
    const recipients = ['burakdarende@gmail.com']; // Admin email hardcoded
    
    console.log('🔍 Email Debug:');
    console.log('- Form notifications:', notifications);
    console.log('- Recipients from form:', notifications.to);
    console.log('- EMAIL_USER env:', process.env.EMAIL_USER);
    console.log('- Final recipients:', recipients);

    // Generate email content
    const subject = notifications.subject || 
      `Yeni Form Yanıtı: ${form.title}`;

    const htmlContent = this.generateSubmissionEmailHtml(form, response, submitterInfo);
    const textContent = this.generateSubmissionEmailText(form, response, submitterInfo);

    const mailOptions = {
      from: {
        name: 'BForm Sistemi',
        address: process.env.EMAIL_USER
      },
      to: recipients,
      subject: subject,
      text: textContent,
      html: htmlContent,
      replyTo: submitterInfo.email || process.env.EMAIL_USER
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return result.messageId;
    } catch (error) {
      console.error('❌ Email send error:', error);
      throw error;
    }
  }

  generateSubmissionEmailHtml(form, response, submitterInfo) {
    const responseHtml = response.responses.map(resp => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">
          ${resp.fieldLabel}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">
          ${Array.isArray(resp.value) ? resp.value.join(', ') : resp.value}
        </td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Yeni Form Yanıtı</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin: 0;">Yeni Form Yanıtı</h1>
            <p style="margin: 10px 0 0 0; color: #6b7280;">
              ${form.title} formu için yeni bir yanıt alındı.
            </p>
          </div>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #1f2937;">Form Bilgileri</h2>
            <p><strong>Form Adı:</strong> ${form.title}</p>
            <p><strong>Form URL:</strong> ${process.env.FRONTEND_URL}/${form.slug}</p>
            <p><strong>Gönderilme Tarihi:</strong> ${formatDate(response.createdAt)}</p>
            ${submitterInfo.email ? `<p><strong>Gönderen Email:</strong> ${submitterInfo.email}</p>` : ''}
            ${submitterInfo.phone ? `<p><strong>Gönderen Telefon:</strong> ${submitterInfo.phone}</p>` : ''}
          </div>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
            <h2 style="margin-top: 0; color: #1f2937;">Yanıtlar</h2>
            <table style="width: 100%; border-collapse: collapse;">
              ${responseHtml}
            </table>
          </div>

          <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 14px; color: #6b7280;">
            <p style="margin: 0;">
              Bu email BForm sistemi tarafından otomatik olarak gönderilmiştir.<br>
              Admin panelinden bu yanıtı görüntüleyebilir ve yönetebilirsiniz.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateSubmissionEmailText(form, response, submitterInfo) {
    const responseText = response.responses.map(resp => 
      `${resp.fieldLabel}: ${Array.isArray(resp.value) ? resp.value.join(', ') : resp.value}`
    ).join('\n');

    return `
Yeni Form Yanıtı

Form: ${form.title}
URL: ${process.env.FRONTEND_URL}/${form.slug}
Tarih: ${formatDate(response.createdAt)}
${submitterInfo.email ? `Email: ${submitterInfo.email}` : ''}
${submitterInfo.phone ? `Telefon: ${submitterInfo.phone}` : ''}

YANITLAR:
${responseText}

---
Bu email BForm sistemi tarafından otomatik olarak gönderilmiştir.
    `.trim();
  }

  async sendConfirmationEmail(submitterEmail, form, response) {
    if (!this.transporter || !submitterEmail) {
      return;
    }

    const subject = `${form.title} - Formunuz Alındı`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Form Onayı</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #10b981; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0;">✅ Formunuz Başarıyla Alındı</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Merhaba,</p>
            <p><strong>${form.title}</strong> formunu doldurduğunuz için teşekkür ederiz.</p>
            <p>Formunuz başarıyla alındı ve en kısa sürede değerlendirilecektir.</p>
            <p><strong>Gönderilme Tarihi:</strong> ${formatDate(response.createdAt)}</p>
            <p>Herhangi bir sorunuz varsa lütfen bizimle iletişime geçin.</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 14px; color: #6b7280;">
            <p style="margin: 0;">Bu email otomatik olarak gönderilmiştir.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: {
        name: 'BForm Sistemi',
        address: process.env.EMAIL_USER
      },
      to: submitterEmail,
      subject: subject,
      html: htmlContent
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Confirmation email sent:', result.messageId);
      return result.messageId;
    } catch (error) {
      console.error('❌ Confirmation email error:', error);
      throw error;
    }
  }

  async testConnection() {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email service connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Email connection failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();