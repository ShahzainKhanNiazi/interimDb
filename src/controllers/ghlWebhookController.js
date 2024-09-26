const { mapCustomerToLeap, mapJobToLeap } = require('../utils/dataMapper');
const { syncCustomerToLeap, syncJobToLeap, updateJobStageInLeap } = require('../services/leapService');
const Customer = require('../models/Customer');
const Job = require('../models/Job');
const { ghlDefaultStageId, ghlStageMapping } = require('../../constants/ghlStageMapping');
const { leapStageMapping, leapDefaultStageId } = require('../../constants/leapStageMapping');
const { fetchContactFromGHL } = require('../services/ghlService');
const { ghlPipelineMapping, ghlDefaultPipeline } = require('../../constants/ghlPipelineMapping');
const { getPipelineStageName, getPipelineStageId } = require('../helpers/getGhlPipelineStage');


// Handle GHL customer (contact) webhook
const handleContactWebhook = async (req, res) => {
  try {
    const customerData = req.body;  // GHL webhook payload for customer
    console.log('Received GHL customer webhook:', customerData);

    // Check if the customer already exists in MongoDB
    let existingCustomer = await Customer.findOne({ ghlCustomerId: customerData.id });

    if (existingCustomer) {
      console.log(`Customer with GHL ID ${customerData.id} already exists in MongoDB.`);
      
      // Check if the customer is already synced with Leap
      if (existingCustomer.synced) {
        console.log(`Customer ${customerData.id} is already synced with Leap. Skipping sync.`);
        return res.status(200).send('Customer already synced');
      }
    } else {
      // If customer is not in MongoDB, store it
      console.log(`Customer not found in MongoDB. Saving new customer.`);

      existingCustomer = new Customer({
        ghlCustomerId: customerData.id,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone,
        address: {
          addressLine: customerData.address1 || '',
          city: customerData.city || '',
          state: customerData.state || '',
          postalCode: customerData.postalCode || ''
        },
        companyName: customerData.companyName || '',
        customerRep: customerData.assignedTo || '',
        notes: '',
        source: 'GHL',
        synced: false  // Not synced yet with Leap
      });

      // Save the customer to MongoDB
      await existingCustomer.save();
      console.log(`GHL Contact ${customerData.id} saved to MongoDB.`);
    }

    // Map the customer data to Leap's format
    const mappedCustomerData = await mapCustomerToLeap(existingCustomer);

    // Sync the customer with Leap
    try {
      const leapResponse = await syncCustomerToLeap(mappedCustomerData);
      console.log('Customer successfully synced with Leap:', leapResponse);

      // Update the MongoDB record with Leap customer ID and mark as synced
      existingCustomer.leapCustomerId = leapResponse.customer.id;;  // Assuming Leap returns customerId
      existingCustomer.synced = true;
      await existingCustomer.save();

      console.log(`Customer ${existingCustomer.ghlCustomerId} synced and updated in MongoDB.`);
      res.status(200).send('Customer synced with Leap');
    } catch (error) {
      console.error('Error syncing customer with Leap:', error);
      res.status(500).send('Failed to sync customer with Leap');
    }

  } catch (error) {
    console.error('Error handling GHL customer webhook:', error);
    res.status(500).send('Error handling customer webhook');
  }
};



// Handle GHL opportunity (job) webhook
const handleOpportunityWebhook = async (req, res) => {
  try {
    const opportunityData = req.body;  // GHL webhook payload for opportunity
    console.log('Received GHL opportunity webhook:');
    console.log(opportunityData);

    // Extract necessary fields from the opportunity data
    // const { id: ghlOpportunityId, contactId, name, pipelineId, pipelineStageId } = opportunityData;

    const { id: ghlOpportunityId, contact_id, opportunity_name, pipeline_id: pipelineId, pipleline_stage: pipelineStageName, pipeline_name } = opportunityData;


    console.log("this is the opportunity_id from GHL");
      console.log(ghlOpportunityId);
    // Step 1: Check if the job (opportunity) already exists in MongoDB
    let existingJob = await Job.findOne({ ghlJobId: ghlOpportunityId });

    // Step 2: Ensure the associated contact (customer) is synced first
    let customer = await Customer.findOne({ ghlCustomerId: contact_id });

    if(customer){
      console.log("this is the customer found in MongoDB");
      console.log(customer);
    }

    if (!customer) {
      console.log(`Customer with GHL ID ${contact_id} not found in MongoDB. Fetching from GHL...`);
      // Fetch customer details from GHL and store in MongoDB
      const fetchedCustomer = await fetchContactFromGHL(contact_id);  // Fetch customer data from GHL API
      console.log("this is the contact fetched from GHL");
      console.log(fetchedCustomer);

      // customer = new Customer({
      //   ghlCustomerId: fetchedCustomer.id,
      //   firstName: fetchedCustomer.firstName,
      //   lastName: fetchedCustomer.lastName,
      //   email: fetchedCustomer.email,
      //   phone: fetchedCustomer.phone,
      //   address: {
      //     addressLine: fetchedCustomer.address1 || '',
      //     city: fetchedCustomer.city || '',
      //     state: fetchedCustomer.state || '',
      //     postalCode: fetchedCustomer.postalCode || ''
      //   },
      //   companyName: fetchedCustomer.companyName || '',
      //   customerRep: fetchedCustomer.assignedTo || '',
      //   notes: '',
      //   source: 'GHL',
      //   synced: false  // Not synced with Leap yet
      // });
      // await customer.save();
      // console.log(`Customer ${contactId} created and saved in MongoDB.`);
    }

    // Sync customer with Leap if not already synced
    if (!customer?.synced) {
      console.log(`Customer ${customer?.ghlCustomerId} not synced with Leap. Syncing now...`);

      // const mappedCustomerData = mapCustomerToLeap(customer);  // Map customer to Leap's format
      // const leapCustomer = await syncCustomerToLeap(mappedCustomerData);  // Sync with Leap
      // customer.leapCustomerId = leapCustomer.customer.id;  // Save Leap's customer ID
      // customer.synced = true;
      // await customer.save();
      // console.log(`Customer ${customer.ghlCustomerId} successfully synced with Leap.`);
    }

    if (existingJob) {
      console.log(`Job with GHL Opportunity ID ${ghlOpportunityId} already exists in MongoDB.`);

      // If the job is already synced, skip further processing
      if (existingJob?.synced) {
        console.log(`Job ${ghlOpportunityId} is already synced with Leap. Skipping sync.`);
        return res.status(200).send('Job already synced');
      }
    } else {
      console.log(`Job not found in MongoDB. Creating a new job record.`);



      const pipelineName =  await ghlPipelineMapping.idToName[pipelineId];
      const stageName = await getPipelineStageId(pipelineId, pipelineStageName);
      

      console.log("this is the opportunity name from GHL");
      console.log(opportunity_name);
      console.log("this is the pipeline name from GHL");
      console.log(pipeline_name);
      console.log("this is the GHL pipeline name in the code");
      console.log(pipelineName);
      console.log("this is the GHL pipeline stage Name");
      console.log(pipelineStageName);
      console.log("this is the GHL pipeline stage Id");
      console.log(stageName);
      

      // Create new job record in MongoDB
      // existingJob = new Job({
      //   ghlJobId: ghlOpportunityId,
      //   name: name || 'Unnamed Job',
      //   customerId: customer._id,  // Link the associated customer from MongoDB
      //   pipeline: pipelineName,  // Use the pipeline ID from GHL or set a default
      //   currentStage: stageName ,  // Use the pipeline stage name from GHL or default
      //   status: opportunityData.status,
      //   createdAt: opportunityData.dateAdded,
      //   synced: false
      // });

      // await existingJob.save();
      // console.log(`Job ${ghlOpportunityId} saved to MongoDB.`);
    }

    // Step 3: Map the opportunity data for Leap and store it in MongoDB
    // const mappedJobData = mapJobToLeap(existingJob, customer);  // Mapping GHL job data to Leap format
    // console.log("this is the mapped job data");
    // console.log(mappedJobData)

    // Step 4: Sync the job (opportunity) with Leap
    // try {
    //   const leapJob = await syncOpportunityToLeap(mappedJobData);
    //   existingJob.leapJobId = leapJob.job.id;  // Save Leap job ID
    //   existingJob.synced = true;
    //   await existingJob.save();
    //   console.log(`Job ${ghlOpportunityId} successfully synced with Leap and updated in MongoDB.`);
    //   res.status(200).send('Job synced with Leap');
    // } catch (error) {
    //   console.error(`Error syncing job with Leap: ${error.message}`);
    //   res.status(500).send('Failed to sync job with Leap');
    // }

    res.status(200).send('Opportunity received from GHL');


  } catch (error) {
    console.error('Error handling GHL opportunity webhook:', error);
    res.status(500).send('Error handling opportunity webhook');
  }
};

// Handle GHL opportunity stage change webhook
const handleStageChangeWebhook = async (req, res) => {
  try {
    const { id: opportunityId,  pipleline_stage: pipeline_stage } = req.body;  // Extracting fields from the payload
    console.log('Received GHL opportunity stage change webhook:', req.body);
    console.log(`This is the pipeline stage in GHL ${pipeline_stage}`);

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

        const mappedJobData = await mapJobToLeap(job, customer);

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
    const ghlStageName = pipeline_stage;

    if (!ghlStageName) {
      console.error(`Stage name not found for GHL stage : ${pipeline_stage}`);
      return res.status(400).send('Invalid stage ID');
    }

    // Step 4: Only sync specific stages from GHL to Leap
    const syncStages = [
      'Estimate Booked',
      'Submitted',
      'Proposal Viewed',
      'Awaiting Schedule Date',
      'Work Scheduled',
      'Invoiced',
      'Call Backs',
      'Paid',
    ];

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

    
    // If the stage change is not in the list, return without syncing
    if (!syncStages.includes(ghlStageName)) {
      console.log(`Stage ${ghlStageName} does not require syncing. No action taken.`);
      return res.status(200).send('Stage change not relevant for syncing');
    }

    // Step 7: Map GHL stage name to Leap stage ID
    const leapStageId = leapStageMapping.nameToId[ghlStageName] || leapDefaultStageId;

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
  handleContactWebhook,
  handleOpportunityWebhook,
  handleStageChangeWebhook
};
