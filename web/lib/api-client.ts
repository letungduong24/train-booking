import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // CRITICAL: Send cookies with every request
});

// Flag to prevent multiple simultaneous refresh requests
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });

    failedQueue = [];
};

// Response interceptor to handle 401 errors and refresh token
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (
                originalRequest.url?.includes('/auth/login') ||
                originalRequest.url?.includes('/auth/register') ||
                originalRequest.url?.includes('/auth/refresh')
            ) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => {
                        return apiClient(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Call refresh endpoint with timeout (5s max)
                await apiClient.post('/auth/refresh', {}, { timeout: 5000 });

                // Refresh successful, process queued requests
                processQueue();
                isRefreshing = false;

                // Retry original request
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear queue and redirect to login
                processQueue(refreshError);
                isRefreshing = false;

                // Only redirect if not already on login page or checking profile
                if (
                    typeof window !== 'undefined' &&
                    !window.location.pathname.includes('/login') &&
                    !originalRequest.url?.includes('/auth/profile')
                ) {
                    // Use Next.js router instead of window.location.href to prevent full page reload
                    // Import dynamically to avoid SSR issues
                    import('next/navigation').then(({ redirect }) => {
                        redirect('/login');
                    }).catch(() => {
                        // Fallback to window.location if redirect fails (shouldn't happen in client components)
                        window.location.href = '/login';
                    });
                }

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
