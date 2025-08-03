const { google } = require('googleapis');
const { formatDate } = require('../utils/helpers');

class CalendarService {
  constructor() {
    this.oauth2Client = null;
    this.calendar = null;
    this.initializeClient();
  }

  initializeClient() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.warn('⚠️  Google Calendar credentials not configured');
      return;
    }

    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Set refresh token if available
    if (process.env.GOOGLE_REFRESH_TOKEN) {
      this.oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });
    }

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  async createAppointment(form, response, submitterInfo) {
    if (!this.calendar) {
      throw new Error('Google Calendar not configured');
    }

    // Extract date/time from form responses using form fields metadata
    const dateTimeInfo = this.extractDateTimeFromResponses(response.responses, form.fields);
    
    if (!dateTimeInfo.start) {
      console.warn('No appointment date/time found in form responses');
      return null;
    }

    // Create event details
    const eventTitle = `${form.title} - ${submitterInfo.name || submitterInfo.email || 'Randevu'}`;
    
    const duration = 30; // Default 30 minutes appointment
    const endTime = new Date(dateTimeInfo.start.getTime() + (duration * 60 * 1000));

    const event = {
      summary: eventTitle,
      description: this.generateEventDescription(form, response, submitterInfo),
      start: {
        dateTime: dateTimeInfo.start.toISOString(),
        timeZone: 'Europe/Istanbul'
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Europe/Istanbul'
      },
      attendees: submitterInfo.email ? [
        { email: submitterInfo.email, displayName: submitterInfo.name }
      ] : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 } // 30 minutes before
        ]
      }
    };

    // Add location if available
    const location = this.extractLocationFromResponses(response.responses);
    if (location) {
      event.location = location;
    }

    try {
      const result = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        sendUpdates: 'all'
      });

      console.log('✅ Calendar event created:', result.data.id);
      return result.data.id;
    } catch (error) {
      console.error('❌ Calendar event creation failed:', error);
      throw error;
    }
  }

  extractDateTimeFromResponses(responses, formFields = []) {
    let dateValue = null;
    let timeValue = null;

    // Create a map for quick field lookup
    const fieldMap = {};
    formFields.forEach(field => {
      fieldMap[field.id] = field;
    });

    responses.forEach(response => {
      const fieldType = response.fieldType.toLowerCase();
      const field = fieldMap[response.fieldId];
      
      // Only process appointment fields
      if (field && field.isAppointment) {
        if (fieldType === 'date') {
          dateValue = new Date(response.value);
        } else if (fieldType === 'time') {
          timeValue = response.value;
        } else if (fieldType === 'datetime') {
          return { start: new Date(response.value) };
        }
      }
    });

    if (dateValue && timeValue) {
      const [hours, minutes] = timeValue.split(':').map(Number);
      dateValue.setHours(hours, minutes, 0, 0);
      return { start: dateValue };
    } else if (dateValue) {
      // Default to 10:00 AM if no time specified
      dateValue.setHours(10, 0, 0, 0);
      return { start: dateValue };
    }

    return { start: null };
  }

  extractLocationFromResponses(responses) {
    for (const response of responses) {
      const fieldLabel = response.fieldLabel.toLowerCase();
      if (fieldLabel.includes('adres') || 
          fieldLabel.includes('konum') || 
          fieldLabel.includes('lokasyon') ||
          fieldLabel.includes('yer')) {
        return response.value;
      }
    }
    return null;
  }

  generateEventDescription(form, response, submitterInfo) {
    const responseText = response.responses.map(resp => 
      `${resp.fieldLabel}: ${Array.isArray(resp.value) ? resp.value.join(', ') : resp.value}`
    ).join('\n');

    return `
${form.description || ''}

RANDEVU DETAYLARI:
${responseText}

İLETİŞİM:
${submitterInfo.email ? `Email: ${submitterInfo.email}` : ''}
${submitterInfo.phone ? `Telefon: ${submitterInfo.phone}` : ''}

Gönderilme Tarihi: ${formatDate(response.createdAt)}
Form URL: ${process.env.FRONTEND_URL}/${form.slug}

Bu randevu BForm sistemi üzerinden oluşturulmuştur.
    `.trim();
  }

  async updateEvent(eventId, updates) {
    if (!this.calendar) {
      throw new Error('Google Calendar not configured');
    }

    try {
      const result = await this.calendar.events.patch({
        calendarId: 'primary',
        eventId: eventId,
        resource: updates
      });

      console.log('✅ Calendar event updated:', eventId);
      return result.data;
    } catch (error) {
      console.error('❌ Calendar event update failed:', error);
      throw error;
    }
  }

  async deleteEvent(eventId) {
    if (!this.calendar) {
      throw new Error('Google Calendar not configured');
    }

    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });

      console.log('✅ Calendar event deleted:', eventId);
      return true;
    } catch (error) {
      console.error('❌ Calendar event deletion failed:', error);
      throw error;
    }
  }

  async getAuthUrl() {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not configured');
    }

    const scopes = ['https://www.googleapis.com/auth/calendar'];
    
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes
    });

    return authUrl;
  }

  async setTokenFromCode(code) {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not configured');
    }

    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      
      console.log('✅ Google Calendar authenticated');
      console.log('Add this to your .env file:');
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
      
      return tokens;
    } catch (error) {
      console.error('❌ Google Calendar authentication failed:', error);
      throw error;
    }
  }

  async testConnection() {
    if (!this.calendar) {
      throw new Error('Google Calendar not configured');
    }

    try {
      const response = await this.calendar.calendarList.list();
      console.log('✅ Google Calendar connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Google Calendar connection failed:', error);
      return false;
    }
  }
}

module.exports = new CalendarService();