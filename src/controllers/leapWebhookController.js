const { fetchCustomerById, fetchJobById } = require('../services/leapService');
const { syncCustomerToGHL, syncOpportunityToGHL, updateOpportunityStageInGHL } = require('../services/ghlService');
const { mapCustomerToGHL, mapJobToGHL } = require('../utils/dataMapper');
const Customer = require('../models/Customer');
const Job = require('../models/Job');
const { leapStageMapping, leapDefaultStage } = require('../../constants/leapStageMapping');
const { ghlStageMapping, ghlDefaultStageId } = require('../../constants/ghlStageMapping');
const { leapDivisionMapping, leapDefaultDivision } = require('../../constants/leapDivisionMapping');
const { getPipelineStageId } = require('../helpers/getGhlPipelineStage');

const handleWebhook = async (req, res) => {
  try {
    const notifications = req.body; // Webhook payload
    console.log('Notification received from Leap:', notifications);

    const results = []; // Array to hold results for each notification
    let errorOccurred = false; // Flag to track if any error occurs

    // Process each notification
    for (const notification of notifications) {
      let result = {}; // Object to hold the result for the current notification

      switch (notification.action) {
        // Handling customer creation
        case 'customers':
          if (notification.operation === 'create') {
              console.log(`Customer created with ID: ${notification.id}`);
      
              let existingCustomer;
              try {
                  // Check if customer already exists in MongoDB
                  existingCustomer = await Customer.findOne({ leapCustomerId: notification.id });
                  if (existingCustomer) {
                      console.log(`Customer with Leap ID ${notification.id} already exists in MongoDB.`);
      
                      // Check if customer is already synced with GHL
                      if (existingCustomer.synced) {
                          console.log(`Customer ${notification.id} is already synced with GHL. Skipping sync.`);
                          continue;
                      }
                  } else {
                      try {
                          // Fetch customer details from Leap using the service method
                          const customerInfo = await fetchCustomerById(notification.id);
                          const customerData = customerInfo.data;
      
                          // Extract the phone number safely and convert it to a string
                          const phoneNumber = customerData.phones?.data?.[0]?.number.toString();
                          // Extract the rep's first_name and last_name
                          const leapCustomerRep = customerData.rep ? `${customerData.rep.first_name} ${customerData.rep.last_name}` : '';
      
                          try {
                              // Store customer data in MongoDB
                              existingCustomer = new Customer({
                                  leapCustomerId: customerData.id,  // Leap customer ID
                                  firstName: customerData.first_name,
                                  lastName: customerData.last_name,
                                  email: customerData.email,
                                  phone: phoneNumber || '',  // First phone number
                                  address: {
                                      addressLine: customerData.address?.address || '',
                                      city: customerData.address?.city || '',
                                      state: customerData.address?.state?.name || '',
                                      postalCode: customerData.address?.zip || ''
                                  },
                                  companyName: customerData.company_name || '',
                                  customerRep: leapCustomerRep || '',
                                  notes: customerData.note || '',
                                  source: 'Leap',  // Source is Leap for customer data from Leap
                                  synced: false
                              });
      
                              await existingCustomer.save();
                              console.log(`Customer ${notification.id} saved to the database.`);
                          } catch (dbError) {
                              console.error(`Error saving customer ${notification.id} to the database:`, dbError);
                              continue; // Skip further processing if saving to MongoDB fails
                          }
      
                      } catch (fetchError) {
                          console.error(`Error fetching customer details from Leap for ID ${notification.id}:`, fetchError);
                          continue; // Skip further processing if fetching from Leap fails
                      }
                  }
              } catch (findError) {
                  console.error(`Error finding customer ${notification.id} in MongoDB:`, findError);
                  continue; // Skip further processing if finding in MongoDB fails
              }
      
              let mappedCustomerData;
              try {
                  // Map customer data for GHL
                  mappedCustomerData = mapCustomerToGHL(existingCustomer);
              } catch (mapError) {
                  console.error(`Error mapping customer data for GHL for ID ${notification.id}:`, mapError);
                  continue; // Skip syncing if mapping fails
              }
      
              try {
                  // Sync customer to GHL
                  const ghlCustomer = await syncCustomerToGHL(mappedCustomerData);
                  
                  // Update customer with GHL ID
                  existingCustomer.ghlCustomerId = ghlCustomer.contact.id;
                  existingCustomer.synced = true;
                  await existingCustomer.save();
              } catch (syncError) {
                  console.error(`Error syncing customer ${notification.id} to GHL:`, syncError);
                  continue; // Continue to next customer if sync fails
              }
          }
          break;

        // Handling job creation
        case 'jobs':
          if (notification.operation === 'create') {
            console.log(`Job created with ID: ${notification.id}`);
            try {
              // Fetch job details from Leap
              const jobInfo = await fetchJobById(notification.id);
              const jobData = jobInfo.data;
              
              // Check if job already exists in MongoDB to prevent duplicates
              const existingJob = await Job.findOne({ leapJobId: jobData.id });
              if (existingJob) {
                console.warn(`Job with ID ${jobData.id} already exists.`);
                console.log("This is the job fetched from MongoDB:");
                console.log(existingJob)

                // Check if the job is already synced with GHL
                if (existingJob.synced) {
                  console.log(`Job ${jobData.id} is already synced with GHL. Skipping sync.`);
                  continue; // Move to the next notification
                } else {
                  try {
                    console.log(`Job ${jobData.id} exists but is not synced. Proceeding with sync.`);
 

                    const existingCustomer = await Customer.findById(existingJob.customerId);
                       if (!existingCustomer) {
                             console.log(`Customer with ID ${existingJob.customerId} not found`);
                          }

                          console.log("this is the existing customer");
                    console.log(existingCustomer);

                    // Map existing job data for GHL
                    const mappedOpportunityData = await mapJobToGHL(existingJob, existingCustomer);

                const pipelineId =  await ghlPipelineMapping.nameToId[existingJob.pipeline] || ghlDefaultPipelineId;        

                    // Sync job (opportunity) to GHL
                    const ghlOpportunity = await syncOpportunityToGHL(mappedOpportunityData, pipelineId);
                    console.log("Opportunity response returned from GHL:");
                    console.log(ghlOpportunity);

                    // Update job with GHL opportunity ID and set it as synced
                    existingJob.ghlJobId = ghlOpportunity.id;
                    existingJob.synced = true;
                    await existingJob.save();

                    result = { action: 'jobs', operation: 'sync', status: 'Job synced with GHL', jobId: existingJob._id };
                  } catch (error) {
                    console.error(`Error syncing existing job with GHL: ${error.message}`);
                    errorOccurred = true;
                    result = { action: 'jobs', operation: 'sync', error: error.message };
                  }
                }
                continue; // Skip job creation since it already exists
              }

              // Step 1: Fetch and Sync Customer from Leap
let customer;
try {
  customer = await Customer.findOne({ leapCustomerId: jobData.customer_id });

  if (!customer) {
    // Customer does not exist, fetch from Leap and create in MongoDB
    console.warn(`Customer with Leap ID ${jobData.customer_id} not found. Fetching from Leap...`);

    // Fetch customer details from Leap
    const customerInfo = await fetchCustomerById(jobData.customer_id);
    const customerData = customerInfo.data;

    console.log("Customer fetched from Leap:");
    console.log(customerData);

    // Extract phone number and rep details
    const phoneNumber = customerData.phones?.data?.[0]?.number;
    const leapCustomerRep = customerData.rep ? `${customerData.rep.first_name} ${customerData.rep.last_name}` : '';

    // Store customer data in MongoDB
    customer = new Customer({
      leapCustomerId: customerData.id,
      firstName: customerData.first_name,
      lastName: customerData.last_name,
      email: customerData.email,
      phone: phoneNumber || '',
      address: {
        addressLine: customerData.address?.address || '',
        city: customerData.address?.city || '',
        state: customerData.address?.state?.name || '',
        postalCode: customerData.address?.zip || ''
      },
      companyName: customerData.company_name || '',
      customerRep: leapCustomerRep || '',
      notes: customerData.note || '',
      source: 'Leap',
      synced: false
    });
    await customer.save();
    console.log(`Customer ${jobData.customer_id} created in MongoDB.`);
  }

  // Step 2: If customer exists but is not synced, sync it with GHL
  if (!customer.synced) {
    console.log(`Customer ${customer.leapCustomerId} is not synced with GHL. Syncing now...`);

    // Sync the customer with GHL
    try {
      const mappedCustomerData = mapCustomerToGHL(customer);
      const ghlCustomer = await syncCustomerToGHL(mappedCustomerData);
      console.log("This is the GHL customer created:");
      console.log(ghlCustomer);

      // Update customer with GHL contact ID and set synced flag to true
      customer.ghlCustomerId = ghlCustomer.contact.id;
      customer.synced = true;
      await customer.save();
      console.log(`Customer ${customer.leapCustomerId} successfully synced with GHL.`);
    } catch (error) {
      console.error(`Error syncing customer with GHL: ${error.message}`);
      errorOccurred = true;
      result = { action: 'customers', operation: 'sync', error: error.message };
    }
  } else {
    console.log(`Customer ${customer.leapCustomerId} is already synced with GHL.`);
  }
} catch (error) {
  console.error(`Error fetching or creating customer: ${error.message}`);
  errorOccurred = true;
  result = { action: 'customers', operation: 'fetch', error: error.message };
}


              // Step 2: Create and Sync Job with GHL
              try {
                const trades = jobData.trades?.data.map(trade => ({
                  id: trade.id,
                  name: trade.name
                })) || [];

                const leapStageName = leapStageMapping.idToName[jobData?.current_stage?.code] || leapDefaultStage;
                const leapDivisionName = leapDivisionMapping.nameToId[jobData?.division?.name] || leapDefaultDivision;
                console.log("Leap stage name:", leapStageName);
                console.log("Leap division name:", leapDivisionName);

                console.log("this is the job fetched from Leap and now storing it into MongoDB");
                console.log(jobData)

                const job = new Job({
                  leapJobId: jobData.id,
                  name: jobData.name || 'Unnamed Job',
                  customerId: customer._id,
                  description: jobData.description || '',
                  pipeline: leapDivisionName || 'General',
                  currentStage: leapStageName || 'Unknown',
                  createdAt: jobData.created_at,
                  updatedAt: jobData.updated_at,
                  assignedTo: jobData.created_by || null,
                  status: 'open',
                  trades: trades,
                  source: 'Leap',
                  synced: false
                });

                await job.save();
                console.log(`Job ${notification.id} saved to the database.`);

                const mappedOpportunityData = await mapJobToGHL(job, customer);

                const pipelineId =  await ghlPipelineMapping.nameToId[job.pipeline] || ghlDefaultPipelineId;        

                try {
                  const ghlOpportunity = await syncOpportunityToGHL(mappedOpportunityData, pipelineId);
                  job.ghlJobId = ghlOpportunity.id;
                  job.synced = true;
                  await job.save();
                  result = { action: 'jobs', operation: 'create', status: 'Job synced with GHL', jobId: job._id };
                } catch (error) {
                  console.error(`Error syncing job with GHL: ${error.message}`);
                  errorOccurred = true;
                  result = { action: 'jobs', operation: 'sync', error: error.message };
                }
              } catch (error) {
                console.error(`Error creating job in MongoDB: ${error.message}`);
                errorOccurred = true;
                result = { action: 'jobs', operation: 'create', error: error.message };
              }
            } catch (error) {
              console.error(`Error fetching job details from Leap: ${error.message}`);
              errorOccurred = true;
              result = { action: 'jobs', operation: 'fetch', error: error.message };
            }
          }


          else if (notification.operation === 'stage_change') {
            console.log(`Job ID: ${notification.id} changed from ${notification.stage_moved_from.name} to ${notification.stage_moved_to.name}`);

             // Define the stages that should trigger a sync
                 const syncStages = [
                   'New Lead',
                   'Estimate Booked',
                   'Submitted',
                   'Proposal Viewed',
                   'Awaiting Schedule Date',
                   'Work Scheduled',
                   'Invoiced',
                   'Call Backs',
                   'Paid',
                 ];
          
            try {
              // Step 1: Check if the job exists in MongoDB
              let updatedJob = await Job.findOne({ leapJobId: notification.id });
          
              if (!updatedJob) {
                console.warn(`Job with Leap ID ${notification.id} not found in MongoDB. Creating a new job with the current stage.`);
          
                // Fetch job details from Leap to create a new job
                const jobInfo = await fetchJobById(notification.id);
                const jobData = jobInfo.data;
                
                // Step 1: Fetch and Sync Customer from Leap
let customer;
try {
  customer = await Customer.findOne({ leapCustomerId: jobData.customer_id });

  if (!customer) {
    // Customer does not exist, fetch from Leap and create in MongoDB
    console.warn(`Customer with Leap ID ${jobData.customer_id} not found. Fetching from Leap...`);

    // Fetch customer details from Leap
    const customerInfo = await fetchCustomerById(jobData.customer_id);
    const customerData = customerInfo.data;

    console.log("Customer fetched from Leap:");
    console.log(customerData);

    // Extract phone number and rep details
    const phoneNumber = customerData.phones?.data?.[0]?.number;
    const leapCustomerRep = customerData.rep ? `${customerData.rep.first_name} ${customerData.rep.last_name}` : '';

    // Store customer data in MongoDB
    customer = new Customer({
      leapCustomerId: customerData.id,
      firstName: customerData.first_name,
      lastName: customerData.last_name,
      email: customerData.email,
      phone: phoneNumber || '',
      address: {
        addressLine: customerData.address?.address || '',
        city: customerData.address?.city || '',
        state: customerData.address?.state?.name || '',
        postalCode: customerData.address?.zip || ''
      },
      companyName: customerData.company_name || '',
      customerRep: leapCustomerRep || '',
      notes: customerData.note || '',
      source: 'Leap',
      synced: false
    });
    await customer.save();
    console.log(`Customer ${jobData.customer_id} created in MongoDB.`);
  }

  // Step 2: If customer exists but is not synced, sync it with GHL
  if (!customer.synced) {
    console.log(`Customer ${customer.leapCustomerId} is not synced with GHL. Syncing now...`);

    // Sync the customer with GHL
    try {
      const mappedCustomerData = mapCustomerToGHL(customer);
      const ghlCustomer = await syncCustomerToGHL(mappedCustomerData);
      console.log("This is the GHL customer created:");
      console.log(ghlCustomer);

      // Update customer with GHL contact ID and set synced flag to true
      customer.ghlCustomerId = ghlCustomer.contact.id;
      customer.synced = true;
      await customer.save();
      console.log(`Customer ${customer.leapCustomerId} successfully synced with GHL.`);
    } catch (error) {
      console.error(`Error syncing customer with GHL: ${error.message}`);
      errorOccurred = true;
      result = { action: 'customers', operation: 'sync', error: error.message };
    }
  } else {
    console.log(`Customer ${customer.leapCustomerId} is already synced with GHL.`);
  }
} catch (error) {
  console.error(`Error fetching or creating customer: ${error.message}`);
  errorOccurred = true;
  result = { action: 'customers', operation: 'fetch', error: error.message };
}


                // Step 2: Get the stage name from Leap using the stage ID
                const leapStageName = leapStageMapping.idToName[notification.stage_moved_to.code] || leapDefaultStage;
                const leapDivisionName = leapDivisionMapping.nameToId[jobData?.division?.name] || leapDefaultDivision;
          
                if (!leapStageName) {
                  console.error(`Stage name not found for Leap stage ID: ${notification.stage_moved_to.id}`);
                  errorOccurred = true;
                  result = { action: 'jobs', operation: 'invalid_stage', error: 'Invalid stage ID' };
                  continue;
                }


                // Step 4: Create the new job in MongoDB
                try {
                  const trades = jobData.trades?.data.map(trade => ({
                    id: trade.id,
                    name: trade.name
                  })) || [];

                  console.log("this is the job fetched from Leap and now storing it into MongoDB");
                  console.log(jobData)


                  updatedJob = new Job({
                    leapJobId: jobData.id,
                    name: jobData.name || 'Unnamed Job',
                    customerId: customer._id,
                    description: jobData.description || '',
                    pipeline: leapDivisionName,
                    currentStage: leapStageName,
                    createdAt: jobData.created_at,
                    updatedAt: jobData.updated_at,
                    assignedTo: jobData.created_by || null,
                    status: 'open' || '',
                    source: 'Leap',
                    trades: trades,
                    synced: false
                  });

                  await updatedJob.save();
                  console.log(`New job with ID ${jobData.id} created in MongoDB.`);

                  // Step 3: Only sync relevant stages with GHL
                if (!syncStages.includes(leapStageName)) {
                  console.log(`Stage ${leapStageName} does not require syncing. No action taken.`);
                  result = { action: 'jobs', operation: 'stage_change', status: 'No sync required for this stage' };
                  continue;
                }

                // Get the pipelineId dynamically from the GHL pipelineMapping
                   const pipelineId =  await ghlPipelineMapping.nameToId[updatedJob.pipeline] || ghlDefaultPipelineId;


                  // Sync the job with GHL
                  try {
                    const mappedOpportunityData = await mapJobToGHL(updatedJob, customer);
                    const ghlOpportunity = await syncOpportunityToGHL(mappedOpportunityData, pipelineId);

                    updatedJob.ghlJobId = ghlOpportunity.id;
                    updatedJob.synced = true;
                    await updatedJob.save();
                    console.log(`Job ${jobData.id} synced with GHL.`);
                  } catch (error) {
                    console.error(`Error syncing new job with GHL: ${error.message}`);
                    errorOccurred = true;
                    result = { action: 'jobs', operation: 'sync_job', error: error.message };
                    continue;
                  }
                } catch (error) {
                  console.error(`Error creating new job in MongoDB: ${error.message}`);
                  errorOccurred = true;
                  result = { action: 'jobs', operation: 'create_job', error: error.message };
                  continue;
                }
              } 
              else {
                if(!updatedJob.synced) {
                  try {
                    console.log(`Job ${updatedJob.id} exists but is not synced. Proceeding with sync.`);
  
  
                    const existingCustomer = await Customer.findById(updatedJob.customerId);
                       if (!existingCustomer) {
                             console.log(`Customer with ID ${updatedJob.customerId} not found`);
                          }
  
                          console.log("this is the existing customer");
                    console.log(existingCustomer);
  
                    // Map existing job data for GHL
                    const mappedOpportunityData = await mapJobToGHL(updatedJob, existingCustomer);

                    
                // Get the pipelineId dynamically from the GHL pipelineMapping
                   const pipelineId =  await ghlPipelineMapping.nameToId[updatedJob.pipeline] || ghlDefaultPipelineId;
  
                    // Sync job (opportunity) to GHL
                    const ghlOpportunity = await syncOpportunityToGHL(mappedOpportunityData, pipelineId);
                    console.log("Opportunity response returned from GHL:");
                    console.log(ghlOpportunity);
  
                    // Update job with GHL opportunity ID and set it as synced
                    updatedJob.ghlJobId = ghlOpportunity.id;
                    updatedJob.synced = true;
                    await updatedJob.save();
  
                    result = { action: 'jobs', operation: 'sync', status: 'Job synced with GHL', jobId: updatedJob._id };
                  } catch (error) {
                    console.error(`Error syncing existing job with GHL: ${error.message}`);
                    errorOccurred = true;
                    result = { action: 'jobs', operation: 'sync', error: error.message };
                  }

                }  
              }
              

              // Step 5: Check for stage duplication before updating
              const leapStageName = leapStageMapping.idToName[notification.stage_moved_to.code] || leapStageMapping.defaultStageId;


              if (updatedJob.currentStage === leapStageName) {
                console.log(`Job ${notification.id} is already at stage ${leapStageName}. No update needed.`);
                result = { action: 'jobs', operation: 'stage_change', status: 'No stage change detected' };
                continue;
              }

              // Step 6: Update job stage in MongoDB
              try {
                updatedJob.currentStage = leapStageName; 
                updatedJob.updatedAt = new Date();
                await updatedJob.save();
                console.log(`Job ${notification.id} updated to stage ${leapStageName} in MongoDB.`);

                // Step 7: Only sync relevant stages with GHL
              if (!syncStages.includes(leapStageName)) {
                console.log(`Stage ${leapStageName} does not require syncing. No action taken.`);
                result = { action: 'jobs', operation: 'stage_change', status: 'No sync required for this stage' };
                continue;
              }

                // Step 8: Map Leap stage name to GHL pipeline stage ID
                const pipelineStageId = await getPipelineStageId(pipelineId, updatedJob.currentStage);


                if (!pipelineStageId) {
                  console.error(`GHL stage ID not found for Leap stage: ${leapStageName}`);
                  errorOccurred = true;
                  result = { action: 'jobs', operation: 'invalid_ghl_stage', error: 'Invalid GHL stage mapping' };
                  continue;
                }


                // Step 9: Sync the updated job stage with GHL
                try {
                  await updateOpportunityStageInGHL(updatedJob.ghlJobId, pipelineStageId);
                  console.log(`Job ${notification.id} stage updated in GHL to ${notification.stage_moved_to.name}.`);

                  result = {
                    action: 'jobs',
                    operation: 'stage_change',
                    leapData: updatedJob,
                    stageMovedFrom: notification.stage_moved_from,
                    stageMovedTo: notification.stage_moved_to,
                    status: 'Stage synced with GHL'
                  };
                } catch (error) {
                  console.error(`Error updating job stage in GHL: ${error.message}`);
                  errorOccurred = true;
                  result = { action: 'jobs', operation: 'sync_stage', error: error.message };
                }
              } catch (error) {
                console.error(`Error updating job stage in MongoDB: ${error.message}`);
                errorOccurred = true;
                result = { action: 'jobs', operation: 'update_stage', error: error.message };
              }
            } catch (error) {
              console.error(`Error handling job stage change: ${error.message}`);
              errorOccurred = true;
              result = { action: 'jobs', operation: 'stage_change', error: error.message };
            }
          }
          break;

          
        default:
          console.warn('Unknown action:', notification.action);
          result = { action: notification.action, operation: notification.operation, error: 'Unknown action or operation' };

      }

      // Add the result to the results array
      if (Object.keys(result).length > 0) {
        results.push(result);
      }
    }

     // If any error occurred, respond with 500 and the results
     if (errorOccurred) {
      return res.status(500).json({ message: 'Errors occurred during webhook processing', data: results });
    }

    // Respond with the results
// If no error, respond with 200 and the results
res.status(200).json({ message: 'Webhook processed successfully', data: results });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).send('Error handling webhook');
  }
};

module.exports = { handleWebhook };
