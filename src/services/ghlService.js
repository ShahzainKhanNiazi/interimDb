const axios = require('axios');
require('dotenv').config();
const { ApiError } = require('../utils/errorHandler');

// Helper function for making authenticated API calls to GHL (v2)
const ghlRequest = async (method, url, data = {}) => {
  try {
    const config = {
      method,
      maxBodyLength: Infinity,
      url: `${process.env.GHL_API_URL}${url}`,  // GHL API v2 base URL
      headers: {
        Authorization: `Bearer ${process.env.GHL_API_TOKEN}`,  // API token
        Version: '2021-07-28',  // Required API version for GHL v2
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      data,
    };
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in GHL API request: ${error.message}`);
    throw new ApiError(
      error.response?.status || 500,
      'Error in GHL API',
      error.response?.data || error.message
    );
  }
};

// Sync customer (contact) to GHL (already mapped data)
const syncCustomerToGHL = async (customerData) => {
  try {
    console.log(`Syncing customer to GHL: ${JSON.stringify(customerData)}`);
    
    // Since customerData is already mapped in the required GHL API format, we simply pass it
    const response = await ghlRequest('post', '/contacts/', customerData);  // Directly sending customerData
    console.log('Customer synced to GHL:', response);
    
    return response;
  } catch (error) {
    console.error('Error syncing customer to GHL:', error);
    throw error;
  }
};

module.exports = {
  syncCustomerToGHL,
};


// Sync opportunity (job) to GHL (already mapped data)
const syncOpportunityToGHL = async (opportunityData) => {
  try {
    console.log(`Syncing opportunity to GHL: ${JSON.stringify(opportunityData)}`);

    // Sending the POST request to the v2 endpoint for creating an opportunity
    let response = await ghlRequest('post', '/opportunities/', opportunityData);

    console.log('Opportunity synced to GHL:', response.opportunity);
    response = response.opportunity;
    return response;
  } catch (error) {
    console.error('Error syncing opportunity to GHL:', error);
    throw error;
  }
};


// Update opportunity stage in GHL (already mapped stage data)
const updateOpportunityStageInGHL = async (opportunityId, pipelineStageId) => {
  try {
    console.log(`Updating opportunity ${opportunityId} to stage ${pipelineStageId}`);
    
    // Perform the PUT request to update the opportunity stage in GHL
    const response = await ghlRequest('put', `/opportunities/${opportunityId}`, {
      pipelineStageId: pipelineStageId,  // Pass the new stage ID
    });
    
    console.log(`Opportunity stage updated in GHL: ${JSON.stringify(response)}`);
    return response;
  } catch (error) {
    console.error('Error updating opportunity stage in GHL:', error);
    throw error;
  }
};

module.exports = {
  syncCustomerToGHL,
  syncOpportunityToGHL,
  updateOpportunityStageInGHL,
};
