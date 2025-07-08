# 🚀 TomoTalk - Real-time Chat Application

Một ứng dụng chat real-time hiện đại được xây dựng bằng HTML, CSS và JavaScript thuần với giao diện đẹp và chức năng đầy đủ.

## ✨ Tính năng chính

### 🔐 Authentication & Security
- **Đăng nhập/Đăng ký** với validation mạnh mẽ
- **JWT Token** với auto-refresh mechanism
- **Input sanitization** để ngăn chặn XSS
- **Rate limiting** để bảo vệ API
- **Auto logout** khi không hoạt động (30 phút)

### 💬 Real-time Chat
- **Tin nhắn real-time** với WebSocket
- **Hỗ trợ file** (ảnh, video, document)
- **Message types**: Text, Image, Video, File
- **Message actions**: Reply, Forward, Recall
- **Typing indicators** và online status
- **Message status**: Sent, Delivered, Read

### 👥 Conversation Management
- **Chat 1-1** và **Group chat**
- **Tìm kiếm** cuộc trò chuyện
- **Quản lý nhóm**: Thêm/xóa thành viên, đổi ảnh
- **Archive** và **pin** cuộc trò chuyện

### 🎨 User Experience
- **Responsive design** cho mọi thiết bị
- **Dark mode** support
- **Smooth animations** và transitions
- **Loading states** và error handling
- **Notification system** đẹp mắt
- **Keyboard shortcuts**

## 🛠️ Công nghệ sử dụng

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Real-time**: SockJS, STOMP
- **UI Framework**: Bootstrap Icons
- **State Management**: Custom AppState class
- **Security**: JWT, Input validation, Rate limiting

## 📁 Cấu trúc dự án

```
message-ui/
├── 📄 index.html              # Trang chính chat
├── 📄 auth.html               # Trang đăng nhập/đăng ký
├── 📄 reset-password.html     # Đặt lại mật khẩu
├── 📄 README.md               # Hướng dẫn này
├── 📁 controller/             # Logic xử lý
│   ├── api.js                 # API configuration & utilities
│   ├── auth.js                # Authentication logic
│   ├── chat-list.js           # Chat list management
│   ├── chat-message.js        # Message handling
│   ├── profile-chat.js        # Profile management
│   └── state.js               # State management
├── 📁 service/                # API services
│   ├── websocket.js           # WebSocket connection
│   ├── ConversationService.js # Conversation API
│   ├── messageService.js      # Message API
│   ├── AuthService.js         # Auth API
│   ├── FriendshipService.js   # Friend management
│   ├── ConversationMemberService.js # Group members
│   ├── AttachmentService.js   # File upload
│   └── MessageStatusService.js # Message status
├── 📁 css/                    # Styling
│   ├── style.css              # Main styles (2000+ lines)
│   ├── auth.css               # Auth page styles
│   └── login.css              # Login styles
└── 📁 images/                 # Assets
    ├── logo_TomoTalk.png      # App logo
    ├── title_logo.png         # Title icon
    ├── background_login.jpg   # Login background
    ├── banner.jpg             # Banner image
    └── default_avatar.jpg     # Default avatar
```

## 🚀 Cách sử dụng

### 1. Khởi động
```bash
# Mở file auth.html trong trình duyệt
# Hoặc sử dụng local server
python -m http.server 8000
# Sau đó truy cập http://localhost:8000/auth.html
```

### 2. Đăng ký tài khoản
- Nhập thông tin cá nhân
- Email phải hợp lệ
- Mật khẩu tối thiểu 6 ký tự (bao gồm chữ hoa, chữ thường, số)

### 3. Đăng nhập
- Sử dụng email và mật khẩu đã đăng ký
- Token sẽ được lưu tự động
- Auto-refresh khi token hết hạn

### 4. Chat
- Click vào cuộc trò chuyện trong sidebar
- Gõ tin nhắn và nhấn Enter
- Upload file bằng nút đính kèm
- Sử dụng menu ngữ cảnh cho các hành động

## 🔧 Cải thiện đã thực hiện

### 🔒 Bảo mật
- ✅ **Input validation** mạnh mẽ
- ✅ **XSS protection** với sanitization
- ✅ **Rate limiting** cho API calls
- ✅ **Token refresh** mechanism
- ✅ **Auto logout** khi không hoạt động
- ✅ **CSRF protection** headers

### 🎨 User Experience
- ✅ **Notification system** đẹp mắt
- ✅ **Loading states** và skeleton loading
- ✅ **Error handling** toàn diện
- ✅ **Dark mode** support
- ✅ **Responsive design** tối ưu
- ✅ **Accessibility** improvements

### ⚡ Performance
- ✅ **Lazy loading** cho images
- ✅ **Optimistic updates** cho messages
- ✅ **State management** tập trung
- ✅ **Memory management** tốt hơn
- ✅ **File size validation**

### 📱 Mobile Experience
- ✅ **Touch-friendly** buttons
- ✅ **Swipe gestures** support
- ✅ **Pull-to-refresh** indicator
- ✅ **Mobile-optimized** layout

## 🔧 API Configuration

### Base URL
```javascript
const API_CONFIG = {
    BASE_URL: 'http://localhost:8885/api',
    TIMEOUT: 10000 // 10 seconds
};
```

### WebSocket
```javascript
const WS_URL = 'http://localhost:8885/ws';
```

## 🎯 Keyboard Shortcuts

- `Ctrl + K`: Focus search box
- `Enter`: Send message
- `Shift + Enter`: New line in message
- `Escape`: Close modals/profiles

## 🌙 Dark Mode

Ứng dụng hỗ trợ dark mode tự động dựa trên system preference:
```javascript
// Toggle theme manually
appState.toggleTheme();
```

## 📊 State Management

Sử dụng AppState class để quản lý state tập trung:
```javascript
// Subscribe to state changes
appState.subscribe('conversations', (conversations) => {
    // Update UI when conversations change
});

// Update state
appState.set('currentChat', chat);
appState.setUser(user);
```

## 🔍 Debug & Development

### Debug State
```javascript
// Trong console
appState.debug();
```

### Development Mode
- State changes được log trong console
- Error tracking chi tiết
- Performance monitoring

## 🚀 Deployment

### Production Build
1. Minify CSS và JavaScript
2. Optimize images
3. Enable compression
4. Set up HTTPS
5. Configure CORS

### Environment Variables
```javascript
// Production
const API_CONFIG = {
    BASE_URL: 'https://api.tomotalk.com/api',
    TIMEOUT: 15000
};
```

## 🤝 Contributing

1. Fork dự án
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📝 License

MIT License - xem file LICENSE để biết thêm chi tiết.

## 🆘 Support

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra console để xem lỗi
2. Đảm bảo backend server đang chạy
3. Kiểm tra network connection
4. Tạo issue với thông tin chi tiết

## 🎉 Credits

- **Icons**: Bootstrap Icons
- **Fonts**: Roboto, Segoe UI
- **Design**: Inspired by modern chat apps
- **Backend**: Spring Boot (separate repository)

---

**TomoTalk** - Kết nối bạn bè, khám phá thế giới qua từng cuộc trò chuyện! 🚀 