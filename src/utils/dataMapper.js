const { ghlStageMapping, ghlDefaultStageId } = require('../../constants/ghlStageMapping');  // Import the mapping table
const {leapStageMapping, leapDefaultStageId} = require('../../constants/leapStageMapping');  // Import the Leap stages mapping table


// Map MongoDB customer data to Leap customer format
exports.mapCustomerToLeap = (customer) => {
    return {
      first_name: customer.firstName,
      last_name: customer.lastName,
      email: customer.email,
      phones: [
        {
          label: 'primary',  
          number: customer.phone
        }
      ],
      address: {
        address: customer.address.addressLine || '',  
        city: customer.address.city || '',
        state_id: customer.address.state_id || null,  
        country_id: customer.address.country_id || 1, 
        zip: customer.address.postalCode || ''
      },
      company_name: customer.companyName || '',  
      is_commercial: customer.isCommercial || 0, 
      call_required: customer.callRequired || 0, 
      appointment_required: customer.appointmentRequired || 0,  
      note: customer.notes || ''  
    };
  };

  // Map MongoDB job data to Leap job format
exports.mapJobToLeap = (job, customer) => {
  
  const stageCode = leapStageMapping[job.currentStage] || leapDefaultStageId;
  const defaultTradeId = process.env.LEAP_DEFAULT_TRADE_ID
 


  return {
    customer_id: customer.leapCustomerId,  // Use Leap-specific customer ID
    name: job.name || 'Unnamed Job',  
    description: job.description || '',  
    call_required: job.callRequired || 0,  
    appointment_required: job.appointmentRequired || 0, 
    same_as_customer_address: job.sameAsCustomerAddress || 1,  
    address: job.address?.addressLine || customer.address?.addressLine || '',  
    city: job.address?.city || customer.address?.city || '',
    state_id: job.address?.state_id || customer.address?.state_id || null,
    country_id: job.address?.country_id || customer.address?.country_id || 1,
    zip: job.address?.postalCode || customer.address?.postalCode || '',
    duration: job.duration || '0:0:0',  
    trades: [defaultTradeId],  
    rep_ids: job.repIds || [], 
    estimator_ids: job.estimatorIds || [] 
  };
};

// // Map MongoDB customer data to GHL contact format
// exports.mapCustomerToGHL = (customer) => {
//   return {
//     firstName: customer.firstName,  
//     lastName: customer.lastName,    
//     email: customer.email || '',    
//     phone: customer.phone || '',
//     address1: customer.address?.addressLine || '',  
//     city: customer.address?.city || '',
//     state: customer.address?.state || '',
//     postalCode: customer.address?.postalCode || '',
//     companyName: customer.companyName || '',  
//     tags: customer.tags || ['leap-customer'],  
//     customField: 
//       {
//           "iU9cFhEGJCqkxIZeEAdg": customer.customerRep || '',
//       }
//   ,
//     dnd: customer.dnd || false,  
//     source: 'Leap'  
//   };
// };




// Map MongoDB customer data to GHL contact format (v2)
exports.mapCustomerToGHL = (customer) => {
  return {
    firstName: customer.firstName,  
    lastName: customer.lastName,    
    name: `${customer.firstName} ${customer.lastName}`,  // Full name field for v2
    email: customer.email || '',    
    phone: customer.phone || '',
    address1: customer.address?.addressLine || '',  
    city: customer.address?.city || '',
    state: customer.address?.state || '',
    postalCode: customer.address?.postalCode || '',
    companyName: customer.companyName || '',  
    locationId: process.env.GHL_LOCATION_ID,  // Required in v2 API, set via environment variable
    tags: customer.tags || ['leap-customer'],  

    // Map custom fields to the GHL v2 format
    customFields: [
      { id: 'iU9cFhEGJCqkxIZeEAdg', key: 'contact.leap_customer_rep', field_value: customer.customerRep || '' },
    ],
    dnd: customer.dnd || false, 
    // Source field as 'Leap' indicating the origin of this data
    source: 'Leap',
  };
};



// Map MongoDB job data to GHL opportunity format (for v2 API)
exports.mapJobToGHL = (job, customer) => {
  // Get the pipelineStageId dynamically from the stageMapping
  const pipelineStageId = ghlStageMapping.nameToId[job.currentStage] || ghlDefaultStageId;

  return {
    // Required fields
    pipelineId: process.env.GHL_PIPELINE_ID,  // Pipeline ID from the environment variables
    locationId: process.env.GHL_LOCATION_ID,  // Location ID for GHL (set in environment)
    pipelineStageId: pipelineStageId,  // ID of the stage in the pipeline

    name: `${customer?.firstName} ${customer?.lastName}`.trim() || '', 
    status: job?.status || 'open',  // Status of the opportunity (e.g., "open", "won", "lost")

    // GHL Contact
    contactId: customer?.ghlCustomerId,  // GHL Contact ID for the opportunity

    // Optional fields
    source: 'Leap',  // Source of the opportunity,

    // Custom fields
    customFields: [
      {
        key: 'leap_description',
        field_value: job?.description || "Untitled Job",  //  Job description or fallback to "Untitled Job"  //
      }, 
    ],
  };
};
