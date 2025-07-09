const API_CONFIG = {
    BASE_URL: 'https://cms-service.up.railway.app/api',
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

        console.log(`Calling API: ${API_CONFIG.BASE_URL}${endpoint}`);
        console.log('Headers:', headers);

        const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
            headers,
            ...options,
        });

        // Xử lý các status code khác nhau
        if (response.status === 403) {
            console.log('403 Forbidden - Truy cập bị từ chối');
            handleAuthError();
            throw new Error('Truy cập bị từ chối. Vui lòng đăng nhập lại.');
        }
        
        if (response.status === 401) {
            console.log('401 Unauthorized - Token không hợp lệ');
            handleAuthError();
            throw new Error('Token không hợp lệ. Vui lòng đăng nhập lại.');
        }
        
        if (response.status === 404) {
            throw new Error('Endpoint không tồn tại.');
        }

        // Kiểm tra nếu response không phải JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            // Nếu không phải JSON, thử đọc text
            const textResponse = await response.text();
            console.log('Response text:', textResponse);
            throw new Error(`Server trả về dữ liệu không hợp lệ: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.status?.displayMessage || result.status?.message || `Lỗi từ server: ${response.status}`);
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

// Helper function để xử lý avatar URL một cách nhất quán
function getAvatarUrl(avatarPath) {
    if (!avatarPath) {
        return 'images/default_avatar.jpg';
    }
    
    // Nếu đã là URL đầy đủ
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
        return avatarPath;
    }
    
    // Nếu là đường dẫn tương đối, thêm base URL
    if (avatarPath.startsWith('/')) {
        return `https://cms-service.up.railway.app${avatarPath}`;
    }
    
    // Nếu không có / ở đầu, thêm /
    return `https://cms-service.up.railway.app/${avatarPath}`;
}

// Function kiểm tra authentication
function checkAuthentication() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
        console.log('Chưa đăng nhập, chuyển hướng đến trang đăng nhập');
        window.location.href = 'auth.html';
        return false;
    }
    
    return true;
}

// Function xử lý lỗi authentication
function handleAuthError() {
    console.log('Token không hợp lệ, xóa thông tin đăng nhập');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = 'auth.html';
}
