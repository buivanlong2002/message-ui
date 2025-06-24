
 function loadChatList() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
        console.error("Thiếu token hoặc userId. Vui lòng đăng nhập lại.");
        return;
    }

    fetchAPI(`/conversations/user/${userId}`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
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

                    const previewText = lastMessage
                        ? `${lastMessage.lastMessageSenderName}: ${lastMessage.lastMessageContent}`
                        : "Chưa có tin nhắn";

                    const previewTime = lastMessage?.lastMessageTimeAgo || formatTime(createdAt);
                    const avatarUrl ="http://localhost:8885" +chat.avatarUrl ;

                    chatItem.onclick = function () {
                        loadChat(chat.id, this, name);
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


