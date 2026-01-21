import { validateCCCD, getAgeFromCCCD, validateCCCDAgeForGroup } from './cccd.util';

describe('CCCD Utility', () => {
    describe('validateCCCD', () => {
        it('should validate correct CCCD (Hanoi, Male, 2003)', () => {
            // 001 (Hanoi) + 2 (Male 21st) + 03 (2003) + random
            const result = validateCCCD('001203012345');
            expect(result.isValid).toBe(true);
            expect(result.birthYear).toBe(2003);
            expect(result.gender).toBe('MALE');
            expect(result.provinceCode).toBe('001');
            // Age depends on current year, but logic ensures it's correct
        });

        it('should validate correct CCCD (HCMC, Female, 1995)', () => {
            // 079 (HCMC) + 1 (Female 20th) + 95 (1995) + random
            const result = validateCCCD('079195012345');
            expect(result.isValid).toBe(true);
            expect(result.birthYear).toBe(1995);
            expect(result.gender).toBe('FEMALE');
        });

        it('should reject invalid length', () => {
            const result = validateCCCD('001203');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('12 digits');
        });

        it('should reject invalid characters', () => {
            const result = validateCCCD('001203ABCDEF');
            expect(result.isValid).toBe(false);
        });

        it('should reject invalid province code', () => {
            const result = validateCCCD('999203012345');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('province code');
        });
    });

    describe('validateCCCDAgeForGroup', () => {
        it('should accept valid age for group (Student 18-25)', () => {
            // Mock current year as 2026 implies 2003 is 23 years old
            // 001 2 03 ...
            // Age ~23 (in 2026)
            const result = validateCCCDAgeForGroup('001203012345', 18, 25);
            expect(result.isValid).toBe(true);
        });

        it('should reject age below minimum', () => {
            // Born 2020 -> 6 years old (in 2026)
            // 001 3 20 ... (Male 21st, 2020) -> Wait, 20 is 2020. 
            // 21st Century Male is '2'. 
            const result = validateCCCDAgeForGroup('001220012345', 18, 25);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('below minimum');
        });

        it('should reject age above maximum', () => {
            // Born 1990 -> 36 years old (in 2026) -> Too old for student
            // 001 0 90 ... (Male 20th, 1990) -> Century 20th Male is '0'
            const result = validateCCCDAgeForGroup('001090012345', 18, 25);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('above maximum');
        });
    });
});
