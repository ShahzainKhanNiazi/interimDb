const ghlPipelineMapping = {
    // Name to ID mapping
    nameToId: { 
        "DBR": "nORyeAZgpmV39K6dBcKF",
        "Exterior": "o6QJFWF5QWxqpARucf64",
        "General": "Wc6o32Vg6t56Qwlu2VLp",
        "Interior": "juyBxkktbTGIwUOvALvS",
        "Roofing": "eXfcepB9q0VKT1JicqXd",

    },
      // ID to Name mapping
  idToName: {
        "nORyeAZgpmV39K6dBcKF" : "DBR",
        "o6QJFWF5QWxqpARucf64" : "Exterior",
        "Wc6o32Vg6t56Qwlu2VLp" : "General",
        "juyBxkktbTGIwUOvALvS" : "Interior" ,
        "eXfcepB9q0VKT1JicqXd" : "Roofing",
  }
}

// Default fallback stage ID (e.g., for unknown or unmapped stages)
const ghlDefaultPipelineId = process.env.GHL_DEFAULT_PIPELINE_ID;
const ghlDefaultPipeline = "Roofing";


module.exports = { ghlPipelineMapping, ghlDefaultPipelineId, ghlDefaultPipeline };