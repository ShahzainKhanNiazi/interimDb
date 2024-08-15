const axios = require('axios');
require('dotenv').config();
const Customer = require('../models/Customer'); 
const { ApiError } = require('../utils/errorHandler');

const fetchData = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${process.env.LEAP_API_TOKEN}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data from Leap:', error);
    throw new ApiError(error.response?.status || 500, 'Error fetching data from Leap', error.response?.data || error.message);
  }
};

const fetchAndStoreAllCustomers = async () => {
  let page = 1;
  const limit = 30;
  let hasMore = true;

  while (hasMore) {
    try {
      const url = `${process.env.LEAP_API_URL}/customers?limit=${limit}&page=${page}`;
      const data = await fetchData(url);

      const customers = data.data.map(customer => ({
        customerId: customer.id,
        company_name: customer.company_name,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        additional_emails: customer.additional_emails,
        referred_by_type: customer.referred_by_type,
        referred_by_note: customer.referred_by_note,
        call_required: customer.call_required,
        appointment_required: customer.appointment_required,
        note: customer.note,
        is_commercial: Boolean(customer.is_commercial),
        created_at: new Date(customer.created_at),
        updated_at: new Date(customer.updated_at),
        deleted_at: customer.deleted_at ? new Date(customer.deleted_at) : null,
        management_company: customer.management_company,
        property_name: customer.property_name,
        canvasser_type: customer.canvasser_type,
        canvasser: customer.canvasser,
        call_center_rep_type: customer.call_center_rep_type,
        call_center_rep: customer.call_center_rep
      }));

        // Try to insert the customers, and catch any duplicate key errors
        try {
            await Customer.insertMany(customers, { ordered: false });
          } catch (error) {
            if (error.code === 11000) { // 11000 is the duplicate key error code
              console.error('Duplicate customer IDs found and skipped:', error.writeErrors.map(err => err.err.op.customerId));
            } else {
              throw error;
            }
          }

      console.log(`Page ${page} of ${data.meta.pagination.total_pages} processed successfully.`);

      hasMore = page < data.meta.pagination.total_pages;
      page++;
    } catch (error) {
      console.error('Error fetching or storing customers:', error);
      throw error;
    }
  }

  console.log('All customers have been migrated successfully.');
};

module.exports = { fetchAndStoreAllCustomers };
