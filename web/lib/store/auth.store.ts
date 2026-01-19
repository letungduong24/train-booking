import { create } from 'zustand';
import apiClient from '@/lib/api-client';
import type { User } from '@/lib/schemas/user.schema';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;

    // Actions
    setUser: (user: User | null) => void;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name?: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

// Request deduplication cache for checkAuth (client-swr-dedup pattern)
let checkAuthPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: false,
    isInitialized: false,
    error: null,

    setUser: (user) => set((state) => ({ ...state, user })),

    login: async (email, password) => {
        set((state) => ({ ...state, isLoading: true, error: null }));
        try {
            const response = await apiClient.post<User>('/auth/login', { email, password });
            set((state) => ({ ...state, user: response.data, isLoading: false }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            set((state) => ({ ...state, isLoading: false, error: errorMessage }));
            throw error;
        }
    },

    register: async (email, password, name) => {
        set((state) => ({ ...state, isLoading: true, error: null }));
        try {
            const response = await apiClient.post<User>('/auth/register', { email, password, name });
            set((state) => ({ ...state, user: response.data, isLoading: false }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Registration failed';
            set((state) => ({ ...state, isLoading: false, error: errorMessage }));
            throw error;
        }
    },

    logout: async () => {
        set((state) => ({ ...state, isLoading: true, error: null }));
        try {
            await apiClient.post('/auth/logout');
            set((state) => ({ ...state, user: null, isLoading: false }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Logout failed';
            set((state) => ({ ...state, isLoading: false, error: errorMessage }));
            throw error;
        }
    },

    checkAuth: async () => {
        // Return existing promise if already checking (deduplication)
        if (checkAuthPromise) {
            return checkAuthPromise;
        }

        checkAuthPromise = (async () => {
            set((state) => ({ ...state, isLoading: true, error: null }));
            try {
                const response = await apiClient.get<User>('/auth/profile');
                set((state) => ({
                    ...state,
                    user: response.data,
                    isLoading: false,
                    isInitialized: true
                }));
            } catch (error) {
                // User not authenticated or token expired
                set((state) => ({
                    ...state,
                    user: null,
                    isLoading: false,
                    isInitialized: true
                }));
            } finally {
                // Clear the promise cache after completion
                checkAuthPromise = null;
            }
        })();

        return checkAuthPromise;
    },
}));
