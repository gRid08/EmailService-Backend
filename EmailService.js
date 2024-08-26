const nodemailer = require('nodemailer');

class EmailService {
  constructor(providers) {
    this.providers = [
      this.createTransport(providers.firstProvider),
      this.createTransport(providers.secondProvider),
    ];
    this.currentProviderIndex = 0;
    this.currentRetries = 0;
    this.maxRetries = 3;
    this.rateLimitPerSecond = 1;
    this.lastSentTime = 0;
    this.sentEmails = new Set();
    this.statusTracking = [];
  }

  createTransport(provider) {
    return nodemailer.createTransport({
      host: provider.host,
      port: provider.port,
      secure: provider.secure,
      auth: {
        user: provider.user,
        pass: provider.pass,
      },
    });
  }

  async sendEmail(emailOptions) {
    if (this.sentEmails.has(emailOptions.id)) {
      console.log('Duplicate email detected. Aborting send.');
      return;
    }

    this.sentEmails.add(emailOptions.id);

    if (this.rateLimitExceeded()) {
      console.log('Rate limit exceeded. Waiting to retry...');
      await this.delay(1000);
    }

    while (this.currentRetries <= this.maxRetries) {
      try {
        const provider = this.providers[this.currentProviderIndex];
        await provider.sendMail(emailOptions);
        console.log('Email sent successfully!');
        this.statusTracking.push({
          emailId: emailOptions.id,
          status: 'Success',
          provider: this.currentProviderIndex,
        });
        this.lastSentTime = Date.now();
        this.currentRetries = 0;
        return;
      } catch (error) {
        console.error('Error sending email:', error.message);
        this.statusTracking.push({
          emailId: emailOptions.id,
          status: 'Failure',
          provider: this.currentProviderIndex,
          error: error.message,
        });

        if (this.currentRetries >= this.maxRetries) {
          console.log('Max retries reached. Switching provider...');
          this.switchProvider();
          this.currentRetries = 0;
        } else {
          console.log(
            `Retrying... Attempt ${
              this.currentRetries + 1
            } with exponential backoff.`
          );
          this.currentRetries++;
          await this.delay(this.getExponentialBackoffDelay());
        }
      }
    }
  }

  rateLimitExceeded() {
    const timeSinceLastSend = Date.now() - this.lastSentTime;
    return timeSinceLastSend < 1000 / this.rateLimitPerSecond;
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getExponentialBackoffDelay() {
    return Math.pow(2, this.currentRetries) * 1000;
  }

  switchProvider() {
    this.currentProviderIndex =
      (this.currentProviderIndex + 1) % this.providers.length;
  }
}

module.exports = EmailService;
