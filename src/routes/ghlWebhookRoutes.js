const express = require('express');
const {  handleStageChangeWebhook, handleContactWebhook, handleOpportunityWebhook, handlePipelineChangeWebhook } = require('../controllers/ghlWebhookController');
const router = express.Router();

// Webhook to handle new GHL contact (customer)
router.post('/webhook/contact', handleContactWebhook);

// Webhook to handle new GHL job (opportunity)
router.post('/webhook/opportunity', handleOpportunityWebhook);

// Webhook to handle GHL opportunity stage change
router.post('/webhook/opportunity-stage', handleStageChangeWebhook);

// Webhook to handle GHL opportunity pipeline change
router.post('/webhook/pipeline-change', handlePipelineChangeWebhook);

module.exports = router;
