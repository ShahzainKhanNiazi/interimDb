const express = require('express');
const {  handleStageChangeWebhook, handleContactWebhook, handleOpportunityWebhook } = require('../controllers/ghlWebhookController');
const router = express.Router();

// Webhook to handle new GHL contact (customer)
router.post('/webhook/contact', handleContactWebhook);

// Webhook to handle new GHL job (opportunity)
router.post('/webhook/opportunity', handleOpportunityWebhook);

// Webhook to handle GHL job stage change
router.post('/webhook/opportunity-stage', handleStageChangeWebhook);

module.exports = router;
