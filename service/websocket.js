let stompClient = null;
let retryCount = 0;
const maxRetries = 5;
const subscribedTopics = new Set();

/**
 * Kết nối tới WebSocket server và khởi tạo subscription cho người dùng
 */
function connectWebSocket(userId, token) {
    if (retryCount >= maxRetries) {
        console.error("Đã vượt quá số lần kết nối lại.");
        return;
    }

    const socket = new SockJS("http://localhost:8885/ws");
    stompClient = Stomp.over(socket);

    stompClient.connect(
        { Authorization: "Bearer " + token },
        function (frame) {
            console.log("✅ WebSocket connected:", frame);
            retryCount = 0;

            // Đăng ký nhận danh sách cuộc trò chuyện
            subscribeToConversations(userId);

            // Gửi yêu cầu lấy danh sách cuộc trò chuyện ban đầu
            stompClient.send("/app/conversations/get", {}, JSON.stringify(userId));
        },
        function (error) {
            console.error("❌ WebSocket connection error:", error);
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
 * Gửi yêu cầu lấy tin nhắn và đăng ký nhận realtime từ một cuộc trò chuyện cụ thể
 */
function subscribeToConversationMessages(conversationId, page = 0, size = 20) {
    if (!stompClient || !stompClient.connected) {
        console.warn("⚠️ WebSocket chưa kết nối.");
        return;
    }

    const topic = `/topic/messages/${conversationId}`;

    if (!subscribedTopics.has(topic)) {
        stompClient.subscribe(topic, function (message) {
            const raw = JSON.parse(message.body);
            const messages = Array.isArray(raw) ? raw : [raw]; // Xử lý dữ liệu luôn là mảng

            const event = new CustomEvent("conversationMessages", {
                detail: {
                    conversationId,
                    messages
                }
            });
            window.dispatchEvent(event);
        });

        subscribedTopics.add(topic);
    }

    // Gửi yêu cầu lấy tin nhắn cũ
    stompClient.send("/app/messages/get", {}, JSON.stringify({
        conversationId,
        page,
        size
    }));
}
