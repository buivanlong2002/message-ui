const ConversationService = {
    // 1. Tạo nhóm
    createGroupConversation: async (name, createdBy, token) => {
        return await fetchAPI(`/conversations/create-group?name=${encodeURIComponent(name)}&createdBy=${createdBy}`, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token,
            },
        });
    },

    // 2. Tạo hoặc lấy cuộc trò chuyện 1-1
    getOrCreateOneToOneConversation: async (senderId, receiverId, token) => {
        return await fetchAPI(`/conversations/one-to-one?senderId=${senderId}&receiverId=${receiverId}`, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token,
            },
        });
    },

    // 3. Cập nhật tên hoặc trạng thái nhóm
    updateConversation: async (conversationId, updateRequest, token) => {
        return await fetchAPI(`/conversations/${conversationId}/update`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            },
            body: JSON.stringify(updateRequest),
        });
    },

    // 4. Lưu trữ nhóm
    archiveConversation: async (conversationId, token) => {
        return await fetchAPI(`/conversations/${conversationId}/archive`, {
            method: "PUT",
            headers: {
                Authorization: "Bearer " + token,
            },
        });
    },

    // 5. Upload avatar nhóm (multipart/form-data)
    uploadGroupAvatar: async (conversationId, file, token) => {
        const formData = new FormData();
        formData.append("file", file);

        return await fetchAPI(`/conversations/${conversationId}/avatar`, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token,
            },
            body: formData,
        });
    },

    // 6. Lấy tất cả nhóm của người dùng
    getConversationsByUser: async (userId, token) => {
        return await fetchAPI(`/conversations/user/${userId}`, {
            method: "GET",
            headers: {
                Authorization: "Bearer " + token,
            },
        });
    },

    // 7. Phân trang danh sách nhóm theo user
    getPagedConversationsByUser: async (userId, page = 0, size = 10, token) => {
        return await fetchAPI(`/conversations/user/${userId}/paged?page=${page}&size=${size}`, {
            method: "GET",
            headers: {
                Authorization: "Bearer " + token,
            },
        });
    },

    // 8. Lấy tất cả cuộc trò chuyện của user hiện tại
    getConversations: async (token) => {
        const userId = localStorage.getItem('userId');
        return await fetchAPI(`/conversations/user/${userId}`, {
            method: "GET",
            headers: {
                Authorization: "Bearer " + token,
            },
        });
    },

    // 9. Tạo cuộc trò chuyện mới
    createConversation: async (conversationData, token) => {
        return await fetchAPI(`/conversations/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            },
            body: JSON.stringify(conversationData),
        });
    },
};
