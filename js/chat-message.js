// Gửi tin nhắn tới API
function sendMessage(chatId) {
    const inputField = document.getElementById("chat-input");
    const content = inputField.value.trim();
    if (!content) return;

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) {
        localStorage.clear();
        window.location.href = "/login.html";
        return;
    }

    const messageData = {
        conversationId: chatId,
        senderId: userId,
        content: content
    };

    fetchAPI("/messages/send", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(messageData)
    })
        .then(response => {
            const status = response.status;
            if (status?.code === "00" && status.success) {
                // Thêm tin nhắn vừa gửi vào giao diện
                const chatMessages = document.getElementById("chat-messages");
                const messageEl = document.createElement("div");
                messageEl.className = "message-wrapper user";
                messageEl.innerHTML = `
                    <div class="message-bubble">
                        <div class="message-content">${content}</div>
                        <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                `;
                chatMessages.appendChild(messageEl);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                inputField.value = "";
            } else {
                alert("Gửi tin nhắn thất bại!");
            }
        })
        .catch(error => {
            console.error("Lỗi khi gửi tin nhắn:", error.message);
        });
}

// Tải đoạn chat và xử lý gửi tin nhắn
function loadChat(chatId, element, name) {
    // Đánh dấu đoạn chat đang được chọn
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');

    // Cập nhật header
    document.getElementById("chat-header").innerHTML = `
        <div class="header-left">
            <img src="https://via.placeholder.com/40" class="header-avatar" alt="Avatar">
            <span class="header-name">${name}</span>
        </div>
        <div class="header-actions">
            <button class="header-btn" onclick="makeCall()"><i class="bi bi-telephone-fill"></i></button>
            <button class="header-btn" onclick="makeVideoCall()"><i class="bi bi-camera-video-fill"></i></button>
            <button class="header-btn" onclick="goToProfile()"><i class="bi bi-person-lines-fill"></i></button>
        </div>
    `;

    // Lấy token
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("Thiếu token");
        return;
    }

    // Gọi API lấy tin nhắn
    fetchAPI(`/messages/get-by-conversation?conversationId=${chatId}`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
        .then(result => {
            const chatMessages = document.getElementById("chat-messages");
            chatMessages.innerHTML = "";

            const status = result.status;
            if (status?.code === "00" && status.success && Array.isArray(result.data)) {
                result.data.forEach(msg => {
                    const isUser = msg.senderId === localStorage.getItem('userId');
                    const messageEl = document.createElement("div");
                    messageEl.className = "message-wrapper " + (isUser ? "user" : "other");

                    messageEl.innerHTML = `
                        <div class="message-bubble">
                            <div class="message-content">${msg.content}</div>
                            <div class="message-time">${new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    `;
                    chatMessages.appendChild(messageEl);
                });

                // Tự động cuộn xuống cuối
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } else {
                chatMessages.innerHTML = "<div class='message-wrapper other'><div class='message-bubble'>(Không có tin nhắn)</div></div>";
            }
        })
        .catch(error => {
            console.error("Lỗi khi tải tin nhắn:", error.message);
        });

    // Giao diện ô nhập và nút gửi
    const inputContainer = document.getElementById("chat-input-container");
    inputContainer.innerHTML = `
        <input type="text" id="chat-input" placeholder="Nhập tin nhắn..." />
        <button id="chat-send-button"><i class="bi bi-send"></i></button>
    `;

    const sendButton = document.getElementById("chat-send-button");
    const inputField = document.getElementById("chat-input");

    // Gửi bằng click
    sendButton.addEventListener('click', () => {
        if (inputField.value.trim() !== "") {
            sendMessage(chatId);
        }
    });

    // Gửi bằng Enter, xuống dòng khi Shift+Enter
    inputField.addEventListener('keydown', (e) => {
        if (e.key === "Enter") {
            if (e.shiftKey) return; // cho phép xuống dòng
            e.preventDefault(); // ngăn Enter gửi form
            if (inputField.value.trim() !== "") {
                sendMessage(chatId);
            }
        }
    });
}
