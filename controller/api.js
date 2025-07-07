const API_CONFIG = {
    BASE_URL: 'http://localhost:8885/api',
};

async function fetchAPI(endpoint, options = {}) {
    try {
        // Thêm token vào headers nếu có
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        
        if (token && !options.headers?.Authorization) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
            headers,
            ...options,
        });

        // Kiểm tra nếu response không phải JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server trả về dữ liệu không hợp lệ');
        }

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.status?.displayMessage || result.status?.message || 'Lỗi từ server');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
        }
        throw new Error(`Lỗi khi gọi API: ${error.message}`);
    }
}
