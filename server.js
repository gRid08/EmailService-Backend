const express = require('express');
const nodemailer = require('nodemailer');
const setupProviders = require('./EmailProvider');
const EmailService = require('./EmailService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const MAX_REQUESTS = 3;
const TIME_WINDOW = 60 * 1000;

const ipRequests = {};

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

  // 2. rate-limit example
  app.post('/send-email-rate-limit', async (req, res) => {
    const ip = req.ip;
    const currentTime = Date.now();

    if (!ipRequests[ip]) {
      ipRequests[ip] = {
        count: 1,
        startTime: currentTime,
      };
    } else {
      const timePassed = currentTime - ipRequests[ip].startTime;

      if (timePassed > TIME_WINDOW) {
        ipRequests[ip].count = 1;
        ipRequests[ip].startTime = currentTime;
      } else {
        ipRequests[ip].count += 1;
      }

      if (ipRequests[ip].count > MAX_REQUESTS) {
        return res
          .status(429)
          .json({ error: 'Rate limit exceeded. Try again after 60 seconds' });
      }
    }

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

      //res.status(200).send('Rate limiting test completed!');
    } catch (error) {
      res.status(500).send('Rate limit exceeded' + error.message);
    }
  });



  // 3. retry mechanism with exponential backoff
  app.post('/send-email-retry', async (req, res) => {
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
      res.status(200).send('Retry mechanism test completed!');
    } catch (error) {
      res.status(500).send('Failed during retry test: ' + error.message);
    }
  });

  // 4.status tracking
  app.get('/status-tracking', (req, res) => {
    res.status(200).json(emailService.statusTracking);
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

startServer();
