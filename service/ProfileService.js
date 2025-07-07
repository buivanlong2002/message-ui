const ProfileService = {
    // 1. Lấy thông tin profile của người dùng hiện tại
    getCurrentUserProfile: async () => {
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
            throw new Error('Chưa đăng nhập');
        }

        return await fetchAPI(`/users/profile/${userId}`, {
            method: "GET",
        });
    },

    // 2. Cập nhật thông tin profile
    updateProfile: async (profileData) => {
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
            throw new Error('Chưa đăng nhập');
        }

        return await fetchAPI(`/users/profile/${userId}`, {
            method: "PUT",
            body: JSON.stringify(profileData),
        });
    },

    // 3. Đổi mật khẩu
    changePassword: async (currentPassword, newPassword) => {
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
            throw new Error('Chưa đăng nhập');
        }

        return await fetchAPI(`/users/change-password/${userId}`, {
            method: "PUT",
            body: JSON.stringify({
                currentPassword,
                newPassword
            }),
        });
    },

    // 4. Lấy danh sách người dùng bị chặn
    getBlockedUsers: async () => {
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
            throw new Error('Chưa đăng nhập');
        }

        return await fetchAPI(`/users/blocked/${userId}`, {
            method: "GET",
        });
    },

    // 5. Bỏ chặn người dùng
    unblockUser: async (blockedUserId) => {
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
            throw new Error('Chưa đăng nhập');
        }

        return await fetchAPI(`/users/unblock/${userId}/${blockedUserId}`, {
            method: "PUT",
        });
    }
}; 