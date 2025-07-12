let stompClient = null;
let retryCount = 0;
const maxRetries = 5;
const subscribedTopics = new Set();

/**
 * Kết nối tới WebSocket server
 */
function connectWebSocket(userId, token) {
    if (retryCount >= maxRetries) {
        alert("Không thể kết nối đến server. Vui lòng thử lại sau.");
        return;
    }

    const socket = new SockJS("https://cms-service.up.railway.app/ws");
    stompClient = Stomp.over(socket);

    stompClient.connect(
        { Authorization: "Bearer " + token },
        function (frame) {
            retryCount = 0;
            console.log("Kết nối WebSocket thành công");

            // Đăng ký các kênh cần thiết
            subscribeToConversations(userId);
            subscribeToNewMessages(userId);
            subscribeToMessageUpdates(userId); // 👈 Đăng ký nhận tin nhắn chỉnh sửa

            // Gửi yêu cầu lấy danh sách cuộc trò chuyện ban đầu
            stompClient.send("/app/conversations/get", {}, JSON.stringify(userId));
        },
        function (error) {
            console.error("Lỗi WebSocket:", error);
            retryCount++;
            setTimeout(() => connectWebSocket(userId, token), 1000);
        }
    );
}

/**
 * Đăng ký nhận danh sách cuộc trò chuyện
 */
function subscribeToConversations(userId) {
    const topic = `/topic/conversations/${userId}`;
    if (subscribedTopics.has(topic)) return;

    stompClient.subscribe(topic, function (message) {
        const conversations = JSON.parse(message.body);
        const event = new CustomEvent("conversationsData", { detail: conversations });
        window.dispatchEvent(event);
    });

    subscribedTopics.add(topic);
}

/**
 * Đăng ký nhận tin nhắn mới
 */
function subscribeToNewMessages(userId) {
    const topic = `/topic/new-message/${userId}`;
    if (subscribedTopics.has(topic)) return;

    stompClient.subscribe(topic, function (message) {
        const { conversationId, message: newMessage } = JSON.parse(message.body);
        const event = new CustomEvent("newMessageReceived", {
            detail: { conversationId, message: newMessage }
        });
        window.dispatchEvent(event);
    });

    subscribedTopics.add(topic);
}

/**
 * Đăng ký nhận tin nhắn đã chỉnh sửa
 */
function subscribeToMessageUpdates(userId) {
    const topic = `/topic/message-updated/${userId}`;
    if (subscribedTopics.has(topic)) return;

    stompClient.subscribe(topic, function (message) {
        const updatedMessage = JSON.parse(message.body);
        const event = new CustomEvent("messageUpdated", {
            detail: updatedMessage
        });
        window.dispatchEvent(event);
    });

    subscribedTopics.add(topic);
}

/**
 * Đăng ký và yêu cầu tin nhắn trong một cuộc trò chuyện
 */
function subscribeToConversationMessages(conversationId, page = 0, size = 50) {
    if (!stompClient || !stompClient.connected) return;

    const userId = localStorage.getItem("userId");
    const topic = `/topic/messages/${conversationId}/${userId}`;
    if (!subscribedTopics.has(topic)) {
        stompClient.subscribe(topic, function (message) {
            const messages = JSON.parse(message.body);
            const event = new CustomEvent("conversationMessages", {
                detail: { conversationId, messages }
            });
            window.dispatchEvent(event);
        });

        subscribedTopics.add(topic);
    }

    // Lấy thời gian cuối xem (nếu có)
    const lastSeenTimestamp = localStorage.getItem(`lastSeen_${conversationId}`) || new Date().toISOString();
    stompClient.send("/app/messages/get", {}, JSON.stringify({
        conversationId,
        userId,
        page,
        size,
        afterTimestamp: lastSeenTimestamp
    }));
}
