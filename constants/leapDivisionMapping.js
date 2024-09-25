const leapDivisionMapping = {
    nameToId: {
        "Roofing Division": "Roofing",
        "Exterior Division": "Exterior",
        "Interior Division": "Interior",
        "Repair Division" : "General",
    },

    idToName: {
        "3435": "Roofing",
        "3436": "Exterior",
        "5313": "Interior",
        "5340": "General",
    }
}

// Default fallback Division ID (e.g., for unknown or unmapped divisions)
const leapDefaultDivision = 'General';

module.exports = { leapDivisionMapping, leapDefaultDivision };