const { fetchAllJobs, fetchAllCustomers } = require('../services/leapService.js');
const { handleError } = require('../utils/errorHandler');
const Job = require('../models/Job'); 
const Customer = require('../models/Customer');


const migrateCustomers = async (req, res) => {
  const { limit, page } = req.query;
  try {
    const { data: customersData } = await fetchAllCustomers(parseInt(limit) || 5, parseInt(page) || 1);
    const customers = customersData.map(customer => ({
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
    await Customer.insertMany(customers, { ordered: false });
    res.status(200).json({ message: 'Customers migrated successfully', count: customers.length });
  } catch (error) {
    handleError(res, error);
  }
};


const migrateJobs = async (req, res) => {
  const { limit, page } = req.query;
  try {
    const { data: jobsData } = await fetchAllJobs(parseInt(limit) || 5, parseInt(page) || 1);
    const jobs = jobsData.map(job => ({
      jobId: job.id,
      name: job.name,
      number: job.number,
      customer_id: job.customer_id,
      description: job.description,
      same_as_customer_address: Boolean(job.same_as_customer_address),
      other_trade_type_description: job.other_trade_type_description,
      created_by: job.created_by,
      created_at: new Date(job.created_at),
      created_date: new Date(job.created_date),
      updated_at: new Date(job.updated_at),
      deleted_at: job.deleted_at ? new Date(job.deleted_at) : null,
      call_required: job.call_required,
      appointment_required: job.appointment_required,
      tax_rate: job.tax_rate,
      alt_id: job.alt_id,
      lead_number: job.lead_number,
      duration: job.duration,
      completion_date: job.completion_date ? new Date(job.completion_date) : null,
      contract_signed_date: job.contract_signed_date ? new Date(job.contract_signed_date) : null,
      current_stage: job.current_stage,
      contact_same_as_customer: Boolean(job.contact_same_as_customer),
      insurance: Boolean(job.insurance),
      archived: Boolean(job.archived),
      hover_job_id: job.hover_job_id,
      awarded_date: job.awarded_date ? new Date(job.awarded_date) : null,
      stage_last_modified: new Date(job.stage_last_modified),
      multi_job: Boolean(job.multi_job),
    }));
    await Job.insertMany(jobs, { ordered: false });
    res.status(200).json({ message: 'Jobs migrated successfully', count: jobs.length });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
    migrateCustomers,
    migrateJobs
};
