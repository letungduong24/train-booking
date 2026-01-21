/**
 * CCCD (Căn cước công dân) Validation Utility - Frontend
 * 
 * CCCD format: 12 digits
 * - 3 digits: Province/City code (001-096)
 * - 1 digit: Century and gender code
 * - 2 digits: Birth year (last 2 digits)
 * - 6 digits: Random number
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
        return { isValid: false, error: 'CCCD phải là chuỗi số' };
    }

    if (!/^\d{12}$/.test(cccd)) {
        return { isValid: false, error: 'CCCD phải có đúng 12 chữ số' };
    }

    // 2. Extract components
    const provinceCode = cccd.substring(0, 3);
    const centuryGenderCode = parseInt(cccd.substring(3, 4));
    const birthYearLastTwo = parseInt(cccd.substring(4, 6));

    // 3. Validate province code (001-096)
    const provinceCodeNum = parseInt(provinceCode);
    if (provinceCodeNum < 1 || provinceCodeNum > 96) {
        return { isValid: false, error: 'Mã tỉnh/thành không hợp lệ (001-096)' };
    }

    // 4. Validate century/gender code (0-9)
    if (centuryGenderCode < 0 || centuryGenderCode > 9) {
        return { isValid: false, error: 'Mã thế kỷ/giới tính không hợp lệ' };
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
            return { isValid: false, error: 'Mã thế kỷ/giới tính không hợp lệ' };
    }

    // 6. Validate birth year is reasonable
    if (birthYear > currentYear) {
        return { isValid: false, error: 'Năm sinh không thể ở tương lai' };
    }

    if (birthYear < 1900) {
        return { isValid: false, error: 'Năm sinh quá xa (trước 1900)' };
    }

    // 7. Calculate age
    const age = currentYear - birthYear;

    // 8. Validate age is reasonable
    if (age < 0 || age > 150) {
        return { isValid: false, error: 'Tuổi tính từ CCCD không hợp lệ' };
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
 * Format CCCD for display (add spaces for readability)
 * Example: 001203012345 -> 001 2 03 012345
 */
export function formatCCCDDisplay(cccd: string): string {
    if (!cccd || cccd.length !== 12) return cccd;
    return `${cccd.substring(0, 3)} ${cccd.substring(3, 4)} ${cccd.substring(4, 6)} ${cccd.substring(6)}`;
}

/**
 * Remove formatting from CCCD (remove spaces)
 */
export function cleanCCCD(cccd: string): string {
    return cccd.replace(/\s/g, '');
}
