# Hướng dẫn phần Bạn bè và Lời mời kết bạn

## Tổng quan

Hệ thống TomoTalk đã được cập nhật để xử lý dữ liệu bạn bè và lời mời kết bạn từ backend API với thông tin chi tiết.

## API Endpoints

### 1. Lấy danh sách bạn bè
- **Endpoint**: `GET /friendships/friends?userId={userId}`
- **Response**: `ApiResponse<List<FriendResponse>>` - Danh sách thông tin bạn bè chi tiết
- **Ví dụ**:
```json
{
  "status": {
    "code": "00",
    "success": true,
    "displayMessage": "Lấy danh sách bạn bè thành công"
  },
  "data": [
    {
      "id": "user123",
      "displayName": "Nguyễn Văn A",
      "avatarUrl": "/uploads/avatar1.jpg"
    },
    {
      "id": "user456", 
      "displayName": "Trần Thị B",
      "avatarUrl": "/uploads/avatar2.jpg"
    }
  ]
}
```

### 2. Lấy danh sách lời mời kết bạn
- **Endpoint**: `GET /friendships/friend-requests?userId={userId}`
- **Response**: `ApiResponse<List<PendingFriendRequestResponse>>` - Danh sách lời mời chi tiết
- **Ví dụ**:
```json
{
  "status": {
    "code": "00",
    "success": true,
    "displayMessage": "Lấy danh sách lời mời kết bạn đang chờ thành công"
  },
  "data": [
    {
      "senderId": "user789",
      "displayName": "Nguyễn Văn A",
      "avatarUrl": "/uploads/avatar3.jpg",
      "requestedAt": "2024-01-15T10:30:00Z"
    },
    {
      "senderId": "user101",
      "displayName": "Trần Thị B",
      "avatarUrl": "/uploads/avatar4.jpg", 
      "requestedAt": "2024-01-14T15:45:00Z"
    }
  ]
}
```

## Cấu trúc dữ liệu

### FriendResponse
```java
public class FriendResponse {
    private String id;
    private String displayName;
    private String avatarUrl;
    // getters, setters
}
```

### PendingFriendRequestResponse
```java
public class PendingFriendRequestResponse {
    private String senderId;
    private String displayName;
    private String avatarUrl;
    private LocalDateTime requestedAt;
    // getters, setters
}
```

## Các tính năng đã triển khai

### 1. Hiển thị danh sách bạn bè
- ✅ Hiển thị thông tin chi tiết: id, tên, avatar
- ✅ Avatar thực tế từ backend
- ✅ Nút "Nhắn tin" và "Xóa"
- ✅ Tìm kiếm bạn bè theo tên
- ✅ Xóa bạn bè với API thực tế

### 2. Hiển thị lời mời kết bạn
- ✅ Hiển thị thông tin chi tiết: senderId, tên, avatar, thời gian
- ✅ Avatar thực tế từ backend
- ✅ Nút "Chấp nhận" và "Từ chối"
- ✅ Tìm kiếm lời mời theo tên
- ✅ Chấp nhận/từ chối với API thực tế

### 3. Xử lý hành động
- ✅ Chấp nhận lời mời kết bạn (với senderId)
- ✅ Từ chối lời mời kết bạn (với senderId)
- ✅ Xóa bạn bè (với friendId)
- ✅ Nhắn tin với bạn bè (placeholder)

## Các file đã được cập nhật

1. `service/FriendshipService.js` - Cập nhật comment về dữ liệu mới
2. `controller/profile-controller.js` - Xử lý dữ liệu FriendResponse và PendingFriendRequestResponse
3. `index.html` - Thêm search box cho lời mời kết bạn

## Các hàm chính

### ProfileController
- `loadFriends()` - Tải danh sách bạn bè
- `displayFriends(friends)` - Hiển thị danh sách bạn bè với thông tin chi tiết
- `loadFriendRequests()` - Tải lời mời kết bạn
- `displayFriendRequests(requests)` - Hiển thị lời mời kết bạn với thông tin chi tiết
- `createFriendItem(user, type)` - Tạo element cho bạn bè với thông tin đầy đủ
- `createFriendRequestItem(request)` - Tạo element cho lời mời với thông tin đầy đủ
- `handleFriendAction(action, targetUserId, type)` - Xử lý hành động bạn bè với API thực tế
- `handleFriendRequestAction(action, senderId, senderName)` - Xử lý hành động lời mời với API thực tế
- `formatTimeAgo(date)` - Format thời gian

## Cải tiến so với phiên bản trước

### Trước đây:
- API trả về `List<String>` cho bạn bè
- API trả về `List<FriendRequestRequest>` cho lời mời
- Chỉ có tên, không có avatar thực tế
- Hành động xóa và chấp nhận/từ chối là placeholder

### Hiện tại:
- API trả về `List<FriendResponse>` cho bạn bè
- API trả về `List<PendingFriendRequestResponse>` cho lời mời
- Có đầy đủ thông tin: id, tên, avatar
- Hành động xóa và chấp nhận/từ chối hoạt động với API thực tế

## TODO - Cần triển khai thêm

1. **Chat với bạn bè**
   - Cần tích hợp với ConversationService để tạo/bắt đầu chat

2. **Cải thiện UX**
   - Thêm loading state khi thực hiện hành động
   - Thêm confirmation dialog cho các hành động quan trọng

## Lưu ý

- Avatar hiện tại được lấy từ backend và hiển thị đúng
- Tất cả hành động (chấp nhận, từ chối, xóa) đều hoạt động với API thực tế
- Chức năng chat vẫn đang là placeholder, cần tích hợp với ConversationService 