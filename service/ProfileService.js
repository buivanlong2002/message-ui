const ProfileService = {
    // 1. Lấy thông tin profile của người dùng hiện tại
    getCurrentUserProfile: async () => {
        return await UserService.getCurrentUser();
    },

    // 2. Cập nhật thông tin profile
    updateProfile: async (profileData) => {
        return await UserService.updateCurrentUser(profileData);
    },

    // 3. Đổi mật khẩu
    changePassword: async (currentPassword, newPassword) => {
        return await fetchAPI(`/users/change-password`, {
            method: "PUT",
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword
            }),
        });
    },

    // 4. Lấy danh sách người dùng bị chặn
    getBlockedUsers: async () => {
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
            throw new Error('Chưa đăng nhập');
        }

        return await fetchAPI(`/friendships/blocked-users?userId=${userId}`, {
            method: "GET",
        });
    },

    // 5. Bỏ chặn người dùng
    unblockUser: async (blockedUserId) => {
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
            throw new Error('Chưa đăng nhập');
        }

        return await fetchAPI(`/friendships/unblock?senderId=${userId}&receiverId=${blockedUserId}`, {
            method: "DELETE",
        });
    },

    // 6. Lấy danh sách người đã chặn mình
    getBlockedByUsers: async () => {
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
            throw new Error('Chưa đăng nhập');
        }

        return await fetchAPI(`/friendships/blocked-by-users?userId=${userId}`, {
            method: "GET",
        });
    }
}; 