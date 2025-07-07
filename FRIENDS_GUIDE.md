# Hướng dẫn phần Bạn bè và Lời mời kết bạn

## Tổng quan

Hệ thống TomoTalk đã được cập nhật để xử lý dữ liệu bạn bè và lời mời kết bạn từ backend API.

## API Endpoints

### 1. Lấy danh sách bạn bè
- **Endpoint**: `GET /friendships/friends?userId={userId}`
- **Response**: `ApiResponse<List<String>>` - Danh sách tên bạn bè
- **Ví dụ**:
```json
{
  "status": {
    "code": "00",
    "success": true,
    "displayMessage": "Lấy danh sách bạn bè thành công"
  },
  "data": ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C"]
}
```

### 2. Lấy danh sách lời mời kết bạn
- **Endpoint**: `GET /friendships/friend-requests?userId={userId}`
- **Response**: `ApiResponse<List<FriendRequestRequest>>` - Danh sách lời mời
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
      "senderName": "Nguyễn Văn A",
      "requestedAt": "2024-01-15T10:30:00Z"
    },
    {
      "senderName": "Trần Thị B", 
      "requestedAt": "2024-01-14T15:45:00Z"
    }
  ]
}
```

## Các tính năng đã triển khai

### 1. Hiển thị danh sách bạn bè
- ✅ Hiển thị tên bạn bè từ API
- ✅ Avatar mặc định cho tất cả bạn bè
- ✅ Nút "Nhắn tin" và "Xóa"
- ✅ Tìm kiếm bạn bè theo tên

### 2. Hiển thị lời mời kết bạn
- ✅ Hiển thị tên người gửi lời mời
- ✅ Hiển thị thời gian gửi lời mời
- ✅ Nút "Chấp nhận" và "Từ chối"
- ✅ Tìm kiếm lời mời theo tên

### 3. Xử lý hành động
- ✅ Chấp nhận lời mời kết bạn
- ✅ Từ chối lời mời kết bạn
- ✅ Xóa bạn bè (placeholder)
- ✅ Nhắn tin với bạn bè (placeholder)

## Cấu trúc dữ liệu

### FriendRequestRequest
```java
public class FriendRequestRequest {
    private String senderName;
    private Date requestedAt;
    // getters, setters
}
```

## Các file đã được cập nhật

1. `service/FriendshipService.js` - Cập nhật API endpoints
2. `controller/profile-controller.js` - Xử lý dữ liệu mới
3. `index.html` - Thêm search box cho lời mời kết bạn

## Các hàm chính

### ProfileController
- `loadFriends()` - Tải danh sách bạn bè
- `displayFriends(friendNames)` - Hiển thị danh sách bạn bè
- `loadFriendRequests()` - Tải lời mời kết bạn
- `displayFriendRequests(requests)` - Hiển thị lời mời kết bạn
- `createFriendItemFromName(friendName, type)` - Tạo element cho bạn bè
- `createFriendRequestItem(request)` - Tạo element cho lời mời
- `handleFriendActionForName(action, friendName, type)` - Xử lý hành động bạn bè
- `handleFriendRequestAction(action, senderName)` - Xử lý hành động lời mời
- `formatTimeAgo(date)` - Format thời gian

## TODO - Cần triển khai thêm

1. **API xóa bạn bè theo tên**
   - Cần backend endpoint để xóa bạn bè dựa trên tên

2. **API chấp nhận/từ chối theo tên**
   - Cần backend endpoint để xử lý lời mời dựa trên tên người gửi

3. **Chat với bạn bè**
   - Cần tích hợp với ConversationService để tạo/bắt đầu chat

4. **Avatar thực tế**
   - Cần API để lấy thông tin chi tiết bạn bè bao gồm avatar

## Lưu ý

- Hiện tại tất cả bạn bè đều sử dụng avatar mặc định
- Chức năng chat và xóa bạn bè đang là placeholder
- Cần backend hỗ trợ thêm các API để hoàn thiện tính năng 