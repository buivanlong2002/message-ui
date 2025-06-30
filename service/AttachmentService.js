
 const AttachmentService = {
    // 1. Lấy tất cả file đính kèm của một tin nhắn
    getAttachmentsByMessage: async (messageId) => {
        return await fetchAPI(`/attachments/message/${messageId}`, {
            method: "GET",
        });
    },

    // 2. Thêm một file đính kèm mới (gửi object JSON)
    addAttachment: async (attachment) => {
        return await fetchAPI(`/attachments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(attachment),
        });
    }
};
