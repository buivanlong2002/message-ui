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

    // Cập nhật tiêu đề
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

    // Gán chatId toàn cục
    window.currentChatId = chatId;

    // Show chat input container
    const inputContainer = document.getElementById("chat-input-container");
    inputContainer.classList.add('active');

    // Gọi API lấy tin nhắn
    MessageService.getMessagesByConversation(chatId, 0, 50, token)
        .then(result => {
            const container = document.getElementById("chat-messages");
            container.innerHTML = '';

            const status = result.status;
            const messages = result.data;

            if (status?.code === "00" && status.success && Array.isArray(messages)) {
                if (messages.length === 0) {
                    container.innerHTML = `<div class="empty-chat">Chưa có tin nhắn nào</div>`;
                    return;
                }

                messages.forEach(msg => {
                    container.appendChild(renderMessage(msg, userId));
                });

                container.scrollTop = container.scrollHeight;
            } else {
                container.innerHTML = `<div class="error-chat">Không thể tải tin nhắn</div>`;
                console.warn("Lỗi khi lấy tin nhắn:", status?.message || "Không rõ lỗi");
            }
        })
        .catch(err => {
            console.error("Lỗi khi load chat:", err.message);
            document.getElementById("chat-messages").innerHTML =
                `<div class="error-chat">Không thể kết nối đến máy chủ.</div>`;
        });
}

// ========================= RENDER MESSAGE =========================
function renderMessage(msg, userId) {
    // Fix: Use msg.senderId instead of msg.sender.senderId
    const isUser = String(msg.sender.senderId) === String(userId);
    const wrapper = document.createElement("div");
    wrapper.className = "message-wrapper " + (isUser ? "user" : "other");

    const time = String(msg.timeAgo);

    let contentHtml = "";

    switch (msg.messageType) {
        case "TEXT":
            contentHtml = `<div class="message-text">${escapeHTML(msg.content)}</div>`;
            break;

        case "IMAGE":
            if (msg.attachments?.length > 0) {
                const imagesHtml = msg.attachments.map(att => {
                    const url = "http://localhost:8885" + att.fileUrl;
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
                    const url = "http://localhost:8885" + att.fileUrl;
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
                    const url = "http://localhost:8885" + att.fileUrl;
                    const fileName = att.fileUrl.split("/").pop();
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

    // Avatar outside message-bubble; sender name inside for non-user messages
    const senderInfoHtml = isUser
        ? ""
        : `<div class="message-sender">${escapeHTML(senderName)}</div>`;

    wrapper.innerHTML = `
        <div class="message-avatar">
            <img src="${senderAvatar}" alt="Avatar" class="avatar-image"
                 onerror="this.src='images/default-avatar.jpg';"/>
        </div>
        <div class="message-bubble">
            ${senderInfoHtml}
            <div class="message-content">${contentHtml}</div>
            <div class="message-time">${time}</div>
        </div>
    `;

    return wrapper;
}

// ========================= SEND MESSAGE =========================
async function sendMessage(chatId) {
    const input = document.getElementById("chat-input");
    const fileInput = document.getElementById("chat-file");

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

    const hasFiles = files && files.length > 0;

    // Xác định loại message
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
                </div>
            `;

            container.appendChild(messageEl);
            container.scrollTop = container.scrollHeight;

            // Reset input
            input.value = "";
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