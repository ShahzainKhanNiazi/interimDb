const express = require('express');
const {  handleStageChangeWebhook, handleContactWebhook, handleOpportunityWebhook, handlePipelineChangeWebhook, handleEstimateBookingWebhook, handleJobsBookingWebhook } = require('../controllers/ghlWebhookController');
const router = express.Router();

// Webhook to handle new GHL contact (customer)
router.post('/webhook/contact', handleContactWebhook);

// Webhook to handle new GHL job (opportunity)
router.post('/webhook/opportunity', handleOpportunityWebhook);

// Webhook to handle GHL opportunity stage change
router.post('/webhook/opportunity-stage', handleStageChangeWebhook);

// Webhook to handle GHL opportunity pipeline change
router.post('/webhook/pipeline-change', handlePipelineChangeWebhook);

// Webhook to handle GHL estimate calendar appointment booking
router.post('/webhook/estimate-appointment-booked', handleEstimateBookingWebhook);

// Webhook to handle GHL jobs calendar appointment booking
router.post('/webhook/jobs-appointment-booked', handleJobsBookingWebhook);



module.exports = router;
