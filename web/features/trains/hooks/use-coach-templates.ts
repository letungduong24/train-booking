import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { CoachTemplate } from '@/lib/schemas/coach.schema';

const fetchCoachTemplates = async () => {
    const response = await apiClient.get<CoachTemplate[]>('/coach-template');
    return response.data;
};

export const useCoachTemplates = () => {
    return useQuery({
        queryKey: ['coach-templates'],
        queryFn: fetchCoachTemplates,
    });
};
