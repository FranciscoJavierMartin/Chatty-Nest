import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import {
  MailForgotPasswordData,
  MailResetPasswordData,
} from '@/email/interfaces/email.interface';
import { EmailSenderService } from '@/email/services/email-sender.service';

@Injectable()
export class EmailService {
  constructor(
    private readonly emailSenderService: EmailSenderService,
    @InjectQueue('email')
    private readonly emailQueue: Queue<
      MailForgotPasswordData | MailResetPasswordData
    >,
  ) {}

  public async sendForgotPasswordEmail(
    receiverEmail: string,
    username: string,
    token: string,
  ): Promise<void> {
    this.emailQueue.add('sendForgotPasswordEmail', {
      receiverEmail,
      username,
      token,
    });
  }

  public async sendResetPasswordEmail(
    username: string,
    receiverEmail: string,
    ipaddress: string,
  ): Promise<void> {
    this.emailQueue.add('sendResetPasswordEmail', {
      username,
      receiverEmail,
      ipaddress,
      date: new Date().toLocaleDateString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  }
}
