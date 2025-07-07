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

    getSentRequests: async function(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/friendships/sent-requests`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            throw new Error(`Không thể lấy danh sách lời mời đã gửi: ${error.message}`);
        }
    },

    cancelFriendRequest: async function(senderId, receiverId) {
        try {
            const response = await fetch(`${API_BASE_URL}/friendships/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    senderId: senderId,
                    receiverId: receiverId
                })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            throw new Error(`Không thể hủy lời mời kết bạn: ${error.message}`);
        }
    }
};
