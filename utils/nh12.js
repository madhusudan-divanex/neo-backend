import User from "../models/Hospital/User.js";


/**
 * Role → Entity Digit Mapping
 */
const roleToM = {
    patient: "4",
    doctor: "5",
    lab: "3",
    pharmacy: "6",
    hospital: "7",
    ambulance: "2",
    insurance: "8",
    institution: "1",
    staff: "9"
};

/**
 * Luhn Algorithm
 */
function generateLuhnDigit(number) {
    let sum = 0;
    let shouldDouble = true;

    for (let i = number.length - 1; i >= 0; i--) {
        let digit = parseInt(number[i]);

        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return (10 - (sum % 10)) % 10;
}

/**
 * Clean country code
 * - Remove "+"
 * - Keep only numeric
 * - Take first 2 digits
 */
function normalizeCountryCode(countryCode) {
    const numeric = countryCode.toString().replace(/\D/g, "");


    if (numeric.length < 2) {
        throw new Error("Country code must contain at least 2 digits");
    }

    return numeric.substring(0, 2);
}

/**
 * Assign or Update NH12
 */
export const assignNH12 = async (userId, countryCode) => {
    try {
        if (!userId || !countryCode) {
            throw new Error("Missing userId or countryCode");
        }
        
        console.log("in nh12",countryCode)
        const cleanedCountryCode = normalizeCountryCode(countryCode);

        const user = await User.findById(userId);
        
        console.log("NH12 assigned/updated successfully")
        if (!user) {
            throw new Error("User not found");
        }
        
        if (!user.unique_id || user.unique_id.length !== 8) {
            throw new Error("Invalid or missing unique_id (must be 8 digits)");
        }
        
        const M = roleToM[user.role];

        if (!M) {
            throw new Error("Invalid role for NH12 generation");
        }

        // Create first 11 digits
        const prefix11 = M + cleanedCountryCode + user.unique_id;
        console.log("prefix",prefix11)
        // Generate Luhn check digit
        const checkDigit = generateLuhnDigit(prefix11);

        const nh12 = prefix11 + checkDigit;

        // Save or Update
        user.nh12 = nh12;
        await user.save();
        return {
            success: true,
            message: "NH12 assigned/updated successfully",
            nh12
        };

    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
};
