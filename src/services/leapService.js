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

// Service methods for syncing GHL data to Leap

// Sync customer (contact) to Leap
const syncCustomerToLeap = async (customerData) => {
  try {
    const data = qs.stringify(customerData);  // URL-encoded format for Leap API
    const response = await axios.post(`${process.env.LEAP_API_URL}/customers`, data, {
      headers: {
        Authorization: `Bearer ${process.env.LEAP_API_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    console.log('Customer synced to Leap:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error syncing customer to Leap:', error);
    throw new ApiError(error.response?.status || 500, 'Error syncing customer to Leap', error.response?.data || error.message);
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
};