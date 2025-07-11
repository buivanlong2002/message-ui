const MessageStatusService = {
    // 1. Lấy tất cả trạng thái của 1 tin nhắn
    getByMessageId: async (messageId, token) => {
        return await fetchAPI(`/message-statuses/message/${messageId}`, {
            method: "GET",
            headers: {
                Authorization: "Bearer " + token,
            },
        });
    },

    // 2. Lấy trạng thái của tin nhắn theo người dùng
    getByMessageAndUser: async (messageId, userId, token) => {
        return await fetchAPI(`/message-statuses/message/${messageId}/user/${userId}`, {
            method: "GET",
            headers: {
                Authorization: "Bearer " + token,
            },
        });
    },

    // 3. Lấy trạng thái theo người dùng và trạng thái cụ thể (READ, DELIVERED, SENT...)
    getByUserAndStatus: async (userId, status, token) => {
        return await fetchAPI(`/message-statuses/user/${userId}/status/${status}`, {
            method: "GET",
            headers: {
                Authorization: "Bearer " + token,
            },
        });
    },

    // 4. Thêm trạng thái mới cho tin nhắn
    addMessageStatus: async (messageStatusObject, token) => {
        return await fetchAPI(`/message-statuses`, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(messageStatusObject),
        });
    },

    // 5. Đánh dấu tất cả tin nhắn trong nhóm là đã xem cho user
    markAllAsSeen: async (conversationId, userId, token) => {
        return await fetchAPI(`/message-statuses/mark-all-seen?conversationId=${conversationId}&userId=${userId}`, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token,
            },
        });
    },
};
