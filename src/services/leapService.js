const axios = require('axios');
require('dotenv').config();
const qs = require('qs');  // For encoding data in x-www-form-urlencoded format
const FormData = require('form-data');
const { ApiError } = require('../utils/errorHandler');



const fetchData = async (url, retries = 3, backoff = 1500) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${process.env.LEAP_API_TOKEN}`
      }
    });
    return response.data;
  } catch (error) {
    if (retries === 0) {
      console.error('Error fetching data from Leap:', error);
      throw new ApiError(error.response?.status || 500, 'Error fetching data from Leap', error.response?.data || error.message);
    } else {
      console.warn(`Retrying... ${retries} attempts left`);
      await new Promise(res => setTimeout(res, backoff));
      return fetchData(url, retries - 1, backoff * 2);
    }
  }
};

const fetchCustomerById = async (customerId) => {
  try {
    const response = await axios.get(`${process.env.LEAP_API_URL}/customers/${customerId}?includes[]=phones&includes[]=address&includes[]=rep`, {
      headers: {
        'Authorization': `Bearer ${process.env.LEAP_API_TOKEN}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching customer from Leap:', error);
    throw new ApiError(error.response?.status || 500, 'Error fetching customer from Leap', error.response?.data || error.message);
  }
};


const fetchJobById = async (jobId) => {
  try {
    const response = await axios.get(`${process.env.LEAP_API_URL}/jobs/${jobId}?includes[]=division&includes[]=trades`, {
      headers: {
        'Authorization': `Bearer ${process.env.LEAP_API_TOKEN}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching job from Leap:', error);
    throw new ApiError(error.response?.status || 500, 'Error fetching job from Leap', error.response?.data || error.message);
  }
};


const fetchAllJobs = async (limit = 5, page = 1) => {
  const url = `${process.env.LEAP_API_URL}/jobs?limit=${limit}&page=${page}`;
  try {
    const data = await fetchData(url);
    return data;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
};

const fetchAllCustomers = async (limit = 5, page = 1) => {
  const url = `${process.env.LEAP_API_URL}/customers?limit=${limit}&page=${page}&includes[]=phones&includes[]=address`;
  try {
    const data = await fetchData(url);
    return data;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
};

// Get financial summary for a job using fetchData helper
const getFinancialSummaryForJob = async (jobId) => {
  const url = `${process.env.LEAP_API_URL}/jobs/${jobId}/financial_summary`;  // Endpoint to get financial summary

  try {
    // Use fetchData helper to handle the request with retries
    const financialSummary = await fetchData(url);
    console.log(`Fetched financial summary for job ${jobId}:`, financialSummary);

    // Return the financial summary data
    return financialSummary?.data?.[0];
  } catch (error) {
    console.error(`Error fetching financial summary for job ${jobId}:`, error.message);
    throw new ApiError(
      error.response?.status || 500,
      `Failed to fetch financial summary for job ${jobId}`,
      error.response?.data || error.message
    );
  }
};

// Service methods for syncing GHL data to Leap

// Sync customer (contact) to Leap
// const syncCustomerToLeap = async (customerData) => {
//   try {
//     console.log("this is the customer to be synced with Leap");
//     console.log(customerData);
//     const data = qs.stringify(customerData);  // URL-encoded format for Leap API
//     const response = await axios.post(`${process.env.LEAP_API_URL}/customers`, data, {
//       headers: {
//         Authorization: `Bearer ${process.env.LEAP_API_TOKEN}`,
//         'Content-Type': 'application/x-www-form-urlencoded',
//       },
//     });
//     console.log('Customer synced to Leap:', response.data);
//     return response.data;
//   } catch (error) {
//     console.error('Error syncing customer to Leap:', error);
//     throw new ApiError(error.response?.status || 500, 'Error syncing customer to Leap', error.response?.data || error.message);
//   }
// };


// Add a note to a job
const addNoteToJob = async (jobId, noteContent) => {
  const url = `${process.env.LEAP_API_URL}/jobs/${jobId}/notes`;  // Endpoint to add a note to the job
  const formData = new FormData();
  formData.append('note', noteContent);  // Add the note content

  try {
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: url,
      headers: {
        'Authorization': `Bearer ${process.env.LEAP_API_TOKEN}`,
        ...formData.getHeaders()  // Add form headers
      },
      data: formData
    };

    const response = await axios(config);
    console.log(`Note added successfully to job ${jobId}:`, response.data);

    // Return the response from Leap
    return response.data;
  } catch (error) {
    console.error(`Error adding note to job ${jobId}:`, error.message);
    throw new ApiError(
      error.response?.status || 500,
      `Failed to add note to job ${jobId}`,
      error.response?.data || error.message
    );
  }
};

// Sync customer (contact) to Leap
const syncCustomerToLeap = async (customerData) => {
  try {
    console.log("This is the customer data being sent to Leap:", customerData);
    
    const data = qs.stringify(customerData);  // URL-encoded format for Leap API
    
    // Log the URL-encoded data being sent
    console.log("This is the URL-encoded data being sent to Leap:", data);
    
    const response = await axios.post(`${process.env.LEAP_API_URL}/customers`, data, {
      headers: {
        Authorization: `Bearer ${process.env.LEAP_API_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('Customer synced to Leap:', response.data);
    return response.data;

  } catch (error) {
    console.error('Error syncing customer to Leap:');
    
    // Log the entire error object for debugging
    console.error('Error Object:', error);
    
    // Check and log specific parts of the error object
    if (error.response) {
      console.error('Status Code:', error.response.status); // Log the status code
      console.error('Response Headers:', error.response.headers); // Log the response headers
      console.error('Error Data:', error.response.data); // Log the response data
      console.error('Request Data:', error.config.data); // Log the data sent in the request
    } else {
      console.error('No response received from Leap API');
    }

    // Log more details on the error config
    console.error('Error Config:', error.config);
    
    // Re-throw a custom error with detailed message and response data if available
    throw new ApiError(
      error.response?.status || 500, 
      'Error syncing customer to Leap', 
      error.response?.data || error.message
    );
  }
};




// Sync job (opportunity) to Leap
const syncJobToLeap = async (jobData) => {
  try {
    const data = qs.stringify(jobData);  // URL-encoded format for Leap API
    const response = await axios.post(`${process.env.LEAP_API_URL}/jobs`, data, {
      headers: {
        Authorization: `Bearer ${process.env.LEAP_API_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    console.log('Job synced to Leap:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error syncing job to Leap:', error);
    throw new ApiError(error.response?.status || 500, 'Error syncing job to Leap', error.response?.data || error.message);
  }
};

// Update job stage in Leap
const updateJobStageInLeap = async (jobId, stageCode) => {
  try {
    const data = new FormData();
    data.append('job_id', jobId);
    data.append('stage', stageCode);

    const response = await axios.post(`${process.env.LEAP_API_URL}/jobs/stage`, data, {
      headers: {
        Authorization: `Bearer ${process.env.LEAP_API_TOKEN}`,
        ...data.getHeaders(),  // Set headers including form-data headers
      },
    });

    console.log('Job stage updated in Leap:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating job stage in Leap:', error);
    throw new ApiError(error.response?.status || 500, 'Error updating job stage in Leap', error.response?.data || error.message);
  }
};

module.exports = {
  fetchJobById,
  fetchCustomerById,
  fetchAllJobs,
  fetchAllCustomers,
  syncCustomerToLeap,
  syncJobToLeap,
  updateJobStageInLeap,
  getFinancialSummaryForJob,
  addNoteToJob
};