// ghlStageMapping.js - GHL Stage IDs for the "General Renovations" pipeline

const ghlStageMapping = {
  // Name to ID mapping
  nameToId: {
    'Lead': '608785ee-9114-47d2-a8c4-f26c35bf64bc',
    'Website Lead': 'fec6cae3-7826-4904-a57a-ef94123ce56a',
    'No Pick-up 1': '93acf5ff-f95b-48ff-aa0b-eda0ef1113a5',
    'No Pick-up 2': '2b3cee41-8141-49f9-b86c-8a03c90cc004',
    'No Pick-up 3': '6b88cc02-bca1-4d85-a54f-3b2963a26ec3',
    'No Pick-up 4': 'e89781cc-9324-4a37-8195-27e1498127af',
    'No Pick-up 5': '64a9ec5f-cf13-41c7-8986-170ef4bc5cfd',
    'No Pick-up Drip': 'dc653eb6-700a-4cc9-ae9c-b615886ad1c9',
    'Follow Up (Long Term)': '5fed938b-6056-4d2d-91a4-6bc398f1a0d1',
    'Follow Up (No Automations)': '22929cb7-df56-42d2-9092-2543944c8ab1',
    'In Contact': 'bf4b7132-a0b1-498e-bde6-74ca857db452',
    'Invalid #': '7ce9a782-164f-440b-9220-a1553585fb33',
    'Never Answered': '7fe830a7-e905-4176-9818-eafd6d964e53',
    'Appointment Scheduled': '4c5fb7ac-5f74-4f00-a4b2-65d0ab3ee725',
    'Submitted': 'e847993d-6363-4b07-99d0-6d0cb411b330',
    'Proposal Viewed': '959f08a1-d63e-41d7-9787-7a7a30d135f3',
    'Awaiting Schedule Date': '824b7ed9-da07-473c-9b4d-e335a3717d30',
    'Work Scheduled': '3a2f4863-49a5-4e33-854a-8d97e02ec9ac',
    'Call Backs': '3322a4e5-8ebb-4499-84b3-ba28d7a26b33',
    'Invoiced': '9d716b09-ae40-4533-acb3-56a4aaab01ca',
    'Paid': '4efbb11d-384f-4918-920e-eb5181feb20a',
    'Abandoned': '118c53d3-f25b-4cda-ae4f-fbcbd49de245'
  },
  
  // ID to Name mapping
  idToName: {
    'New Lead': 'Lead',
    'Website Lead': 'Website Lead',
    'No Pick-up 1': 'No Pick-up 1',
    'No Pick-up 2': 'No Pick-up 2',
    'No Pick-up 3': 'No Pick-up 3',
    'No Pick-up 4': 'No Pick-up 4',
    'No Pick-up 5': 'No Pick-up 5',
    'No Pick-up Drip': 'No Pick-up Drip',
    'Follow Up (Long Term)': 'Follow Up (Long Term)',
    'Follow Up (No Automations)': 'Follow Up (No Automations)',
    'In Contact': 'In Contact',
    'Invalid #': 'Invalid #',
    'Never Answered': 'Never Answered',
    'Estimate Booked': 'Appointment Scheduled',
    'Submitted': 'Submitted',
    'Proposal Viewed': 'Proposal Viewed',
    'Awaiting Schedule Date': 'Awaiting Schedule Date',
    'Work Scheduled': 'Work Scheduled',
    'Call Backs': 'Call Backs',
    'Invoiced': 'Invoiced',
    'Paid': 'Paid',
    'Abandoned': 'Abandoned'
  }
};

// Default fallback stage ID (e.g., for unknown or unmapped stages)
const ghlDefaultStageId = process.env.GHL_DEFAULT_STAGE_ID;

module.exports = { ghlStageMapping, ghlDefaultStageId };
