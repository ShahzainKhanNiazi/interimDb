const { ghlPipelineMapping, ghlDefaultPipelineId } = require('../../constants/ghlPipelineMapping');
const { ghlStageMapping, ghlDefaultStageId } = require('../../constants/ghlStageMapping');  // Import the mapping table
const {leapStageMapping, leapDefaultStageId} = require('../../constants/leapStageMapping');  // Import the Leap stages mapping table
const { getPipelineStageId } = require('../helpers/getGhlPipelineStage');


// Map MongoDB customer data to Leap customer format
exports.mapCustomerToLeap = async (customer) => {
    return {
      'first_name': customer.firstName,
      'last_name': customer.lastName,
      'email': customer.email,
      'phones[0][label]':  'primary',
      'phones[0][number]': customer.phone,
      'address[address]': customer.address.addressLine,
      'address[city]': customer.address.city,
      'address[state_id]': '3',
      'address[country_id]': "1",
      'address[zip]': customer.address.postalCode,
      'company_name': customer.companyName || '',  
      'is_commercial': false, 
      'call_required':  false, 
      'appointment_required':  false,    
    };
  };

  // Map MongoDB job data to Leap job format
exports.mapJobToLeap = (job, customer) => {
  
  const stageCode = leapStageMapping[job.currentStage] || leapDefaultStageId;
  const defaultTradeId = process.env.LEAP_DEFAULT_TRADE_ID
 


  return {
    'customer_id': customer.leapCustomerId,  // Use Leap-specific customer ID
    'name': job.name || 'Unnamed Job',  
    'description': job.description,  
    'call_required': '0',  
    'appointment_required': '0', 
    'same_as_customer_address': '1',  
    'trades': [defaultTradeId],
  };
};

// // Map MongoDB customer data to GHL contact format
exports.mapCustomerToGHL = (customer) => {
  return {
    firstName: customer.firstName,  
    lastName: customer.lastName,    
    email: customer.email || '',    
    phone: customer.phone || '',
    address1: customer.address?.addressLine || '',  
    city: customer.address?.city || '',
    state: customer.address?.state || '',
    postalCode: customer.address?.postalCode || '',
    companyName: customer.companyName || '',  
    tags: customer.tags || ['leap-customer'],  
    customField: 
      {
          "iU9cFhEGJCqkxIZeEAdg": customer.customerRep || '',
      }
  ,
    dnd: customer.dnd || false,  
    source: 'Leap'  
  };
};




// Map MongoDB customer data to GHL contact format (v2)
// exports.mapCustomerToGHL = (customer) => {
//   return {
//     firstName: customer.firstName,  
//     lastName: customer.lastName,    
//     name: `${customer.firstName} ${customer.lastName}`,  // Full name field for v2
//     email: customer.email || '',    
//     phone: customer.phone || '',
//     address1: customer.address?.addressLine || '',  
//     city: customer.address?.city || '',
//     state: customer.address?.state || '',
//     postalCode: customer.address?.postalCode || '',
//     companyName: customer.companyName || '',  
//     locationId: process.env.GHL_LOCATION_ID,  // Required in v2 API, set via environment variable
//     tags: customer.tags || ['leap-customer'],  

//     // Map custom fields to the GHL v2 format
//     customFields: [
//       { id: 'iU9cFhEGJCqkxIZeEAdg', key: 'contact.leap_customer_rep', field_value: customer.customerRep || '' },
//     ],
//     dnd: customer.dnd || false, 
//     // Source field as 'Leap' indicating the origin of this data
//     source: 'Leap',
//   };
// };



// Map MongoDB job data to GHL opportunity format (for v2 API)
exports.mapJobToGHL = async (job, customer) => {
  // Get the pipelineStageId dynamically from the stageMapping
  const pipelineId =  await ghlPipelineMapping.nameToId[job.pipeline] || ghlDefaultPipelineId;
  const pipelineStageId = await getPipelineStageId(pipelineId, job.currentStage);

  return {
    // Required fields
    pipelineId: pipelineId,  // Pipeline ID from the environment variables
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
