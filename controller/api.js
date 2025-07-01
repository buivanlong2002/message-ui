const API_CONFIG = {
    BASE_URL: 'http://localhost:8885/api',
};

async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.status?.message || 'Lỗi từ server');
        }
        return result;
    } catch (error) {
        throw new Error(`Lỗi khi gọi API: ${error.message}`);
    }
}
