const leapDivisionMapping = {
    nameToId: {
        "Roofing Division": "Exterior",
        "Exterior Division": "Exterior",
        "Interior Division": "Interior",
        "Repair Division" : "Exterior",
    },

    idToName: {
        "3435": "Roofing",
        "3436": "Exterior",
        "5313": "Interior",
        "5340": "Roofing",
    }
}

// Default fallback Division ID (e.g., for unknown or unmapped divisions)
const leapDefaultDivision = 'Roofing';

module.exports = { leapDivisionMapping, leapDefaultDivision };