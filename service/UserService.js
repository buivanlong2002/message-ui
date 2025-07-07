const UserService = {
    // Lấy thông tin user theo userId
    getByUserId: async (userId) => {
        return await fetchAPI(`/users/${userId}`, {
            method: 'GET'
        });
    },

    // Lấy thông tin user hiện tại (sử dụng userId từ localStorage)
    getCurrentUser: async () => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            throw new Error('Chưa đăng nhập');
        }
        return await UserService.getByUserId(userId);
    },

    // Cập nhật thông tin user
    updateUser: async (userId, userData) => {
        return await fetchAPI(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    },

    // Cập nhật thông tin user hiện tại
    updateCurrentUser: async (userData) => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            throw new Error('Chưa đăng nhập');
        }
        return await UserService.updateUser(userId, userData);
    }
};