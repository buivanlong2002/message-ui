function loadChatList() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
        localStorage.clear();
        window.location.href = "/login.html";
        return;
    }

    ConversationService.getConversationsByUser(userId, token)
        .then(result => {
            const status = result.status;
            if (status?.code === "00" && status.success) {
                const chatListDiv = document.getElementById("chat-list");
                chatListDiv.innerHTML = "";

                result.data.forEach(chat => {
                    const chatItem = document.createElement("div");
                    chatItem.className = "chat-item";

                    const name = chat.name || "Không tên";
                    const createdAt = chat.createdAt;
                    const lastMessage = chat.lastMessage;

                    // Cắt nội dung còn 10 ký tự
                    const sender = lastMessage?.lastMessageSenderName || "";
                    const content = lastMessage?.lastMessageContent || "";
                    const trimmedContent = content.length > 10 ? content.slice(0, 10) + "..." : content;

                    const previewText = lastMessage
                        ? `${sender}: ${trimmedContent}`
                        : "Chưa có tin nhắn";

                    const previewTime = lastMessage?.lastMessageTimeAgo || formatTime(createdAt);
                    const avatarUrl = "http://localhost:8885" + chat.avatarUrl;

                    chatItem.onclick = function () {
                        loadChat(chat.id, this, name, avatarUrl);
                    };

                    chatItem.innerHTML = `
                        <img
                            src="${avatarUrl}"
                            alt="Avatar"
                            class="chat-avatar"
                            onerror="this.onerror=null;this.src='/images/default-avatar.jpg';"
                        >
                        <div style="flex: 1;">
                            <div class="chat-name">${name}</div>
                            <div class="chat-preview">${previewText}</div>
                        </div>
                        <div class="chat-time">${previewTime}</div>
                    `;

                    chatListDiv.appendChild(chatItem);
                });
            } else {
                console.error("Lỗi từ server:", status?.message || "Không rõ lỗi");
            }
        })
        .catch(error => {
            console.error("Lỗi khi tải danh sách chat:", error.message);
        });
}

function formatTime(isoTime) {
    const date = new Date(isoTime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Gọi khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", loadChatList);


