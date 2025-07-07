

function goToProfile(name ,isGroup, avatarUrl) {
    isGroup = (isGroup === true || isGroup === 'true');

    const profileContent = document.getElementById('profile-content');
    const profileTitle = document.getElementById('profile-title');
    const profileDetails = document.getElementById('profile-details');
    const chat = document.getElementById('chat-area');

    // Hiển thị khung
    profileContent.style.display = 'block';

    if (isGroup) {
        // === Giao diện nhóm (giống Zalo) ===
        profileTitle.innerText = "Thông tin nhóm";
        profileDetails.innerHTML = `
            <div class="profile-avatar-center">
                <img src="${getAvatarUrl(avatarUrl)}" class="avatar-lg" />
                <h4 class="group-name">${name}</h4>
                <div class="group-actions">
                    <button><i class="bi bi-bell"></i><br>Tắt thông báo</button>
                    <button><i class="bi bi-pin-angle"></i><br>Ghim hội thoại</button>
                    <button><i class="bi bi-person-plus"></i><br>Thêm thành viên</button>
                    <button><i class="bi bi-gear"></i><br>Quản lý nhóm</button>
                    <button onclick="changeGroupAvatar()"><i class="bi bi-camera"></i><br>Đổi ảnh nhóm</button>
                </div>
            </div>

            <div class="profile-section">
                <div class="section-header">Thành viên nhóm</div>
                <p>3 thành viên</p>
            </div>

            <div class="profile-section">
                <div class="section-header">Bảng tin nhóm</div>
                <ul class="group-board">
                    <li><i class="bi bi-clock-history"></i> Danh sách nhắc hẹn</li>
                    <li><i class="bi bi-journal-text"></i> Ghi chú, ghim, bình chọn</li>
                    <li onclick="createReminder()"><i class="bi bi-bell-fill"></i> Tạo nhắc nhở</li>
                    <li onclick="searchMessages()"><i class="bi bi-search"></i> Tìm tin nhắn</li>
                </ul>
            </div>

            <div class="profile-section">
                <div class="section-header">Ảnh/Video</div>
                <div class="media-grid">
                    <img src="https://via.placeholder.com/100" />
                    <img src="https://via.placeholder.com/100" />
                    <img src="https://via.placeholder.com/100" />
                    <img src="https://via.placeholder.com/100" />
                    <img src="https://via.placeholder.com/100" />
                    <img src="https://via.placeholder.com/100" />
                </div>
                <button class="view-all">Xem tất cả</button>
            </div>

            <div class="profile-section">
                <div class="section-header">Tùy chọn nhóm</div>
                <div class="group-actions">
                    <button onclick="leaveGroup()"><i class="bi bi-box-arrow-right"></i><br>Rời nhóm</button>
                    <button onclick="clearGroupMessages()"><i class="bi bi-trash"></i><br>Xóa tin nhắn nhóm</button>
                </div>
            </div>
        `;
    } else {
        // === Giao diện cá nhân (1-1) ===
        // profileTitle.innerText = "";
        profileDetails.innerHTML = `
            <div class="profile-avatar-center">
               <img src="${getAvatarUrl(avatarUrl)}" class="avatar-lg" />
                <h4 class="group-name">${name}</h4>
                <div class="group-actions">
                    <button><i class="bi bi-person-plus"></i><br>Thêm thành viên</button>
                    <button><i class="bi bi-bell"></i><br>Tắt thông báo</button>
                    <button onclick="viewProfileDetails()"><i class="bi bi-person-lines-fill"></i><br>Xem hồ sơ</button>
                </div>
            </div>
            <div class="profile-section">
                <div class="section-header">Bảng tin nhóm</div>
                <ul class="group-board">
                    <li><i class="bi bi-clock-history"></i> Danh sách nhắc hẹn</li>
                    <li><i class="bi bi-journal-text"></i> Ghi chú, ghim, bình chọn</li>
                    <li onclick="createReminder()"><i class="bi bi-bell-fill"></i> Tạo nhắc nhở</li>
                    <li onclick="searchMessages()"><i class="bi bi-search"></i> Tìm tin nhắn</li>
                </ul>
            </div>

            <div class="profile-section">
                <div class="section-header">Ảnh/Video</div>
                <div class="media-grid">
                    <img src="https://via.placeholder.com/100" />
                    <img src="https://via.placeholder.com/100" />
                    <img src="https://via.placeholder.com/100" />
                    <img src="https://via.placeholder.com/100" />
                    <img src="https://via.placeholder.com/100" />
                    <img src="https://via.placeholder.com/100" />
                </div>
                <button class="view-all">Xem tất cả</button>
            </div>
            <div class="profile-section">
                <div class="section-header">Tùy chọn</div>
                <div class="group-actions">
                    <button onclick="clearConversation()"><i class="bi bi-trash"></i><br>Xóa cuộc trò chuyện</button>
                    <button onclick="blockUser()"><i class="bi bi-person-x-fill"></i><br>Chặn người dùng</button>
                </div>
            </div>
        `;
    }

    // Responsive
    if (window.innerWidth <= 768) {
        profileContent.classList.add('active');
    } else {
        chat.classList.add('split');
    }
}



function leaveGroup() {
    // Placeholder: Xử lý logic rời nhóm
    alert("Đã nhấn Rời nhóm. Chức năng này cần được triển khai thêm!");
}

function clearGroupMessages() {
    // Placeholder: Xử lý logic xóa tin nhắn nhóm
    alert("Đã nhấn Xóa tin nhắn nhóm. Chức năng này cần được triển khai thêm!");
}

function clearConversation() {
    // Placeholder: Xử lý logic xóa cuộc trò chuyện cá nhân
    alert("Đã nhấn Xóa cuộc trò chuyện. Chức năng này cần được triển khai thêm!");
}

function changeGroupAvatar() {
    // Placeholder: Xử lý logic đổi ảnh nhóm
    alert("Đã nhấn Đổi ảnh nhóm. Chức năng này cần được triển khai thêm!");
}

function createReminder() {
    // Placeholder: Xử lý logic tạo nhắc nhở
    alert("Đã nhấn Tạo nhắc nhở. Chức năng này cần được triển khai thêm!");
}

function searchMessages() {
    // Placeholder: Xử lý logic tìm tin nhắn
    alert("Đã nhấn Tìm tin nhắn. Chức năng này cần được triển khai thêm!");
}

function viewProfileDetails() {
    // Placeholder: Xử lý logic xem hồ sơ chi tiết
    alert("Đã nhấn Xem hồ sơ. Chức năng này cần được triển khai thêm!");
}

function blockUser() {
    // Placeholder: Xử lý logic chặn người dùng
    alert("Đã nhấn Chặn người dùng. Chức năng này cần được triển khai thêm!");
}