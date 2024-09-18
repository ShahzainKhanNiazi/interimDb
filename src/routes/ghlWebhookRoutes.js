const express = require('express');
const { handleCustomerWebhook, handleJobWebhook, handleStageChangeWebhook } = require('../controllers/ghlWebhookController');
const router = express.Router();

// Webhook to handle new GHL contact (customer)
router.post('/webhook/contact', handleCustomerWebhook);

// Webhook to handle new GHL job (opportunity)
router.post('/webhook/opportunity', handleJobWebhook);

// Webhook to handle GHL job stage change
router.post('/webhook/opportunity-stage', handleStageChangeWebhook);

module.exports = router;
