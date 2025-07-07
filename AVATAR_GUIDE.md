# Hướng dẫn xử lý Avatar trong TomoTalk

## Tổng quan

Hệ thống TomoTalk sử dụng một hàm helper `getAvatarUrl()` để xử lý avatar URL một cách nhất quán trong toàn bộ ứng dụng.

## Hàm Helper

```javascript
function getAvatarUrl(avatarPath) {
    if (!avatarPath) {
        return 'images/default_avatar.jpg';
    }
    
    // Nếu đã là URL đầy đủ
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
        return avatarPath;
    }
    
    // Nếu là đường dẫn tương đối, thêm base URL
    if (avatarPath.startsWith('/')) {
        return `http://localhost:8885${avatarPath}`;
    }
    
    // Nếu không có / ở đầu, thêm /
    return `http://localhost:8885/${avatarPath}`;
}
```

## Cách sử dụng

### 1. Hiển thị avatar
```javascript
// Sử dụng hàm helper
const avatarUrl = getAvatarUrl(user.avatarUrl);
imgElement.src = avatarUrl;
```

### 2. Lưu avatar URL
Khi lưu avatar URL vào form, chỉ lưu đường dẫn tương đối:
```javascript
// Xử lý avatar URL để chỉ lưu đường dẫn tương đối
let avatarUrl = userData.avatarUrl || '';
if (avatarUrl && avatarUrl.startsWith('http://localhost:8885/')) {
    avatarUrl = avatarUrl.replace('http://localhost:8885/', '');
} else if (avatarUrl && avatarUrl.startsWith('http://localhost:8885')) {
    avatarUrl = avatarUrl.replace('http://localhost:8885', '');
}
```

### 3. Các trường hợp xử lý

#### Trường hợp 1: Không có avatar
- Input: `null`, `undefined`, `""`
- Output: `'images/default_avatar.jpg'`

#### Trường hợp 2: URL đầy đủ
- Input: `'http://localhost:8885/uploads/avatar.jpg'`
- Output: `'http://localhost:8885/uploads/avatar.jpg'`

#### Trường hợp 3: Đường dẫn tương đối có /
- Input: `'/uploads/avatar.jpg'`
- Output: `'http://localhost:8885/uploads/avatar.jpg'`

#### Trường hợp 4: Đường dẫn tương đối không có /
- Input: `'uploads/avatar.jpg'`
- Output: `'http://localhost:8885/uploads/avatar.jpg'`

## Các file đã được cập nhật

1. `controller/api.js` - Thêm hàm helper chung
2. `controller/profile-controller.js` - Sử dụng hàm helper
3. `controller/chat-message.js` - Sử dụng hàm helper
4. `controller/profile.js` - Sử dụng hàm helper
5. `controller/profile-chat.js` - Sử dụng hàm helper
6. `controller/chat-list.js` - Sử dụng hàm helper
7. `index.html` - Cập nhật placeholder
8. `auth.html` - Cập nhật placeholder

## Lưu ý

- Avatar URL được lưu trong database dưới dạng đường dẫn tương đối
- Khi hiển thị, hệ thống tự động thêm base URL
- Khi lưu vào form, hệ thống tự động loại bỏ base URL
- Default avatar: `images/default_avatar.jpg` 