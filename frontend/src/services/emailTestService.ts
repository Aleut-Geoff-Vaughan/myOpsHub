import { api } from '../lib/api-client';

export interface EmailTestUser {
  id: string;
  email: string;
  displayName: string;
}

export interface SendTestEmailRequest {
  toEmail: string;
  subject?: string;
  body?: string;
}

export interface EmailTestResult {
  success: boolean;
  message: string;
  messageId?: string;
  sentAt: string;
}

export interface EmailConfigStatus {
  provider: string;
  isConfigured: boolean;
  smtpHost?: string;
  azureSenderAddress?: string;
  fromEmail?: string;
  fromName?: string;
}

export const emailTestService = {
  // Get list of users for recipient selection
  async getUsers(): Promise<EmailTestUser[]> {
    return api.get<EmailTestUser[]>('/email-test/users');
  },

  // Send a test email
  async sendTestEmail(request: SendTestEmailRequest): Promise<EmailTestResult> {
    return api.post<EmailTestResult>('/email-test/send', request);
  },

  // Get email configuration status
  async getEmailConfig(): Promise<EmailConfigStatus> {
    return api.get<EmailConfigStatus>('/email-test/config');
  },
};
