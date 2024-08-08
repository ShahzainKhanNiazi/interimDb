const axios = require('axios');
require('dotenv').config();
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


const fetchJobById = async (jobId) => {
  try {
    const response = await axios.get(`${process.env.LEAP_API_URL}/jobs/${jobId}`, {
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

const fetchCustomerById = async (customerId) => {
  try {
    const response = await axios.get(`${process.env.LEAP_API_URL}/customers/${customerId}`, {
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
  const url = `${process.env.LEAP_API_URL}/customers?limit=${limit}&page=${page}`;
  try {
    const data = await fetchData(url);
    return data;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
};


module.exports = { fetchJobById, fetchCustomerById, fetchAllJobs, fetchAllCustomers };
