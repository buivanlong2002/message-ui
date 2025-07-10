const UserService = {
    // ✅ Gọi đúng endpoint để cập nhật thông tin user hiện tại
    updateCurrentUser: async (userData) => {
        return await fetchAPI(`/users/profile`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    },

    getByUserId: async (userId) => {
        return await fetchAPI(`/users/${userId}`, {
            method: 'GET'
        });
    },

    getCurrentUser: async () => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            throw new Error('Chưa đăng nhập');
        }
        return await UserService.getByUserId(userId);
    },

    searchByEmail: async function(email) {
        return await fetchAPI(`/users/search?email=${encodeURIComponent(email)}`);
    },
};
