const { fetchCustomerById, fetchJobById } = require('../services/leapService');
const { syncCustomerToGHL, syncOpportunityToGHL, updateOpportunityStageInGHL } = require('../services/ghlService');
const { mapCustomerToGHL, mapJobToGHL } = require('../utils/dataMapper');
const Customer = require('../models/Customer');
const Job = require('../models/Job');
const { leapStageMapping, leapDefaultStage } = require('../../constants/leapStageMapping');
const { ghlStageMapping, ghlDefaultStageId } = require('../../constants/ghlStageMapping');
const { leapDivisionMapping, leapDefaultDivision } = require('../../constants/leapDivisionMapping');
const { getPipelineStageId } = require('../helpers/getGhlPipelineStage');
const { ghlPipelineMapping } = require('../../constants/ghlPipelineMapping');

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
                                  originalSource: customerData.referred_by_type,
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
      originalSource: customerData.referred_by_type,
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
                  const leapStageName = leapStageMapping.idToName[notification.stage_moved_to.code] || leapDefaultStage;
                  let job = await Job.findOne({ leapJobId: notification.id });
              
                  // Step 1: If job doesn't exist, fetch from Leap, create, and sync
                  if (!job) {
                    const jobInfo = await fetchJobById(notification.id);
                    const jobData = jobInfo.data;
                    const customer = await handleCustomerSync(jobData.customer_id);
                    job = await handleJobCreationAndSync(jobData, customer, leapStageName);
                  }
              
                  // Step 2: If job exists but not synced, sync it
                  if (!job.synced) {
                    const customer = await Customer.findById(job.customerId);
                    if (!customer) throw new Error(`Customer with ID ${job.customerId} not found`);
                    const pipelineId = await ghlPipelineMapping.nameToId[job.pipeline] || ghlDefaultPipelineId;
                    const mappedOpportunityData = await mapJobToGHL(job, customer);
                    const ghlOpportunity = await syncOpportunityToGHL(mappedOpportunityData, pipelineId);
              
                    job.ghlJobId = ghlOpportunity.id;
                    job.synced = true;
                    await job.save();
                  }
              
                  // Step 3: If stage has not changed, return
                  if (job.currentStage === leapStageName) {
                    console.log(`Job ${notification.id} is already at stage ${leapStageName}. No update needed.`);
                    return;
                  }
              
                  // Step 4: Update job stage in MongoDB and sync with GHL if necessary
                  job.currentStage = leapStageName;
                  job.updatedAt = new Date();
                  await job.save();
              
                  if (syncStages.includes(leapStageName)) {
                    const pipelineId = await ghlPipelineMapping.nameToId[job.pipeline] || ghlDefaultPipelineId;
                    const pipelineStageId = await getPipelineStageId(pipelineId, leapStageName);
                    await updateOpportunityStageInGHL(job.ghlJobId, pipelineStageId);
                    console.log(`Job ${notification.id} stage updated in GHL.`);
                  }
                } catch (error) {
                  console.error(`Error handling job stage change: ${error.message}`);
                  errorOccurred = true;
                  result = { action: 'jobs', operation: 'stage_change', error: error.message };
                }

                 // Helper function to fetch or create a customer and sync with GHL
                 const handleCustomerSync = async (customerId) => {
                  try {
                    let customer = await Customer.findOne({ leapCustomerId: customerId });
                
                    if (!customer) {
                      console.warn(`Customer with Leap ID ${customerId} not found. Fetching from Leap...`);
                
                      const customerInfo = await fetchCustomerById(customerId);
                      const customerData = customerInfo.data;
                
                      const phoneNumber = customerData.phones?.data?.[0]?.number || '';
                      const leapCustomerRep = customerData.rep ? `${customerData.rep.first_name} ${customerData.rep.last_name}` : '';
                
                      // Create new customer in MongoDB
                      customer = new Customer({
                        leapCustomerId: customerData.id,
                        firstName: customerData.first_name,
                        lastName: customerData.last_name,
                        email: customerData.email,
                        phone: phoneNumber,
                        address: {
                          addressLine: customerData.address?.address || '',
                          city: customerData.address?.city || '',
                          state: customerData.address?.state?.name || '',
                          postalCode: customerData.address?.zip || ''
                        },
                        companyName: customerData.company_name || '',
                        customerRep: leapCustomerRep,
                        notes: customerData.note || '',
                        source: 'Leap',
                        originalSource: customerData.referred_by_type,
                        synced: false
                      });
                
                      await customer.save();
                      console.log(`Customer ${customerId} created in MongoDB.`);
                    }
                
                    // Sync customer with GHL if not synced
                    if (!customer.synced) {
                      console.log(`Customer ${customer.leapCustomerId} not synced with GHL. Syncing now...`);
                      const mappedCustomerData = mapCustomerToGHL(customer);
                      const ghlCustomer = await syncCustomerToGHL(mappedCustomerData);
                
                      customer.ghlCustomerId = ghlCustomer.contact.id;
                      customer.synced = true;
                      await customer.save();
                      console.log(`Customer ${customer.leapCustomerId} successfully synced with GHL.`);
                    }
                
                    return customer;
                  } catch (error) {
                    console.error(`Error fetching or syncing customer: ${error.message}`);
                    throw new Error(`Customer sync failed: ${error.message}`);
                  }
                };

                 // Helper function to handle job creation and sync
const handleJobCreationAndSync = async (jobData, customer, leapStageName) => {
  try {
    const leapDivisionName = leapDivisionMapping.nameToId[jobData?.division?.name] || leapDefaultDivision;
    const trades = jobData.trades?.data.map(trade => ({
      id: trade.id,
      name: trade.name
    })) || [];

    // Create job in MongoDB
    const newJob = new Job({
      leapJobId: jobData.id,
      name: jobData.name || 'Unnamed Job',
      customerId: customer._id,
      description: jobData.description || '',
      pipeline: leapDivisionName,
      currentStage: leapStageName,
      createdAt: jobData.created_at,
      updatedAt: jobData.updated_at,
      assignedTo: jobData.created_by || null,
      status: 'open',
      source: 'Leap',
      trades,
      synced: false
    });

    await newJob.save();
    console.log(`New job with ID ${jobData.id} created in MongoDB.`);

    // Check if the stage requires syncing
    if (!syncStages.includes(leapStageName)) {
      console.log(`Stage ${leapStageName} does not require syncing. No action taken.`);
      return newJob;
    }

    // Sync job with GHL
    const pipelineId = await ghlPipelineMapping.nameToId[newJob.pipeline] || ghlDefaultPipelineId;
    const mappedOpportunityData = await mapJobToGHL(newJob, customer);
    const ghlOpportunity = await syncOpportunityToGHL(mappedOpportunityData, pipelineId);

    newJob.ghlJobId = ghlOpportunity.id;
    newJob.synced = true;
    await newJob.save();
    console.log(`Job ${newJob.leapJobId} synced with GHL.`);

    return newJob;
  } catch (error) {
    console.error(`Error creating or syncing job: ${error.message}`);
    throw new Error(`Job sync failed: ${error.message}`);
  }
};   
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
