// leapStageMapping.js - Leap Stage Codes and their corresponding names

const leapStageMapping = {
  // Name to ID mapping
  nameToId: {
    'Lead': '180357123',
    'Appointment Scheduled': '165531012364911042',
    'Rep waiting on additional info': '16733634771228637712',
    'Submitted': '335467841',
    'Proposal Viewed': '16572092251817360313',
    'Brock': '1677160054488045747',
    'Rick': '16868403291486174852',
    'TJ': '16771600541524324923',
    'Nate': '16827022222028211618',
    'Dave': '16771600541471521141',
    'Jesse': '17067219482138561355',
    'Julian': '16831239612110624248',
    'Ayzaia': '1715873189582149174',
    'Vince': '1718218549665238792',
    'David': '17200105461004538543',
    'Awaiting Schedule Date': '1671633709217926122',
    'Pre Production': '17174182122052733381',
    'Work Scheduled': '483524782',
    'Punch List': '17067219481388879101',
    'On Hold': '1708434740176772537',
    'Call Backs': '16402277201884509087',
    'Invoiced': '16103926091526917496',
    'Paid': '161212102',
    'Disgruntled Customer': '16782833751263202179'
  },
  
  // ID to Name mapping
  idToName: {
    '180357123': 'Lead',
    '165531012364911042': 'Appointment Scheduled',
    '16733634771228637712': 'Rep waiting on additional info',
    '335467841': 'Submitted',
    '16572092251817360313': 'Proposal Viewed',
    '1677160054488045747': 'Brock',
    '16868403291486174852': 'Rick',
    '16771600541524324923': 'TJ',
    '16827022222028211618': 'Nate',
    '16771600541471521141': 'Dave',
    '17067219482138561355': 'Jesse',
    '16831239612110624248': 'Julian',
    '1715873189582149174': 'Ayzaia',
    '1718218549665238792': 'Vince',
    '17200105461004538543': 'David',
    '1671633709217926122': 'Awaiting Schedule Date',
    '17174182122052733381': 'Pre Production',
    '483524782': 'Work Scheduled',
    '17067219481388879101': 'Punch List',
    '1708434740176772537': 'On Hold',
    '16103926091526917496': 'Invoiced',
    '16402277201884509087': 'Call Backs',
    '161212102': 'Paid',
    '16782833751263202179': 'Disgruntled Customer'
  }
};

// Default fallback stage ID (e.g., for unknown or unmapped stages)
const leapDefaultStageId = process.env.LEAP_DEFAULT_STAGE_ID || '180357123';

module.exports = { leapStageMapping, leapDefaultStageId };
