

 const ConversationMemberService = {
    // 1. Thêm thành viên vào cuộc trò chuyện
    addMember: async (conversationId, userId) => {
        const requestBody = {
            conversationId,
            userId
        };

        return await fetchAPI("/conversation-members/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });
    },

    // 2. Lấy danh sách thành viên trong một cuộc trò chuyện
    getMembersByConversation: async (conversationId) => {
        return await fetchAPI("/conversation-members/members-by-conversation", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ conversationId })
        });
    },

    // 3. Xóa thành viên khỏi cuộc trò chuyện
    removeMember: async (conversationId, userId) => {
        const requestBody = {
            conversationId,
            userId
        };

        return await fetchAPI("/conversation-members/remove", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });
    }
};
