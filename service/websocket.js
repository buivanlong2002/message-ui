let stompClient = null;
let retryCount = 0;
const maxRetries = 5;
const subscribedTopics = new Set();

/**
 * Kết nối tới WebSocket server và khởi tạo subscription cho cuộc trò chuyện
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

            // Yêu cầu lấy danh sách cuộc trò chuyện ban đầu
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
 * Gửi yêu cầu lấy tin nhắn và đăng ký nhận dữ liệu từ một cuộc trò chuyện cụ thể
 */
function subscribeToConversationMessages(conversationId, userId, page = 0, size = 20) {
    if (!stompClient || !stompClient.connected) {
        console.warn("⚠️ WebSocket chưa kết nối.");
        return;
    }

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

    stompClient.send("/app/messages/get", {}, JSON.stringify({
        conversationId,
        userId, // 👈 gửi thêm userId
        page,
        size
    }));


}


