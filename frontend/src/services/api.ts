import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Inject Supabase JWT into every request
api.interceptors.request.use(async (config) => {
    try {
        // We import supabase dynamically to avoid circular dependency
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }
    } catch (error) {
        console.error('Error attaching auth token:', error);
    }
    return config;
});

export const fetchWaterQuality = async () => {
    try {
        const response = await api.get('/dashboard/water-quality');
        return response.data || null;
    } catch (error) {
        console.error('Error fetching water quality:', error);
        return null;
    }
};

export const fetchMarineImpact = async () => {
    try {
        const response = await api.get('/dashboard/marine-impact');
        return response.data || [];
    } catch (error) {
        console.error('Error fetching marine impact:', error);
        return [];
    }
};

export const fetchSuccessStories = async () => {
    try {
        const response = await api.get('/dashboard/success-stories');
        return response.data || [];
    } catch (error) {
        console.error('Error fetching success stories:', error);
        return [];
    }
};

export const fetchWaterQualityHistory = async (limit: number = 20) => {
    try {
        const response = await api.get(`/dashboard/water-quality-history?limit=${limit}`);
        return response.data || [];
    } catch (error) {
        console.error('Error fetching water quality history:', error);
        return [];
    }
};

export const fetchDashboardStats = async () => {
    try {
        const response = await api.get('/dashboard/stats');
        return response.data || {
            total_reports: 0,
            active_users: 0,
            resolved_reports: 0,
            avg_response_time: null
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
            total_reports: 0,
            active_users: 0,
            resolved_reports: 0,
            avg_response_time: null
        };
    }
};

export const fetchReportsTimeline = async (days: number = 30) => {
    try {
        const response = await api.get(`/dashboard/reports/timeline?days=${days}`);
        return response.data || [];
    } catch (error) {
        console.error('Error fetching reports timeline:', error);
        return [];
    }
};

export const fetchReportsByType = async () => {
    try {
        const response = await api.get('/dashboard/reports/by-type');
        return response.data || [];
    } catch (error) {
        console.error('Error fetching reports by type:', error);
        return [];
    }
};

export const fetchReportsByStatus = async () => {
    try {
        const response = await api.get('/dashboard/reports/by-status');
        return response.data || [];
    } catch (error) {
        console.error('Error fetching reports by status:', error);
        return [];
    }
};

export const fetchGeographicHeatmap = async () => {
    try {
        const response = await api.get('/dashboard/reports/geographic-heatmap');
        return response.data || [];
    } catch (error) {
        console.error('Error fetching geographic heatmap:', error);
        return [];
    }
};

export const fetchSeverityDistribution = async () => {
    try {
        const response = await api.get('/dashboard/reports/severity-distribution');
        return response.data || [];
    } catch (error) {
        console.error('Error fetching severity distribution:', error);
        return [];
    }
};

export const fetchTrendComparison = async (months: number = 6) => {
    try {
        const response = await api.get(`/dashboard/reports/trend-comparison?months=${months}`);
        return response.data || [];
    } catch (error) {
        console.error('Error fetching trend comparison:', error);
        return [];
    }
};


export const fetchMarineImpactMetrics = async () => {
    try {
        const response = await api.get('/dashboard/marine-impact/metrics');
        return response.data || {
            species_impact: [],
            pollution_sources: [],
            ecosystem_health: {},
            ai_predictions: []
        };
    } catch (error) {
        console.error('Error fetching marine impact metrics:', error);
        return {
            species_impact: [],
            pollution_sources: [],
            ecosystem_health: {},
            ai_predictions: []
        };
    }
};

export const fetchNGOStats = async () => {
    try {
        const response = await api.get('/dashboard/ngo/stats');
        return response.data || {
            verified_reports_pending_action: 0,
            active_cleanup_campaigns: 0,
            total_cleanups_completed: 0,
            volunteer_count: 0
        };
    } catch (error) {
        console.error('Error fetching NGO stats:', error);
        return {
            verified_reports_pending_action: 0,
            active_cleanup_campaigns: 0,
            total_cleanups_completed: 0,
            volunteer_count: 0
        };
    }
};

export const fetchGovernmentStats = async () => {
    try {
        const response = await api.get('/dashboard/government/stats');
        return response.data || {
            critical_alerts: 0,
            pending_action_items: 0,
            enforcement_actions_taken: 0,
            compliance_rate: "N/A"
        };
    } catch (error) {
        console.error('Error fetching Government stats:', error);
        return {
            critical_alerts: 0,
            pending_action_items: 0,
            enforcement_actions_taken: 0,
            compliance_rate: "N/A"
        };
    }
};

// Fetch all reports (for Government/NGO dashboards to filter client-side or see all statuses)
export const fetchAllReports = async () => {
    try {
        // Assuming the backend has a general GET /reports endpoint that returns a list
        const response = await api.get('/reports');
        return response.data;
    } catch (error) {
        console.warn("Using mock data for all reports");
        return [
            {
                id: '1',
                location: 'Mumbai Harbor',
                type: 'Oil Spill',
                severity: 8,
                status: 'Verified',
                description: 'Large oil slick visible near dock 4.',
                created_at: new Date().toISOString(),
                latitude: 18.944,
                longitude: 72.825,
                photo_url: 'https://images.unsplash.com/photo-1605218430790-2c7009477fb4'
            },
            {
                id: '2',
                location: 'Juhu Beach',
                type: 'Plastic Pollution',
                severity: 5,
                status: 'Awaiting Verification',
                description: 'Pile of plastic waste after festival.',
                created_at: new Date().toISOString(),
                latitude: 19.0988,
                longitude: 72.8258,
                photo_url: 'https://images.unsplash.com/photo-1618477461853-5f8dd37a544d',
                verification_image: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4' // Mock after photo
            }
        ];
    }
};

export const fetchVerifiedReports = async () => {
    try {
        const response = await api.get('/reports/verified');
        return response.data || [];
    } catch (error) {
        console.error('Error fetching verified reports:', error);
        return [];
    }
};

export const fetchGovernmentJurisdictionReports = async () => {
    try {
        const response = await api.get('/reports/government/my-jurisdiction');
        return response.data || [];
    } catch (error) {
        console.error('Error fetching government jurisdiction reports:', error);
        return [];
    }
};

export const login = async (credentials: any) => {
    try {
        console.log('🔑 Attempting login...', {
            email: credentials.email,
            apiUrl: API_URL,
            endpoint: `${API_URL}/auth/login`
        });

        const response = await api.post('/auth/login', credentials);

        console.log('✅ Login successful:', {
            email: credentials.email,
            userId: response.data?.user?.id || 'N/A'
        });

        return response.data;
    } catch (error: any) {
        console.error('❌ Login error:', {
            email: credentials.email,
            apiUrl: API_URL,
            error: error
        });

        if (error.response) {
            // Server responded with error
            const errorMessage = error.response.data?.detail ||
                error.response.data?.message ||
                'Login failed';
            console.error('Server error response:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
            throw new Error(errorMessage);
        } else if (error.request) {
            // Request made but no response received
            console.error('Network error - no response received:', {
                apiUrl: API_URL,
                request: error.request
            });
            throw new Error(`Network error: Cannot reach server at ${API_URL}. Please ensure the backend is running.`);
        } else {
            // Something else happened
            console.error('Error details:', error.message);
            throw new Error(error.message || 'An unexpected error occurred during login');
        }
    }
};

export const register = async (userData: any) => {
    try {
        console.log('🚀 Attempting registration...', {
            email: userData.email,
            apiUrl: API_URL,
            endpoint: `${API_URL}/auth/register`
        });

        const response = await api.post('/auth/register', userData);

        console.log('✅ Registration successful:', {
            email: userData.email,
            userId: response.data?.user?.id || 'N/A'
        });

        return response.data;
    } catch (error: any) {
        console.error('❌ Registration error:', {
            email: userData.email,
            apiUrl: API_URL,
            error: error
        });

        if (error.response) {
            // Server responded with error
            const errorMessage = error.response.data?.detail ||
                error.response.data?.message ||
                'Registration failed';
            console.error('Server error response:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
            throw new Error(errorMessage);
        } else if (error.request) {
            // Request made but no response received
            console.error('Network error - no response received:', {
                apiUrl: API_URL,
                request: error.request
            });
            throw new Error(`Network error: Cannot reach server at ${API_URL}. Please ensure the backend is running.`);
        } else {
            // Something else happened
            console.error('Error details:', error.message);
            throw new Error(error.message || 'An unexpected error occurred during registration');
        }
    }
};

export const fetchUserReports = async (userId: string) => {
    try {
        const response = await api.get(`/reports/user/${userId}`);
        return response.data || [];
    } catch (error) {
        console.error('Error fetching user reports:', error);
        return [];
    }
};

export const submitReport = async (formData: FormData) => {
    try {
        console.log('Submitting report to:', `${API_URL}/reports/`);
        // Log form data keys for debugging (values might be sensitive or binary)
        const formDataKeys: string[] = [];
        formData.forEach((_, key) => formDataKeys.push(key));
        console.log('FormData keys:', formDataKeys);

        const response = await api.post('/reports/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        console.log('Report submission successful:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Error submitting report:', error);

        // Enhanced error logging for debugging
        if (error.response) {
            console.error('Response error:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
            // Return the error message from backend if available
            throw new Error(error.response.data?.detail || error.response.data?.message || 'Report submission failed');
        } else if (error.request) {
            console.error('Request error - no response received:', error.request);
            throw new Error('Network error: No response received from server. Please check your connection.');
        } else {
            console.error('Error details:', error.message);
            throw error;
        }
    }
};

export const fetchReportDiscussions = async (report_id: string) => {
    try {
        const response = await api.get(`/reports/${report_id}/discussions`);
        return response.data;
    } catch (error) {
        console.error('Error fetching discussions:', error);
        return [];
    }
};

export const addReportDiscussion = async (report_id: string, formData: FormData) => {
    try {
        const response = await api.post(`/reports/${report_id}/discussions`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error adding discussion:', error);
        throw error;
    }
};

export const fetchLeaderboard = async () => {
    try {
        const response = await api.get('/rewards/leaderboard');
        return response.data || [];
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
};

export const createCleanupCampaign = async (formData: FormData) => {
    try {
        const response = await api.post('/cleanup/create_campaign', formData, {
            headers: { 'Content-Type': 'multipart/form-data' } // Though mostly text, backend accepts Form
        });
        return response.data;
    } catch (error) {
        console.error('Error creating campaign:', error);
        throw error;
    }
};

export const createSuccessStory = async (formData: FormData) => {
    try {
        const response = await api.post('/dashboard/success-stories', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error creating success story:', error);
        throw error;
    }
};

export const subscribeToPush = async (subscription: any) => {
    try {
        const response = await api.post('/api/notifications/subscribe', subscription);
        return response.data;
    } catch (error) {
        console.error('Error subscribing to push:', error);
        throw error;
    }
};

export default api;
