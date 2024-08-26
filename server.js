const express = require('express');
const setupProviders = require('./EmailProvider');
const EmailService = require('./EmailService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

async function startServer() {
  const providers = await setupProviders();
  const emailService = new EmailService(providers);

  //1. simple post request to send email with dynamic attributes
  app.post('/send-email', async (req, res) => {
    const { id, from, to, subject, text } = req.body;

    const emailOptions = {
      id,
      from,
      to,
      subject,
      text,
    };

    try {
      await emailService.sendEmail(emailOptions);
      res.status(200).send('Email sent successfully!');
    } catch (error) {
      res.status(500).send('Failed to send email: ' + error.message);
    }
  });

  // 2. rate-limit example which will definitely trigger rate limit
  app.post('/send-email-rate-limit', async (req, res) => {
    const emailOptions = {
      id: 'email-id-rate-limit',
      from: '"Rate limit test" <sender@example.com>',
      to: 'recipient1@example.com',
      subject: 'Rate Limiting test',
      text: 'This email is to test the rate limiting mechanism.',
    };

    try {
      await emailService.sendEmail(emailOptions);
      await emailService.sendEmail(emailOptions);
      await emailService.sendEmail(emailOptions);

      res.status(200).send('Rate limiting test completed!');
    } catch (error) {
      res.status(500).send('Failed during rate limit test: ' + error.message);
    }
  });

  //3. fallback to second provider
  app.post('/send-email-fallback', async (req, res) => {
    const emailOptions = {
      id: 'email-id-fallback',
      from: '"Fallback test" <sender@example.com>',
      to: 'recipient2@example.com',
      subject: 'Fallback test',
      text: 'This email is to test the fallback mechanism.',
    };

    try {
      await emailService.sendEmail(emailOptions);
      res.status(200).send('Fallback test completed!');
    } catch (error) {
      res.status(500).send('Failed during fallback test: ' + error.message);
    }
  });

  // 4. retry mechanism with exponential backoff
  app.post('/send-email-retry', async (req, res) => {
    const emailOptions = {
      id: 'email-id-retry',
      from: '"Retry test" <sender@example.com>',
      to: 'recipient3@example.com',
      subject: 'Retry Mechanism test',
      text: 'This email is to test the retry mechanism',
    };

    try {
      await emailService.sendEmail(emailOptions);
      res.status(200).send('Retry mechanism test completed!');
    } catch (error) {
      res.status(500).send('Failed during retry test: ' + error.message);
    }
  });

  // 5.status tracking
  app.get('/status-tracking', (req, res) => {
    res.status(200).json(emailService.statusTracking);
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

startServer();
