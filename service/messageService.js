const MessageService = {
    sendMessage: async (formData, token) => {

        return await fetchAPI("/messages/send", {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token,

            },
            body: formData,
        });
    },

    getMessagesByConversation: async (conversationId, page = 0, size = 20, token) => {
        return await fetchAPI(`/messages/get-by-conversation?conversationId=${conversationId}&page=${page}&size=${size}`, {
            method: "GET",
            headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "application/json"
            },
        });
    },

    getMessageById: async (messageId, conversationId, token) => {
        return await fetchAPI("/messages/get-by-id", {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token,
            },
            body: JSON.stringify({messageId, conversationId}),
        });
    },

    getMessagesBySender: async (senderId, conversationId, token) => {
        return await fetchAPI("/messages/get-by-sender", {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token,
            },
            body: JSON.stringify({senderId, conversationId}),
        });
    },

    editMessage: async (messageId, newContent, token, conversationId) => {
        const requestBody = {messageId, newContent, conversationId};
        return await fetchAPI("/messages/edit", {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody),
        });
    },

    recallMessage: async (messageId, userId, token) => {
        return await fetchAPI(`/messages/${messageId}/recall?userId=${userId}`, {
            method: "PUT",
            headers: {
                Authorization: "Bearer " + token,
            }
        });
    }
};

