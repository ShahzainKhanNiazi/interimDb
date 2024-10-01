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
        originalSource: customerData.source,
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
    console.log('Received GHL opportunity webhook:', opportunityData);

    // Extract contact information from the payload
    const contactData = {
      contactId: opportunityData.contact_id,
      firstName: opportunityData.first_name,
      lastName: opportunityData.last_name,
      email: opportunityData.email,
      // Remove the '+' sign from the phone number if it exists
      phone: opportunityData.phone ? opportunityData.phone.replace('+', '') : '',
      address: {
        addressLine: opportunityData.address1,
        city: opportunityData.city,
        state: opportunityData.state,
        postalCode: opportunityData.postal_code,
        country: opportunityData.country,
      },
      fullAddress: opportunityData.full_address,
      contactSource: opportunityData.contact_source,
      contactType: opportunityData.contact_type,
    };

    // Extract opportunity (job) information from the payload
    const jobData = {
      ghlJobId: opportunityData.id,
      name: opportunityData.opportunity_name,
      pipelineId: opportunityData.pipeline_id,
      pipelineStageName: opportunityData.pipleline_stage,
      status: opportunityData.status,
      createdAt: opportunityData.date_created,
      assignedTo: opportunityData.owner,
      source: opportunityData.opportunity_source || 'GHL',
    };

    // console.log('Contact Data:', contactData);
    // console.log('Opportunity Data:', jobData);

    // Step 1: Check if the job (opportunity) already exists in MongoDB
    let existingJob = await Job.findOne({ ghlJobId: jobData?.ghlJobId });

    // Step 2: Ensure the associated contact (customer) is synced first
    let customer = await Customer.findOne({ ghlCustomerId: contactData?.contactId });

    if (customer) {
      // console.log('Customer found in MongoDB:', customer);
    } else {
      console.log(`Customer with GHL ID ${contactData.contactId} not found in MongoDB. Creating new customer record.`);

      // Create new customer in MongoDB
      customer = new Customer({
        ghlCustomerId: contactData.contactId,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        email: contactData.email,
        phone: contactData.phone,
        address: {
          addressLine: contactData.address.addressLine || '',
          city: contactData.address.city || '',
          state: contactData.address.state || '',
          postalCode: contactData.address.postalCode || '',
          country: contactData.address.country || '',
        },
        companyName: '',
        customerRep: '',
        notes: '',
        source: 'GHL',
        originalSource: contactData.contactSource,
        synced: false,  // Not synced with Leap yet
      });
      await customer.save();
      console.log(`Customer ${contactData.contactId} created and saved in MongoDB.`);
    }

    // Sync customer with Leap if not already synced
    if (!customer?.synced) {
      console.log(`Customer ${customer?.ghlCustomerId} not synced with Leap. Syncing now...`);

      const mappedCustomerData = await mapCustomerToLeap(customer);  // Map customer to Leap's format
      console.log("this is the mapped customer for leap");
      console.log(mappedCustomerData);

      //sync customer with Leap
      try {   
      const leapCustomer = await syncCustomerToLeap(mappedCustomerData);  // Sync with Leap
      customer.leapCustomerId = leapCustomer.customer.id;  // Save Leap's customer ID
      customer.synced = true;
      await customer.save();
      console.log(`Customer ${customer.ghlCustomerId} successfully synced with Leap.`);
      } catch (error) {
        console.error(`Error syncing customer with Leap: ${error.message}`);
        res.status(500).send('Failed to sync customer with Leap');
        return;
      }
    }

    if (existingJob) {
      console.log(`Job with GHL Opportunity ID ${jobData.ghlJobId} already exists in MongoDB.`);
      // console.log(existingJob);

      // If the job is already synced, skip further processing
      if (existingJob?.synced) {
        console.log(`Job ${jobData.ghlJobId} is already synced with Leap. Skipping sync.`);
        return res.status(200).send('Job already synced');
      }
    } else {
      console.log(`Job not found in MongoDB. Creating a new job record.`);

      // Map pipeline name and stage from the mapping files
      const pipelineName = await ghlPipelineMapping.idToName[jobData.pipelineId];
      console.log("this is the pipeline name in the code ", pipelineName);
      const stageName = jobData?.pipelineStageName;
      console.log("this is the pipeline stage name from GHL ", stageName);


      // Create new job record in MongoDB
      existingJob = new Job({
        ghlJobId: jobData.ghlJobId,
        name: jobData.name || 'Unnamed Job',
        customerId: customer._id,  // Link the associated customer from MongoDB
        description: `This job was created in GoHighLevel ${pipelineName} Renovations pipeline and assigned to ${jobData.assignedTo} in GoHighLevel`,
        pipeline: pipelineName,  // Use the pipeline name from GHL or set a default
        currentStage: stageName,  // Use the pipeline stage name from GHL or default
        assignedTo: jobData.assignedTo,
        status: jobData.status,
        createdAt: jobData.createdAt,
        source: "GHL",
        originalSource: jobData.source,
        synced: false,
      });

      await existingJob.save();
      console.log(`Job ${jobData.ghlJobId} saved to MongoDB.`);
    }

    // Step 3: Map the opportunity data for Leap and store it in MongoDB
    const mappedJobData = mapJobToLeap(existingJob, customer);  // Mapping GHL job data to Leap format
    console.log('Mapped Job Data:', mappedJobData);

    // Step 4: Sync the job (opportunity) with Leap
    try {
      const leapJob = await syncJobToLeap(mappedJobData);
      existingJob.leapJobId = leapJob.job.id;  // Save Leap job ID
      existingJob.synced = true;
      await existingJob.save();
      console.log(`Job ${jobData.ghlJobId} successfully synced with Leap and updated in MongoDB.`);
      res.status(200).send('Job synced with Leap');
    } catch (error) {
      console.error(`Error syncing job with Leap: ${error.message}`);
      res.status(500).send('Failed to sync job with Leap');
    }
  } catch (error) {
    console.error('Error handling GHL opportunity webhook:', error);
    res.status(500).send('Error handling opportunity webhook');
  }
};



// Handle GHL opportunity stage change webhook
const handleStageChangeWebhook = async (req, res) => {
  try {
    
    const { id: opportunityId,  pipleline_stage: pipeline_stage, pipeline_id: pipelineId, pipeline_name } = req.body;  // Extracting fields from the payload
    console.log('Received GHL opportunity stage change webhook:', req.body);
    console.log(`This is the pipeline stage in GHL ${pipeline_stage}`);

    // Step 1: Find the job in MongoDB by GHL job ID
    let job = await Job.findOne({ ghlJobId: opportunityId });

     // Step 2: Ensure the associated contact (customer) is synced first
   let customer = await Customer.findOne({ ghlCustomerId: req.body?.contact_id });


 if (customer) {
   // console.log('Customer found in MongoDB:', customer);
 } else {
   console.log(`Customer with GHL ID ${req.body?.contact_id} not found in MongoDB. Creating new customer record.`);

   // Create new customer in MongoDB
   customer = new Customer({
    ghlCustomerId: req.body?.contact_id,
    firstName: req.body?.first_name,
    lastName: req.body?.last_name,
    email: req.body?.email,
    phone: req.body?.phone ? req.body.phone.replace('+', '') : '', // Remove '+' from phone
    address: {
      addressLine: req.body?.address1 || '',
      city: req.body?.city || '',
      state: req.body?.state || '',
      postalCode: req.body?.postal_code || '',
      country: req.body?.country || '',
    },
    companyName: req.body?.companyName || '',
    customerRep: '',
    notes: '',
    source: 'GHL',
    originalSource: req.body?.contact_source,
    synced: false, // Customer is not yet synced with Leap
  });
   await customer.save();
   console.log(`Customer ${req.body?.contact_id} created and saved in MongoDB.`);
 }

 // Sync customer with Leap if not already synced
 if (!customer?.synced) {
   console.log(`Customer ${customer?.ghlCustomerId} not synced with Leap. Syncing now...`);

   const mappedCustomerData = await mapCustomerToLeap(customer);  // Map customer to Leap's format
   console.log("this is the mapped customer for leap");
   console.log(mappedCustomerData);

   //sync customer with Leap
   try {   
   const leapCustomer = await syncCustomerToLeap(mappedCustomerData);  // Sync with Leap
   customer.leapCustomerId = leapCustomer.customer.id;  // Save Leap's customer ID
   customer.synced = true;
   await customer.save();
   console.log(`Customer ${customer.ghlCustomerId} successfully synced with Leap.`);
   } catch (error) {
     console.error(`Error syncing customer with Leap: ${error.message}`);
     res.status(500).send('Failed to sync customer with Leap');
     return;
   }
 }

 if (job) {
   console.log(`Job with GHL Opportunity ID ${job.ghlJobId} already exists in MongoDB.`);
   

   // If the job is already synced, skip further processing
   if (job?.synced) {
     console.log(`Job ${job.ghlJobId} is already synced with Leap. Skipping sync.`);
     return res.status(200).send('Job already synced');
   }
 } else {
   console.log(`Job not found in MongoDB. Creating a new job record.`);

   // Map pipeline name and stage from the mapping files
   const pipelineName = await ghlPipelineMapping.idToName[pipelineId];
   console.log("this is the pipeline name in the code ", pipelineName);
   const stageName = pipeline_stage;
   console.log("this is the pipeline stage name from GHL ", stageName);


   // Create new job record in MongoDB
   job = new Job({
        ghlJobId: opportunityId,
        name: req.body?.opportunity_name || 'Unnamed Job',
        customerId: customer && customer._id,  // Link associated customer
        description: `This job was created in GoHighLevel ${pipelineName} Renovations pipeline and assigned to ${req.body?.owner} in GoHighLevel`,
        pipeline: pipelineName || 'Default Pipeline',  // Map the pipeline ID from GHL or use default
        currentStage: stageName,  // Use the pipeline stage name from GHL
        status: req.body?.status,
        assignedTo: req.body?.owner,
        createdAt: req.body?.date_created,
        source: "GHL",
        originalSource: req.body?.opportunity_source,   
        synced: false, // Mark as not synced with Leap yet
  });
      
   await job.save();
   console.log(`Job ${job.ghlJobId} saved to MongoDB.`);
 }


 if (!job.synced) {
  // Step 3: Map the opportunity data for Leap and store it in MongoDB
 const mappedJobData = mapJobToLeap(job, customer);  // Mapping GHL job data to Leap format
 console.log('Mapped Job Data:', mappedJobData);

 // Step 4: Sync the job (opportunity) with Leap
 try {
   const leapJob = await syncJobToLeap(mappedJobData);
   job.leapJobId = leapJob.job.id;  // Save Leap job ID
   job.synced = true;
   await job.save();
   console.log(`Job ${job.ghlJobId} successfully synced with Leap and updated in MongoDB.`);
   res.status(200).send('Job synced with Leap');
 } catch (error) {
   console.error(`Error syncing job with Leap: ${error.message}`);
   res.status(500).send('Failed to sync job with Leap');
 }

 }

    // Step 5: Get the GHL stage name using the stage ID
    const ghlStageName = pipeline_stage;

    if (!ghlStageName) {
      console.error(`Stage name not found for GHL stage : ${pipeline_stage}`);
      return res.status(400).send('Invalid stage ID');
    }

    // Step 6: Only sync specific stages from GHL to Leap
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

    // Step 7: Check if the stage has actually changed before updating
    if (job.currentStage === ghlStageName) {
      console.log(`Job ${opportunityId} is already at stage ${ghlStageName}. No update needed.`);
      return res.status(200).send('No stage change detected');
    }

    // Step 8: Update job stage in MongoDB
    job.currentStage = ghlStageName;
    job.updatedAt = new Date();  // Update the timestamp
    await job.save();

    console.log(`Job ${opportunityId} stage updated to ${ghlStageName} in MongoDB.`);

    
    // If the stage change is not in the list, return without syncing
    if (!syncStages.includes(ghlStageName)) {
      console.log(`Stage ${ghlStageName} does not require syncing. No action taken.`);
      return res.status(200).send('Stage change not relevant for syncing');
    }

    // Step 9: Map GHL stage name to Leap stage ID
    const leapStageId = leapStageMapping.nameToId[ghlStageName] || leapDefaultStageId;

    if (!leapStageId) {
      console.error(`Leap stage ID not found for GHL stage: ${ghlStageName}`);
      return res.status(400).send('Invalid stage mapping');
    }

    // Step 10: Sync the updated job stage with Leap
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


// Controller method to handle pipeline change webhook
const handlePipelineChangeWebhook = async (req, res) => {
  try {
    const { id: opportunityId, pipeline_id: pipelineId, pipleline_stage: pipeline_stage } = req.body; // Extracting fields from the payload
    console.log('Received GHL opportunity pipeline change webhook:', req.body);

    // Step 1: Find the job in MongoDB by GHL job ID
    let job = await Job.findOne({ ghlJobId: opportunityId });

    // Step 2: Check if the job exists in MongoDB
    if (!job) {
      console.error(`Job with GHL ID ${opportunityId} not found in MongoDB.`);
      return res.status(404).send('Job not found');
    }

    // Step 3: Look up the pipeline name using the incoming pipeline ID
    const pipelineName = await ghlPipelineMapping.idToName[pipelineId];
    const stageName = pipeline_stage;
    console.log(`Incoming GHL opportunity pipeline name ${pipelineName}`);
    console.log(`MongoDB job current stage ${job.pipeline}`);



    if (!pipelineName) {
      console.error(`Pipeline ID ${pipelineId} not found in GHL pipeline mapping.`);
      return res.status(400).send('Invalid pipeline ID');
    }

    if (!stageName) {
      console.error(`Stage name ${stageName} not found in GHL stage mapping.`);
      return res.status(400).send('Invalid stage name');
    }

    // Step 4: Compare the incoming pipeline name with the job's current pipeline value in MongoDB
    if (job.pipeline === pipelineName) {
      console.log(`Job ${opportunityId} is already in pipeline: ${pipelineName}. No update required.`);
      return res.status(200).send('No pipeline change detected');
    }

    // Step 5: Update the job's pipeline field in MongoDB if the pipeline has changed
    job.pipeline = pipelineName;
    job.currentStage = stageName;
    job.updatedAt = new Date();  // Update the timestamp
    await job.save();

    console.log(`Job ${opportunityId} pipeline updated to ${pipelineName} in MongoDB.`);
    res.status(200).send('Pipeline updated successfully');

  } catch (error) {
    console.error('Error handling GHL opportunity pipeline change webhook:', error);
    res.status(500).send('Error handling pipeline change webhook');
  }
};





module.exports = {
  handleContactWebhook,
  handleOpportunityWebhook,
  handleStageChangeWebhook,
  handlePipelineChangeWebhook
};
