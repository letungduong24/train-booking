import { create } from 'zustand';
import apiClient from '@/lib/api-client';
import type { User } from '@/lib/schemas/user.schema';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isInitialized: boolean;

    // Actions
    setUser: (user: User | null) => void;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name?: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: false,
    isInitialized: false,

    setUser: (user) => set({ user }),

    login: async (email, password) => {
        set({ isLoading: true });
        try {
            const response = await apiClient.post<User>('/auth/login', { email, password });
            set({ user: response.data, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    register: async (email, password, name) => {
        set({ isLoading: true });
        try {
            const response = await apiClient.post<User>('/auth/register', { email, password, name });
            set({ user: response.data, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        set({ isLoading: true });
        try {
            await apiClient.post('/auth/logout');
            set({ user: null, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    checkAuth: async () => {
        set({ isLoading: true });
        try {
            const response = await apiClient.get<User>('/auth/profile');
            set({ user: response.data, isLoading: false, isInitialized: true });
        } catch (error) {
            // User not authenticated or token expired
            set({ user: null, isLoading: false, isInitialized: true });
        }
    },
}));
