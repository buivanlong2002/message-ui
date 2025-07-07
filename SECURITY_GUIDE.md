# Hướng dẫn sử dụng tính năng Bảo mật

## Tổng quan
Phần Bảo mật cung cấp 3 tính năng chính:
1. **Chỉnh sửa thông tin cá nhân**
2. **Đổi mật khẩu**
3. **Quản lý danh sách chặn**

## 1. Chỉnh sửa thông tin cá nhân

### Các trường có thể chỉnh sửa:
- **Tên hiển thị**: Tên sẽ hiển thị cho người khác
- **Ảnh đại diện**: Đường dẫn tương đối đến file ảnh (VD: `/uploads/avatar.jpg`)
- **Ảnh bìa**: Đường dẫn tương đối đến file ảnh bìa (VD: `/uploads/cover.jpg`)
- **Tiểu sử**: Mô tả ngắn về bản thân

### Cách sử dụng:
1. Vào menu → Bảo mật
2. Chọn tab "Chỉnh sửa thông tin"
3. Điền thông tin muốn thay đổi
4. Nhấn "Lưu thay đổi"

### Lưu ý:
- Ảnh đại diện và ảnh bìa sử dụng đường dẫn tương đối
- Nếu không có ảnh, để trống trường tương ứng
- Hệ thống sẽ tự động thêm base URL khi hiển thị

## 2. Đổi mật khẩu

### Yêu cầu:
- Mật khẩu mới phải có ít nhất 6 ký tự
- Phải xác nhận mật khẩu mới

### Cách sử dụng:
1. Vào menu → Bảo mật
2. Chọn tab "Đổi mật khẩu"
3. Nhập mật khẩu hiện tại
4. Nhập mật khẩu mới (tối thiểu 6 ký tự)
5. Xác nhận mật khẩu mới
6. Nhấn "Cập nhật mật khẩu"

### Bảo mật:
- Mật khẩu được mã hóa trước khi gửi lên server
- Sau khi đổi thành công, form sẽ được reset

## 3. Quản lý danh sách chặn

### Tính năng:
- **Xem danh sách**: Hiển thị tất cả người dùng đã bị chặn
- **Bỏ chặn**: Cho phép bỏ chặn người dùng khỏi danh sách

### Cách sử dụng:
1. Vào menu → Bảo mật
2. Chọn tab "Quản lý chặn"
3. Xem danh sách người dùng bị chặn
4. Nhấn "Bỏ chặn" bên cạnh người dùng muốn bỏ chặn
5. Xác nhận hành động

### Hiển thị thông tin:
- Ảnh đại diện của người dùng
- Tên hiển thị
- Trạng thái "Đã bị chặn"
- Nút "Bỏ chặn"

## API Endpoints

### Cập nhật profile:
```
PUT /users/update/{userId}
Body: {
  "displayName": "string",
  "avatarUrl": "string",
  "coverUrl": "string", 
  "bio": "string"
}
```

### Đổi mật khẩu:
```
PUT /users/change-password/{userId}
Body: {
  "currentPassword": "string",
  "newPassword": "string"
}
```

### Lấy danh sách chặn:
```
GET /friendships/blocked-users?userId={userId}
```

### Bỏ chặn:
```
DELETE /friendships/unblock?senderId={userId}&receiverId={blockedUserId}
```

## Xử lý lỗi

### Thông báo thành công:
- Hiển thị màu xanh
- Tự động ẩn sau 3 giây

### Thông báo lỗi:
- Hiển thị màu đỏ
- Tự động ẩn sau 5 giây
- Hiển thị chi tiết lỗi từ server

### Các lỗi thường gặp:
- **403 Forbidden**: Token không hợp lệ hoặc hết hạn
- **404 Not Found**: API endpoint không tồn tại
- **400 Bad Request**: Dữ liệu gửi lên không đúng format

## Lưu ý kỹ thuật

### Avatar URL handling:
- Frontend sử dụng hàm `getAvatarUrl()` để xử lý avatar
- Tự động thêm base URL nếu cần
- Có avatar mặc định khi không có ảnh

### Authentication:
- Tất cả API calls đều cần token hợp lệ
- Token được lưu trong localStorage
- Tự động logout khi token hết hạn

### Loading states:
- Hiển thị "Đang tải..." khi đang gọi API
- Disable buttons trong quá trình xử lý
- Restore trạng thái ban đầu sau khi hoàn thành 