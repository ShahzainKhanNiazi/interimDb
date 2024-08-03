const axios = require('axios');
require('dotenv').config();


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
    throw error;
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
      throw error;
    }
  };
  

  const fetchAllJobs = async (limit = 5) => {
    try {
      const response = await axios.get(`${process.env.LEAP_API_URL}/jobs`, {
        headers: {
          'Authorization': `Bearer ${process.env.LEAP_API_TOKEN}`
        },
        params: {
          limit
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching jobs from Leap:', error);
      throw error;
    }
  };
 
  const fetchAllCustomers = async (limit = 5) => {
    try {
      const response = await axios.get(`${process.env.LEAP_API_URL}/customers`, {
        headers: {
          'Authorization': `Bearer ${process.env.LEAP_API_TOKEN}`
        },
        params: {
          limit
        }
      });
      console.log('Response from Leap API:', response.data); // Log the response for debugging
      return response.data;
    } catch (error) {
      console.error('Error fetching customers from Leap:', error.response);
      throw error;
    }
  };

module.exports = { fetchJobById, fetchCustomerById, fetchAllJobs, fetchAllCustomers };
