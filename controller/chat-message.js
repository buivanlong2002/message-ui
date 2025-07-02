function loadChat(chatId, element, name, avatarUrl) {
    // Active item
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');

    // Token & userId
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) {
        localStorage.clear();
        window.location.href = "/login.html";
        return;
    }

    // Update chat header
    document.getElementById("chat-header").innerHTML = `
        <div class="header-left">
            <img src="${avatarUrl || '/images/default-avatar.jpg'}"
                 alt="Avatar"
                 class="chat-avatar"
                 onerror="this.onerror=null;this.src='/images/default-avatar.jpg';">
            <span class="header-name">${escapeHTML(name)}</span>
        </div>
        <div class="header-actions">
            <button class="header-btn" onclick="makeCall()"><i class="bi bi-telephone-fill"></i></button>
            <button class="header-btn" onclick="makeVideoCall()"><i class="bi bi-camera-video-fill"></i></button>
            <button class="header-btn" onclick="goToProfile()"><i class="bi bi-person-lines-fill"></i></button>
        </div>
    `;

    // Set global chatId
    window.currentChatId = chatId;

    // Show chat input container
    const inputContainer = document.getElementById("chat-input-container");
    inputContainer.classList.add('active');

    // Clear previous messages
    const container = document.getElementById("chat-messages");
    container.innerHTML = '';

    // Subscribe to WebSocket for messages
    subscribeToConversationMessages(chatId, userId, 0, 50);

    // Handle incoming messages via WebSocket
    const messageHandler = (event) => {
        const { conversationId, messages } = event.detail;

        // Ensure the messages belong to the current chat
        if (conversationId === chatId) {
            if (Array.isArray(messages)) {
                if (messages.length === 0) {
                    container.innerHTML = `<div class="empty-chat">Chưa có tin nhắn nào</div>`;
                    return;
                }

                messages.forEach(msg => {
                    const messageEl = renderMessage(msg, userId);
                    messageEl.setAttribute('data-message-id', msg.id);
                    container.appendChild(messageEl);
                });

                container.scrollTop = container.scrollHeight;
            } else {
                container.innerHTML = `<div class="error-chat">Không thể tải tin nhắn</div>`;
                console.warn("Lỗi khi lấy tin nhắn: Dữ liệu không đúng định dạng");
            }
        }
    };

    // Add event listener for messages
    window.addEventListener("conversationMessages", messageHandler);

    // Clean up event listener when switching chats to avoid memory leaks
    const cleanup = () => {
        window.removeEventListener("conversationMessages", messageHandler);
    };

    // Trigger cleanup when the chat changes or the window unloads
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('chatChanged', () => {
        cleanup();
    });
}

// ========================= RENDER MESSAGE =========================
function renderMessage(msg, userId) {
    // Kiểm tra xem tin nhắn có phải của người dùng hiện tại không
    const isUser = String(msg.sender.senderId) === String(userId);
    const wrapper = document.createElement("div");
    wrapper.className = "message-wrapper " + (isUser ? "user" : "other");

    const time = String(msg.timeAgo);
    let contentHtml = "";

    // Xử lý các loại tin nhắn
    switch (msg.messageType) {
        case "TEXT":
            contentHtml = `<div class="message-text">${escapeHTML(msg.content)}</div>`;
            break;
        case "IMAGE":
            if (msg.attachments?.length > 0) {
                const imagesHtml = msg.attachments.map(att => {
                    const url = "http://localhost:8885" + att.url; // Changed from att.fileUrl to att.url
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
                    const url = "http://localhost:8885" + att.url; // Changed from att.fileUrl to att.url
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
                    const url = "http://localhost:8885" + att.url; // Changed from att.fileUrl to att.url
                    const fileName = att.fileName || att.url.split("/").pop(); // Use fileName if available
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
        : "images/default-avatar.jpg";
    const senderName = msg.sender?.nameSender || "Unknown";

    const senderInfoHtml = isUser
        ? ""
        : `<div class="message-sender">${escapeHTML(senderName)}</div>`;

    // Thêm menu ngữ cảnh
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
                 onerror="this.src='images/default-avatar.jpg';"/>
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
// ========================= SEND MESSAGE =========================
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

    const formData = new FormData();
    formData.append("conversationId", chatId);
    formData.append("senderId", userId);

    if (content) formData.append("content", content);
    if (replyId) formData.append("replyToId", replyId);

    const hasFiles = files && files.length > 0;
    let messageType = "TEXT";
    if (hasFiles) {
        const fileTypes = Array.from(files).map(file => file.type);
        const allImages = fileTypes.every(type => type.startsWith("image/"));
        const allVideos = fileTypes.every(type => type.startsWith("video/"));

        if (allImages) {
            messageType = "IMAGE";
        } else if (allVideos) {
            messageType = "VIDEO";
        } else {
            messageType = "FILE";
        }

        for (let file of files) {
            formData.append("files", file);
        }
    }

    formData.append("messageType", messageType);

    try {
        const response = await MessageService.sendMessage(formData, token);
        const status = response?.status;

        if (status?.code === "00" && status.success) {
            const container = document.getElementById("chat-messages");

            const messageEl = document.createElement("div");
            messageEl.className = "message-wrapper user";

            let fileHtml = "";
            if (hasFiles) {
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

            messageEl.innerHTML = `
                <div class="message-avatar">
                    <img src="images/default-avatar.jpg" alt="Avatar" class="avatar-image"
                         onerror="this.src='images/default-avatar.jpg';"/>
                </div>
                <div class="message-bubble">
                    <div class="message-content">
                        ${content ? escapeHTML(content) + "<br/>" : ""}
                        ${fileHtml}
                    </div>
                    <div class="message-time">${new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            })}</div>
                    <div class="message-context-menu">
                        <ul>
                            <li onclick="replyMessage('${response.data.id}')"><i class="bi bi-reply-fill"></i> Trả lời</li>
                            <li onclick="forwardMessage('${response.data.id}')"><i class="bi bi-arrow-right-circle-fill"></i> Chuyển tiếp</li>
                            <li onclick="recallMessage('${response.data.id}')"><i class="bi bi-trash-fill"></i> Thu hồi</li>
                        </ul>
                    </div>
                </div>
            `;
            messageEl.setAttribute('data-message-id', response.data.id);

            container.appendChild(messageEl);
            container.scrollTop = container.scrollHeight;

            // Reset input
            input.value = "";
            input.removeAttribute("data-reply-id");
            input.placeholder = "Nhập tin nhắn...";
            fileInput.value = "";
        } else {
            alert("Gửi tin nhắn thất bại: " + (status?.message || "Không rõ lý do"));
        }
    } catch (err) {
        console.error("Lỗi khi gửi tin nhắn:", err);
        alert("Có lỗi xảy ra khi gửi tin nhắn.");
    }
}

// ========================= INPUT UI INIT =========================
const inputContainer = document.getElementById("chat-input-container");
inputContainer.innerHTML = `
    <input type="file" id="chat-file" multiple style="display: none;"/>
    <button id="file-upload-button" title="Gửi file"><i class="bi bi-paperclip"></i></button>
    <input type="text" id="chat-input" placeholder="Nhập tin nhắn..."/>
    <button id="chat-send-button"><i class="bi bi-send"></i></button>
`;

document.getElementById("file-upload-button").addEventListener("click", () => {
    document.getElementById("chat-file").click();
});

// ========================= GỬI TIN NHẮN =========================
document.addEventListener("DOMContentLoaded", () => {
    const inputContainer = document.getElementById("chat-input-container");
    if (inputContainer) {
        inputContainer.classList.remove('active'); // Ensure input is hidden initially
        inputContainer.innerHTML = `
            <input type="file" id="chat-file" multiple style="display: none;"/>
            <button id="file-upload-button" title="Gửi file"><i class="bi bi-paperclip"></i></button>
            <input type="text" id="chat-input" placeholder="Nhập tin nhắn..."/>
            <button id="chat-send-button"><i class="bi bi-send"></i></button>
        `;

        // Gán sự kiện
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
                if (e.shiftKey) return; // xuống dòng
                e.preventDefault();
                const chatId = window.currentChatId;
                if ((inputField.value.trim() !== "" || document.getElementById("chat-file").files.length > 0) && chatId) {
                    sendMessage(chatId);
                }
            }
        });
    }
});

// ========================= XỬ LÝ MENU NGỮ CẢNH =========================
function replyMessage(messageId) {
    const inputField = document.getElementById("chat-input");
    inputField.setAttribute("data-reply-id", messageId);
    inputField.placeholder = `Trả lời tin nhắn ${messageId}...`;
    inputField.focus();
}

function forwardMessage(messageId) {
    alert(`Chuyển tiếp tin nhắn ${messageId}`);
    // TODO: Thêm logic để mở modal chọn người nhận và gửi tin nhắn
}

async function recallMessage(messageId) {
    const token = localStorage.getItem("token");
    try {
        // Giả sử bạn có API để thu hồi tin nhắn
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