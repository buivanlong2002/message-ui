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

let allConversations = [];

// Lắng nghe khi WebSocket trả dữ liệu
window.addEventListener("conversationsData", function (event) {
    allConversations = event.detail;
    displayConversations(allConversations);
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
            ? `${escapeHtml(sender)}: ${escapeHtml(trimmedContent)}`
            : "Chưa có tin nhắn";

        const previewTime = lastMessage?.lastMessageTimeAgo || (typeof ProfileController !== 'undefined' && ProfileController.formatTimeAgo ? ProfileController.formatTimeAgo(new Date(createdAt)) : formatTime(createdAt));
        const avatarUrl = getAvatarUrl(chat.avatarUrl);

        chatItem.onclick = function () {
            loadChat(chat.id, this, name, avatarUrl , chat.isGroup);
        };

        chatItem.innerHTML = `
            <img
                src="${avatarUrl}"
                alt="Avatar"
                class="chat-avatar"
                onerror="this.onerror=null;this.src='images/default_avatar.jpg';"
            >
            <div style="flex: 1;">
                <div class="chat-name">${escapeHtml(name)}</div>
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

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", function() {
    loadChatList();
    const searchBox = document.getElementById('search-box');
    if (searchBox) {
        searchBox.addEventListener('input', function() {
            const searchTerm = searchBox.value.trim().toLowerCase();
            if (!searchTerm) {
                displayConversations(allConversations);
                return;
            }
            const filtered = allConversations.filter(chat => {
                const name = (chat.name || "").toLowerCase();
                return name.includes(searchTerm);
            });
            displayConversations(filtered);
        });
    }
});
