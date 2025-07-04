function loadChat(chatId, element, name, avatarUrl, isGroup) {

    closeProfile();
    // Active item
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');

    // Token & userId
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
        localStorage.clear();
        window.location.href = "/auth.html";
        return;
    }

    // Update chat header
    document.getElementById("chat-header").innerHTML = `
        <div class="header-left">
            <img src="${avatarUrl || '/images/default_avatar.jpg'}"
                 alt="Avatar"
                 class="chat-avatar"
                 onerror="this.onerror=null;this.src='/images/default_avatar.jpg';">
            <span class="header-name">${escapeHTML(name)}</span>
        </div>
        <div class="header-actions">
              <button class="header-btn" onclick="makeCall()"><i class="bi bi-telephone-fill"></i></button>
              <button class="header-btn" onclick="makeVideoCall()"><i class="bi bi-camera-video-fill"></i></button>
              <button class="header-btn profile-btn" onclick="goToProfile('${name}', ${isGroup ? 'true' : 'false'}, '${avatarUrl}')"><i class="bi bi-person-lines-fill"></i></button>
        </div>
    `;

    // Set global chatId
    window.currentChatId = chatId;

    // Show chat input
    const inputContainer = document.getElementById("chat-input-container");
    inputContainer.classList.add('active');

    // Clear message container
    const container = document.getElementById("chat-messages");
    container.innerHTML = '';

    // Cleanup event listeners
    window.dispatchEvent(new Event('chatChanged'));

    // Subscribe to conversation messages and reload
    subscribeToConversationMessages(chatId);

    // Load old messages
    const messageHandler = (event) => {
        const {conversationId, messages} = event.detail;
        if (conversationId !== chatId) return;

        container.innerHTML = '';

        if (Array.isArray(messages) && messages.length > 0) {
            messages.forEach(msg => {
                const messageEl = renderMessage(msg, userId);
                messageEl.setAttribute('data-message-id', msg.id);
                container.appendChild(messageEl);
            });
        } else {
            container.innerHTML = `<div class="empty-chat">Chưa có tin nhắn nào</div>`;
        }

        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
        });

        // Cập nhật thời gian cuối cùng xem
        localStorage.setItem(`lastSeen_${conversationId}`, new Date().toISOString());
    };
    window.addEventListener("conversationMessages", messageHandler);

    // Handle realtime messages
    const realtimeHandler = (event) => {
        const {conversationId, message} = event.detail;
        if (conversationId !== chatId) return;

        // Prevent duplicate messages
        const existingMessage = document.querySelector(`.message-wrapper[data-message-id="${message.id}"]`);
        if (existingMessage) return;

        const messageEl = renderMessage(message, userId);
        messageEl.setAttribute('data-message-id', message.id);
        container.appendChild(messageEl);
        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
        });

        // Update chat list and reload messages if needed
        const chatItem = document.querySelector(`.chat-item[data-chat-id="${conversationId}"]`);
        if (chatItem) {
            const lastMessageEl = chatItem.querySelector(".chat-last-message");
            if (lastMessageEl) {
                lastMessageEl.textContent = message.content || "[File]";
            }
            chatItem.parentNode.prepend(chatItem);
            const unreadBadge = chatItem.querySelector(".unread-count");
            if (unreadBadge) unreadBadge.remove();

            // Tải lại tin nhắn để đảm bảo đồng bộ
            if (conversationId === window.currentChatId) {
                subscribeToConversationMessages(conversationId);
            }
        }

        // Lưu thời gian cuối cùng xem
        localStorage.setItem(`lastSeen_${conversationId}`, new Date().toISOString());
    };
    window.addEventListener("newMessageReceived", realtimeHandler);

    // Cleanup when switching conversations or unloading page
    const cleanup = () => {
        window.removeEventListener("conversationMessages", messageHandler);
        window.removeEventListener("newMessageReceived", realtimeHandler);
    };
    window.addEventListener('chatChanged', cleanup);
    window.addEventListener('beforeunload', cleanup);
}

/**
 * Render tin nhắn
 */
function renderMessage(msg, userId) {
    const isUser = String(msg.sender.senderId) === String(userId);
    const wrapper = document.createElement("div");
    wrapper.className = "message-wrapper " + (isUser ? "user" : "other");

    const time = msg.timeAgo || formatTimeAgo(msg.createdAt); // Sử dụng timeAgo từ server hoặc tính từ createdAt
    let contentHtml = "";

    switch (msg.messageType) {
        case "TEXT":
            contentHtml = `<div class="message-text">${escapeHTML(msg.content)}</div>`;
            break;
        case "IMAGE":
            if (msg.attachments?.length > 0) {
                const imagesHtml = msg.attachments.map(att => {
                    const url = "http://localhost:8885" + att.url;
                    return `<img src="${url}" alt="Hình ảnh" class="message-image"
                                onerror="this.src='images/image-error.png';"/>`;
                }).join("");
                contentHtml = `
                    ${msg.content ? `<div class="message-text">${escapeHTML(msg.content)}</div><br/>` : ""}
                    <div class="message-images">${imagesHtml}</div>
                `;
            } else {
                contentHtml = `<div class="text-muted">[Không tìm thấy ảnh]</div>`;
            }
            break;
        case "VIDEO":
            if (msg.attachments?.length > 0) {
                const videosHtml = msg.attachments.map(att => {
                    const url = "http://localhost:8885" + att.url;
                    return `<video controls class="message-video"
                                   onerror="this.poster='images/video-error.png';">
                                <source src="${url}" type="video/mp4">
                                Trình duyệt không hỗ trợ video.
                            </video>`;
                }).join("");
                contentHtml = `
                    ${msg.content ? `<div class="message-text">${escapeHTML(msg.content)}</div><br/>` : ""}
                    <div class="message-videos">${videosHtml}</div>
                `;
            } else {
                contentHtml = `<div class="text-muted">[Không tìm thấy video]</div>`;
            }
            break;
        case "FILE":
            if (msg.attachments?.length > 0) {
                const filesHtml = msg.attachments.map(att => {
                    const url = "http://localhost:8885" + att.url;
                    const fileName = att.originalFileName || att.url.split("/").pop();
                    return `<a href="${url}" target="_blank" class="message-file">
                                <i class="bi bi-file-earmark-text-fill"></i> ${escapeHTML(fileName)}
                            </a>`;
                }).join("<br/>");
                contentHtml = `
                    ${msg.content ? `<div class="message-text">${escapeHTML(msg.content)}</div><br/>` : ""}
                    <div class="message-files">${filesHtml}</div>
                `;
            } else {
                contentHtml = `<div class="text-muted">[Không tìm thấy tệp]</div>`;
            }
            break;
        default:
            contentHtml = msg.content
                ? `<div class="message-text">${escapeHTML(msg.content)}</div>`
                : `<div class="text-muted">[Không có nội dung]</div>`;
            break;
    }

    const senderAvatar = msg.sender?.avatarSender
        ? `http://localhost:8885${msg.sender.avatarSender}`
        : "images/default_avatar.jpg";
    const senderName = msg.sender?.nameSender || "Unknown";

    const senderInfoHtml = isUser
        ? ""
        : `<div class="message-sender">${escapeHTML(senderName)}</div>`;

    const contextMenuHtml = `
        <div class="message-context-menu">
            <ul>
                <li onclick="replyMessage('${msg.id}')"><i class="bi bi-reply-fill"></i> Trả lời</li>
                <li onclick="forwardMessage('${msg.id}')"><i class="bi bi-arrow-right-circle-fill"></i> Chuyển tiếp</li>
                ${isUser ? `<li onclick="recallMessage('${msg.id}')"><i class="bi bi-trash-fill"></i> Thu hồi</li>` : ""}
            </ul>
        </div>
    `;

    wrapper.innerHTML = `
        <div class="message-avatar">
            <img src="${senderAvatar}" alt="Avatar" class="avatar-image"
                 onerror="this.src='images/default_avatar.jpg';"/>
        </div>
        <div class="message-bubble">
            ${senderInfoHtml}
            <div class="message-content">${contentHtml}</div>
            <div class="message-time">${time}</div>
            ${contextMenuHtml}
        </div>
    `;

    return wrapper;
}

// Hàm hỗ trợ tính timeAgo nếu cần
function formatTimeAgo(dateString) {
    const now = new Date();
    const msgDate = new Date(dateString);
    const diffMs = now - msgDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} ngày trước` : "Vừa xong";
}

/**
 * Gửi tin nhắn với optimistic update
 */
async function sendMessage(chatId) {
    const input = document.getElementById("chat-input");
    const fileInput = document.getElementById("chat-file");
    const replyId = input.getAttribute("data-reply-id");
    const content = input.value.trim();
    const files = fileInput.files;

    if (!content && (!files || files.length === 0)) return;
    if (!chatId) return;

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    // Create temporary message
    const tempMessageId = `temp-${Date.now()}`;
    const container = document.getElementById("chat-messages");
    const tempMessageEl = document.createElement("div");
    tempMessageEl.className = "message-wrapper user";
    tempMessageEl.setAttribute('data-message-id', tempMessageId);

    let fileHtml = "";
    if (files && files.length > 0) {
        for (let file of files) {
            const url = URL.createObjectURL(file);
            const type = file.type;
            if (type.startsWith("image/")) {
                fileHtml += `<img src="${url}" class="message-image" />`;
            } else if (type.startsWith("video/")) {
                fileHtml += `<video controls src="${url}" class="message-video"></video>`;
            } else {
                fileHtml += `<a href="${url}" target="_blank">${escapeHTML(file.name)}</a>`;
            }
        }
    }

    tempMessageEl.innerHTML = `
        <div class="message-avatar">
            <img src="images/default-avatar.jpg" alt="Avatar" class="avatar-image"
                 onerror="this.src='images/default_avatar.jpg';"/>
        </div>
        <div class="message-bubble">
            <div class="message-content">
                ${content ? escapeHTML(content) + "<br/>" : ""}
                ${fileHtml}
            </div>
            <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
            <div class="message-context-menu">
                <ul>
                    <li><i class="bi bi-reply-fill"></i> Trả lời</li>
                    <li><i class="bi bi-arrow-right-circle-fill"></i> Chuyển tiếp</li>
                    <li><i class="bi bi-trash-fill"></i> Thu hồi</li>
                </ul>
            </div>
        </div>
    `;
    container.appendChild(tempMessageEl);
    requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
    });

    const formData = new FormData();
    formData.append("conversationId", chatId);
    formData.append("senderId", userId);
    if (content) formData.append("content", content);
    if (replyId) formData.append("replyId", replyId);

    const hasFiles = files && files.length > 0;
    let messageType = "TEXT";
    if (hasFiles) {
        const fileTypes = Array.from(files).map(file => file.type);
        const allImages = fileTypes.every(type => type.startsWith("image/"));
        const allVideos = fileTypes.every(type => type.startsWith("video/"));
        messageType = allImages ? "IMAGE" : allVideos ? "VIDEO" : "FILE";
        for (let file of files) {
            formData.append("files", file);
        }
    }
    formData.append("messageType", messageType);

    try {
        const response = await MessageService.sendMessage(formData, token);
        const status = response?.status;

        if (status?.code === "00" && status.success) {
            // Remove temporary message
            const tempEl = document.querySelector(`.message-wrapper[data-message-id="${tempMessageId}"]`);
            if (tempEl) tempEl.remove();

            // Add real message from server
            const messageEl = renderMessage(response.data, userId);
            messageEl.setAttribute('data-message-id', response.data.id);
            container.appendChild(messageEl);
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
            });

            // Update chat list
            const chatItem = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
            if (chatItem) {
                const lastMessageEl = chatItem.querySelector(".chat-last-message");
                if (lastMessageEl) {
                    lastMessageEl.textContent = content || "[File]";
                }
                chatItem.parentNode.prepend(chatItem);
                const unreadBadge = chatItem.querySelector(".unread-count");
                if (unreadBadge) unreadBadge.remove();
            }

            // Reset input
            input.value = "";
            input.removeAttribute("data-reply-id");
            input.placeholder = "Nhập tin nhắn...";
            fileInput.value = "";
        } else {
            // Remove temporary message on failure
            const tempEl = document.querySelector(`.message-wrapper[data-message-id="${tempMessageId}"]`);
            if (tempEl) tempEl.remove();
            alert("Gửi tin nhắn thất bại: " + (status?.message || "Không rõ lý do"));
        }
    } catch (err) {
        console.error("Lỗi khi gửi tin nhắn:", err);
        const tempEl = document.querySelector(`.message-wrapper[data-message-id="${tempMessageId}"]`);
        if (tempEl) tempEl.remove();
        alert("Có lỗi xảy ra khi gửi tin nhắn.");
    }
}

/**
 * Khởi tạo giao diện input
 */
document.addEventListener("DOMContentLoaded", () => {
    const inputContainer = document.getElementById("chat-input-container");
    if (inputContainer) {
        inputContainer.classList.remove('active');
        inputContainer.innerHTML = `
            <input type="file" id="chat-file" multiple style="display: none;"/>
            <button id="file-upload-button" title="Gửi file"><i class="bi bi-paperclip"></i></button>
            <textarea id="chat-input" placeholder="Nhập tin nhắn..."></textarea>
            <button id="chat-send-button"><img src="/images/title_logo.png"  style="width: 45px ; height: 45px ;" alt=""/></button>
        `;

        document.getElementById("file-upload-button").addEventListener("click", () => {
            document.getElementById("chat-file").click();
        });

        const sendButton = document.getElementById("chat-send-button");
        const inputField = document.getElementById("chat-input");

        sendButton.addEventListener('click', () => {
            const chatId = window.currentChatId;
            if ((inputField.value.trim() !== "" || document.getElementById("chat-file").files.length > 0) && chatId) {
                sendMessage(chatId);
            }
        });

        inputField.addEventListener('keydown', (e) => {
            if (e.key === "Enter") {
                if (e.shiftKey) return;
                e.preventDefault();
                const chatId = window.currentChatId;
                if ((inputField.value.trim() !== "" || document.getElementById("chat-file").files.length > 0) && chatId) {
                    sendMessage(chatId);
                }
            }
        });
    }

    // Kết nối WebSocket khi trang được tải
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    if (userId && token) {
        connectWebSocket(userId, token);
    }
});

/**
 * Xử lý menu ngữ cảnh
 */
function replyMessage(messageId) {
    const inputField = document.getElementById("chat-input");
    inputField.setAttribute("data-reply-id", messageId);
    inputField.placeholder = `Trả lời tin nhắn ${messageId}...`;
    inputField.focus();
}

function forwardMessage(messageId) {
    alert(`Chuyển tiếp tin nhắn ${messageId}`);
    // TODO: Add logic for forwarding message
}

async function recallMessage(messageId) {
    const token = localStorage.getItem("token");
    try {
        const response = await MessageService.recallMessage(messageId, token);
        if (response.status.code === "00" && response.status.success) {
            const messageElement = document.querySelector(`.message-wrapper[data-message-id="${messageId}"]`);
            if (messageElement) {
                messageElement.innerHTML = `
                    <div class="message-bubble">
                        <div class="message-content text-muted">[Tin nhắn đã được thu hồi]</div>
                    </div>
                `;
            }
        } else {
            alert("Thu hồi tin nhắn thất bại: " + (response.status.message || "Không rõ lý do"));
        }
    } catch (err) {
        console.error("Lỗi khi thu hồi tin nhắn:", err);
        alert("Có lỗi xảy ra khi thu hồi tin nhắn.");
    }
}

function closeProfile() {
    const profile = document.getElementById('profile-content');
    const chat = document.getElementById('chat-area');

    // Ẩn khung profile đi
    profile.style.display = 'none';

    // Gỡ bỏ các class responsive đã thêm vào trước đó
    if (window.innerWidth <= 768) {
        profile.classList.remove('active');
    } else {
        chat.classList.remove('split');
    }
}




document.getElementById('profile-close').addEventListener('click', closeProfile);

// Đóng profile-content khi nhấp nút đóng
document.getElementById('profile-close').addEventListener('click', () => {
    const profile = document.getElementById('profile-content');
    const chat = document.getElementById('chat-area');
    profile.style.display = 'none';

    if (window.innerWidth <= 768) {
        profile.classList.remove('active');
    } else {
        chat.classList.remove('split');
    }
});

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[tag] || tag));


}