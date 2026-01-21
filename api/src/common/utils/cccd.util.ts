/**
 * CCCD (Căn cước công dân) Validation Utility
 * 
 * CCCD format: 12 digits
 * - 3 digits: Province/City code (001-096)
 * - 1 digit: Century and gender code
 * - 2 digits: Birth year (last 2 digits)
 * - 6 digits: Random number
 * 
 * Century and gender codes:
 * - 20th century (1900-1999): Male=0, Female=1
 * - 21st century (2000-2099): Male=2, Female=3
 * - 22nd century (2100-2199): Male=4, Female=5
 * - 23rd century (2200-2299): Male=6, Female=7
 * - 24th century (2300-2399): Male=8, Female=9
 */

export interface CCCDInfo {
    isValid: boolean;
    provinceCode?: string;
    centuryGenderCode?: number;
    birthYear?: number;
    age?: number;
    gender?: 'MALE' | 'FEMALE';
    error?: string;
}

/**
 * Validate CCCD format and extract information
 */
export function validateCCCD(cccd: string): CCCDInfo {
    // 1. Check format: must be 12 digits
    if (!cccd || typeof cccd !== 'string') {
        return { isValid: false, error: 'CCCD must be a string' };
    }

    if (!/^\d{12}$/.test(cccd)) {
        return { isValid: false, error: 'CCCD must be exactly 12 digits' };
    }

    // 2. Extract components
    const provinceCode = cccd.substring(0, 3);
    const centuryGenderCode = parseInt(cccd.substring(3, 4));
    const birthYearLastTwo = parseInt(cccd.substring(4, 6));

    // 3. Validate province code (001-096)
    const provinceCodeNum = parseInt(provinceCode);
    if (provinceCodeNum < 1 || provinceCodeNum > 96) {
        return { isValid: false, error: 'Invalid province code (must be 001-096)' };
    }

    // 4. Validate century/gender code (0-9)
    if (centuryGenderCode < 0 || centuryGenderCode > 9) {
        return { isValid: false, error: 'Invalid century/gender code' };
    }

    // 5. Calculate birth year and age
    const currentYear = new Date().getFullYear();
    let birthYear: number;
    let gender: 'MALE' | 'FEMALE';

    switch (centuryGenderCode) {
        case 0: // Male, 20th century
            birthYear = 1900 + birthYearLastTwo;
            gender = 'MALE';
            break;
        case 1: // Female, 20th century
            birthYear = 1900 + birthYearLastTwo;
            gender = 'FEMALE';
            break;
        case 2: // Male, 21st century
            birthYear = 2000 + birthYearLastTwo;
            gender = 'MALE';
            break;
        case 3: // Female, 21st century
            birthYear = 2000 + birthYearLastTwo;
            gender = 'FEMALE';
            break;
        case 4: // Male, 22nd century
            birthYear = 2100 + birthYearLastTwo;
            gender = 'MALE';
            break;
        case 5: // Female, 22nd century
            birthYear = 2100 + birthYearLastTwo;
            gender = 'FEMALE';
            break;
        case 6: // Male, 23rd century
            birthYear = 2200 + birthYearLastTwo;
            gender = 'MALE';
            break;
        case 7: // Female, 23rd century
            birthYear = 2200 + birthYearLastTwo;
            gender = 'FEMALE';
            break;
        case 8: // Male, 24th century
            birthYear = 2300 + birthYearLastTwo;
            gender = 'MALE';
            break;
        case 9: // Female, 24th century
            birthYear = 2300 + birthYearLastTwo;
            gender = 'FEMALE';
            break;
        default:
            return { isValid: false, error: 'Invalid century/gender code' };
    }

    // 6. Validate birth year is reasonable (not in future, not too old)
    if (birthYear > currentYear) {
        return { isValid: false, error: 'Birth year cannot be in the future' };
    }

    if (birthYear < 1900) {
        return { isValid: false, error: 'Birth year too old (before 1900)' };
    }

    // 7. Calculate age
    const age = currentYear - birthYear;

    // 8. Validate age is reasonable (0-150)
    if (age < 0 || age > 150) {
        return { isValid: false, error: 'Invalid age calculated from CCCD' };
    }

    return {
        isValid: true,
        provinceCode,
        centuryGenderCode,
        birthYear,
        age,
        gender,
    };
}

/**
 * Get age from CCCD
 */
export function getAgeFromCCCD(cccd: string): number | null {
    const result = validateCCCD(cccd);
    return result.isValid ? result.age! : null;
}

/**
 * Check if CCCD age matches passenger group age range
 */
export function validateCCCDAgeForGroup(
    cccd: string,
    groupMinAge: number | null,
    groupMaxAge: number | null
): { isValid: boolean; error?: string; age?: number } {
    const result = validateCCCD(cccd);

    if (!result.isValid) {
        return { isValid: false, error: result.error };
    }

    const age = result.age!;

    // Check min age
    if (groupMinAge !== null && age < groupMinAge) {
        return {
            isValid: false,
            error: `Age ${age} is below minimum age ${groupMinAge} for this group`,
            age,
        };
    }

    // Check max age
    if (groupMaxAge !== null && age > groupMaxAge) {
        return {
            isValid: false,
            error: `Age ${age} is above maximum age ${groupMaxAge} for this group`,
            age,
        };
    }

    return { isValid: true, age };
}
