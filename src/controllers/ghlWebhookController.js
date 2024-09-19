const { mapCustomerToLeap, mapJobToLeap } = require('../utils/dataMapper');
const { syncCustomerToLeap, syncJobToLeap, updateJobStageInLeap } = require('../services/leapService');
const Customer = require('../models/Customer');
const Job = require('../models/Job');
const { ghlDefaultStageId, ghlStageMapping } = require('../../constants/ghlStageMapping');
const { leapStageMapping } = require('../../constants/leapStageMapping');

// Handle GHL customer (contact) webhook
const handleCustomerWebhook = async (req, res) => {
  try {
    const customerData = req.body;  // GHL webhook payload for customer
    console.log('Received GHL customer webhook:', customerData);

    // Assuming customerData has an id and other relevant fields
    console.log(`GHL Customer created with ID: ${customerData.id}`);
    // Add your logic to handle customer creation here

    // Respond with 200 OK to acknowledge receipt
    res.status(200).send('Customer webhook received');
  } catch (error) {
    console.error('Error handling GHL customer webhook:', error);
    res.status(500).send('Error handling customer webhook');
  }
};

// Handle GHL opportunity (job) webhook
const handleJobWebhook = async (req, res) => {
  try {
    const opportunityData = req.body;  // GHL webhook payload for opportunity
    console.log('Received GHL opportunity webhook:', opportunityData);

    // Assuming opportunityData has an id and other relevant fields
    console.log(`GHL Opportunity created with ID: ${opportunityData.id}`);
    // Add your logic to handle job creation here

    // Respond with 200 OK to acknowledge receipt
    res.status(200).send('Opportunity webhook received');
  } catch (error) {
    console.error('Error handling GHL opportunity webhook:', error);
    res.status(500).send('Error handling opportunity webhook');
  }
};

// Handle GHL opportunity stage change webhook
const handleStageChangeWebhook = async (req, res) => {
  try {
    const { id: opportunityId, pipeline_stage } = req.body;  // Extracting fields from the payload
    console.log('Received GHL opportunity stage change webhook:', req.body);

    // Step 1: Find the job in MongoDB by GHL job ID
    let job = await Job.findOne({ ghlJobId: opportunityId });

    if (!job) {
      console.error(`Job with GHL ID ${opportunityId} not found in MongoDB.`);
      return res.status(404).send('Job not found in MongoDB');
    }

    // Step 2: If job exists, check if it is synced with Leap
    if (!job.synced) {
      console.log(`Job with GHL ID ${opportunityId} is not synced with Leap. Syncing now...`);

      try {
        const customer = await Customer.findById(job.customerId);
        if (!customer) {
          console.error(`Customer with ID ${job.customerId} not found.`);
          return res.status(404).send('Customer not found');
        }

        const mappedJobData = mapJobToLeap(job, customer);

        // Sync job with Leap
        const leapJob = await syncJobToLeap(mappedJobData);

        // Update MongoDB with Leap job ID and mark as synced
        job.leapJobId = leapJob.id;
        job.synced = true;
        await job.save();

        console.log(`Job with GHL ID ${opportunityId} successfully synced with Leap.`);
      } catch (syncError) {
        console.error(`Error syncing job to Leap: ${syncError.message}`);
        return res.status(500).send('Error syncing job to Leap');
      }
    }

    // Step 3: Get the GHL stage name using the stage ID
    const ghlStageName = ghlStageMapping.idToName[pipelineStageId] || ghlStageMapping.defaultStageId;

    if (!ghlStageName) {
      console.error(`Stage name not found for GHL stage ID: ${pipelineStageId}`);
      return res.status(400).send('Invalid stage ID');
    }

    // Step 4: Only sync specific stages from GHL to Leap
    const syncStages = [
       'Lead',
       'Appointment Scheduled',
       'Submitted',
       'Proposal Viewed',
       'Awaiting Schedule Date',
       'Work Scheduled',
       'Invoiced',
       'Call Backs',
       'Paid',
     ];

    // If the stage change is not in the list, return without syncing
    if (!syncStages.includes(ghlStageName)) {
      console.log(`Stage ${ghlStageName} does not require syncing. No action taken.`);
      return res.status(200).send('Stage change not relevant for syncing');
    }

    // Step 5: Check if the stage has actually changed before updating
    if (job.currentStage === ghlStageName) {
      console.log(`Job ${opportunityId} is already at stage ${ghlStageName}. No update needed.`);
      return res.status(200).send('No stage change detected');
    }

    // Step 6: Update job stage in MongoDB
    job.currentStage = ghlStageName;
    job.updatedAt = new Date();  // Update the timestamp
    await job.save();

    console.log(`Job ${opportunityId} stage updated to ${ghlStageName} in MongoDB.`);

    // Step 7: Map GHL stage name to Leap stage ID
    const leapStageId = leapStageMapping.nameToId[ghlStageName] || leapStageMapping.defaultStageId;

    if (!leapStageId) {
      console.error(`Leap stage ID not found for GHL stage: ${ghlStageName}`);
      return res.status(400).send('Invalid stage mapping');
    }

    // Step 8: Sync the updated job stage with Leap
    try {
      await updateJobStageInLeap(job.leapJobId, leapStageId);
      console.log(`Job ${opportunityId} stage updated in Leap to ${leapStageId}.`);
      res.status(200).send('Opportunity stage updated in Leap');
    } catch (stageSyncError) {
      console.error(`Error syncing job stage to Leap: ${stageSyncError.message}`);
      res.status(500).send('Error syncing job stage to Leap');
    }
  } catch (error) {
    console.error('Error handling GHL opportunity stage change webhook:', error);
    res.status(500).send('Error handling stage change webhook');
  }
};



module.exports = {
  handleCustomerWebhook,
  handleJobWebhook,
  handleStageChangeWebhook
};
