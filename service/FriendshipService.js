const FriendshipService = {
    // 1. Gửi lời mời kết bạn
    sendFriendRequest: async (senderId, receiverId) => {
        return await fetchAPI(`/friendships/send?senderId=${senderId}&receiverId=${receiverId}`, {
            method: "POST"
        });
    },

    // 2. Chấp nhận lời mời kết bạn
    acceptFriendRequest: async (senderId, receiverId) => {
        return await fetchAPI(`/friendships/accept?senderId=${senderId}&receiverId=${receiverId}`, {
            method: "POST"
        });
    },

    // 3. Từ chối lời mời kết bạn
    rejectFriendRequest: async (senderId, receiverId) => {
        return await fetchAPI(`/friendships/reject?senderId=${senderId}&receiverId=${receiverId}`, {
            method: "POST"
        });
    },

    // 4. Lấy danh sách bạn bè của user
    getFriendships: async (userId) => {
        return await fetchAPI(`/friendships/friends?userId=${userId}`, {
            method: "GET"
        });
    },

    // 5. Lấy danh sách lời mời kết bạn đang chờ xác nhận
    getPendingRequests: async (userId) => {
        return await fetchAPI(`/friendships/friend-requests?userId=${userId}`, {
            method: "GET"
        });
    }
};
