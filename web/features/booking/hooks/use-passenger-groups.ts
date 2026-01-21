import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface PassengerGroup {
    id: string;
    code: string;
    name: string;
    discountRate: number;
    description?: string;
    minAge?: number;
    maxAge?: number;
}

const fetchPassengerGroups = async (): Promise<PassengerGroup[]> => {
    const response = await apiClient.get<PassengerGroup[]>('/passenger-groups');
    return response.data;
};

export const usePassengerGroups = () => {
    return useQuery({
        queryKey: ['passengerGroups'],
        queryFn: fetchPassengerGroups,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};

/**
 * Get passenger group by age
 */
export const getPassengerGroupByAge = (
    age: number,
    groups: PassengerGroup[]
): PassengerGroup | null => {
    // Find matching group based on age range
    const matchingGroup = groups.find((group) => {
        const minAge = group.minAge ?? 0;
        const maxAge = group.maxAge ?? 999;
        return age >= minAge && age <= maxAge;
    });

    return matchingGroup || null;
};

/**
 * Get CHILD passenger group
 */
export const getChildGroup = (groups: PassengerGroup[]): PassengerGroup | null => {
    return groups.find((g) => g.code === 'CHILD') || null;
};
