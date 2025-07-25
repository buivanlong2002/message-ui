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

    // 4. Lấy danh sách bạn bè của user (API trả về List<FriendResponse>)
    getFriendships: async (userId) => {
        return await fetchAPI(`/friendships/friends?userId=${userId}`, {
            method: "GET"
        });
    },

    // 5. Lấy danh sách lời mời kết bạn đang chờ xác nhận (API trả về List<PendingFriendRequestResponse>)
    getPendingRequests: async (userId) => {
        return await fetchAPI(`/friendships/friend-requests?userId=${userId}`, {
            method: "GET"
        });
    },

    // 6. Xóa bạn bè
    removeFriend: async (senderId, receiverId) => {
        return await fetchAPI(`/friendships/unfriend?senderId=${senderId}&receiverId=${receiverId}`, {
            method: "DELETE"
        });
    },

    // 7. Lấy danh sách lời mời đã gửi
    getSentRequests: async (senderId) => {
        return await fetchAPI(`/friendships/sent-requests?senderId=${senderId}`, {
            method: "GET"
        });
    },

    // 8. Hủy lời mời kết bạn
    cancelFriendRequest: async (senderId, receiverId) => {
        return await fetchAPI(`/friendships/reject?senderId=${senderId}&receiverId=${receiverId}`, {
            method: "POST"
        });
    },

    // 9. Lấy danh sách bạn bè của user hiện tại
    getFriends: async (token) => {
        const userId = localStorage.getItem('userId');
        return await fetchAPI(`/friendships/friends?userId=${userId}`, {
            method: "GET",
            headers: {
                Authorization: "Bearer " + token,
            },
        });
    },
};
