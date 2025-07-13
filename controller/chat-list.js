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
    console.log('Nhận conversations data:', event.detail);
    allConversations = event.detail;
    displayConversations(allConversations);
});

function displayConversations(conversations) {
    const chatListDiv = document.getElementById("chat-list");
    const currentActiveChatId = window.currentChatId; // Lưu chat hiện tại đang active
    
    chatListDiv.innerHTML = "";
    if (conversations.length === 0 && typeof showWelcomeEmptyChat === 'function') showWelcomeEmptyChat();

    // Nếu không có cuộc trò chuyện nào (kết quả tìm kiếm rỗng), reset UI chat
    if (conversations.length === 0) {
        // Ẩn header
        const chatHeader = document.getElementById('chat-header');
        if (chatHeader) chatHeader.innerHTML = '';
        // Xóa nội dung chat
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) chatMessages.innerHTML = '';
        // Ẩn input
        const chatInput = document.getElementById('chat-input-container');
        if (chatInput) chatInput.innerHTML = '';
        // Hiện lại welcome
        const welcome = document.getElementById('welcome-empty-chat');
        if (welcome) welcome.style.display = 'flex';
        // Xóa trạng thái chat hiện tại
        window.currentChatId = null;
        return;
    }

    conversations.forEach(chat => {
        const chatItem = document.createElement("div");
        chatItem.className = "chat-item";
        chatItem.setAttribute('data-chat-id', chat.id);

        const name = chat.name || "Không tên";
        const createdAt = chat.createdAt;
        const lastMessage = chat.lastMessage;

        const sender = lastMessage?.lastMessageSenderName || "";
        const content = lastMessage?.lastMessageContent || "";
        const trimmedContent = content.length > 15 ? content.slice(0, 15) + "..." : content;

        const previewText = lastMessage
            ? `${escapeHtml(sender)}: ${escapeHtml(trimmedContent)}`
            : "Chưa có tin nhắn";

        const previewTime = lastMessage?.lastMessageTimeAgo ||
            (typeof ProfileController !== 'undefined' && ProfileController.formatTimeAgo
                ? ProfileController.formatTimeAgo(new Date(createdAt))
                : formatTime(createdAt));

        const avatarUrl = getAvatarUrl(chat.avatarUrl);

        const isSeen = lastMessage?.seen === true;

        const previewClass = isSeen ? "chat-preview seen" : "chat-preview unseen";
        const nameClass = isSeen ? "chat-name" : "chat-name unread";
        const unreadDot = isSeen ? "" : `<span class="unread-dot">•</span>`;

        chatItem.onclick = function () {
            console.log('Click vào chat item:', chat.id);
            console.log('Element:', this);
            
            // Test active state trước
            document.querySelectorAll('.chat-item').forEach(item => {
                console.log('Chat item:', item.getAttribute('data-chat-id'), 'Active:', item.classList.contains('active'));
            });
            
            loadChat(chat.id, this, name, avatarUrl, chat.isGroup);

            // Gọi API đánh dấu đã xem khi người dùng click vào cuộc trò chuyện
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');
            if (token && userId) {
                MessageStatusService.markAllAsSeen(chat.id, userId, token)
                    .then(response => {
                        console.log("Đã đánh dấu tin nhắn là đã xem cho cuộc trò chuyện:", chat.id);
                    })
                    .catch(error => {
                        console.error("Lỗi khi cập nhật trạng thái đã xem:", error);
                    });
            }
        };


        chatItem.innerHTML = `
            <img
                src="${avatarUrl}"
                alt="Avatar"
                class="chat-avatar"
                onerror="this.onerror=null;this.src='images/default_avatar.jpg';"
            >
            <div style="flex: 1;">
                <div class="${nameClass}">${escapeHtml(name)} ${unreadDot}</div>
                <div class="${previewClass} chat-last-message">${previewText}</div>
            </div>
            <div class="chat-time">${previewTime}</div>
        `;

        chatListDiv.appendChild(chatItem);
    });
    
    // Khôi phục active state cho chat hiện tại
    if (currentActiveChatId) {
        const activeChatItem = document.querySelector(`.chat-item[data-chat-id="${currentActiveChatId}"]`);
        if (activeChatItem) {
            activeChatItem.classList.add('active');
            console.log('Khôi phục active state cho:', currentActiveChatId);
        }
    }
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
