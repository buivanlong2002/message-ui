function loadChatList() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
        localStorage.clear();
        window.location.href = "/auth.html";
        return;
    }

    // Gọi kết nối WebSocket từ file websocket.js
    connectWebSocket(userId, token);
}

// Lắng nghe khi WebSocket trả dữ liệu
window.addEventListener("conversationsData", function (event) {
    const conversations = event.detail;
    displayConversations(conversations);
});

function displayConversations(conversations) {
    const chatListDiv = document.getElementById("chat-list");
    chatListDiv.innerHTML = "";

    conversations.forEach(chat => {
        const chatItem = document.createElement("div");
        chatItem.className = "chat-item";

        const name = chat.name || "Không tên";
        const createdAt = chat.createdAt;
        const lastMessage = chat.lastMessage;

        const sender = lastMessage?.lastMessageSenderName || "";
        const content = lastMessage?.lastMessageContent || "";
        const trimmedContent = content.length > 10 ? content.slice(0, 10) + "..." : content;

        const previewText = lastMessage
            ? `${sender}: ${trimmedContent}`
            : "Chưa có tin nhắn";

        const previewTime = lastMessage?.lastMessageTimeAgo || formatTime(createdAt);
        const avatarUrl = "http://localhost:8885" + chat.avatarUrl;

        chatItem.onclick = function () {
            loadChat(chat.id, this, name, avatarUrl , chat.isGroup);
        };

        chatItem.innerHTML = `
            <img
                src="${avatarUrl}"
                alt="Avatar"
                class="chat-avatar"
                onerror="this.onerror=null;this.src='/images/default_avatar.jpg';"
            >
            <div style="flex: 1;">
                <div class="chat-name">${name}</div>
                <div class="chat-preview">${previewText}</div>
            </div>
            <div class="chat-time">${previewTime}</div>
        `;

        chatListDiv.appendChild(chatItem);
    });
}

function formatTime(isoTime) {
    const date = new Date(isoTime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

document.addEventListener("DOMContentLoaded", loadChatList);
