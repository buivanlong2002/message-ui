const ProfileController = {
    // Khởi tạo controller
    init: function() {
        // Kiểm tra authentication
        if (!this.checkAuthentication()) {
            return;
        }
        
        this.loadUserProfile();
        this.setupEventListeners();
    },

    // Kiểm tra authentication
    checkAuthentication: function() {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (!token || !userId) {
            console.log('Chưa đăng nhập, chuyển hướng đến trang đăng nhập');
            window.location.href = 'auth.html';
            return false;
        }
        
        return true;
    },

    // Load thông tin profile người dùng
    loadUserProfile: async function() {
        try {
            console.log('Đang tải thông tin profile...');
            const response = await ProfileService.getCurrentUserProfile();
            console.log('Response từ API:', response);
            
            if (response.status?.code === '00') {
                this.displayUserProfile(response.data);
            } else {
                console.error('Lỗi khi tải thông tin profile:', response.status?.displayMessage);
            }
        } catch (error) {
            console.error('Lỗi khi tải profile:', error.message);
        }
    },

    // Hiển thị thông tin profile
    displayUserProfile: function(userData) {
        const avatar = document.getElementById('avatar');
        const username = document.getElementById('username');
        
        if (avatar) {
            avatar.src = userData.avatarUrl || 'images/default_avatar.jpg';
            avatar.alt = userData.displayName || 'Avatar';
        }
        
        if (username) {
            username.textContent = userData.displayName || 'Người dùng';
        }

        // Cập nhật form chỉnh sửa
        const editAvatar = document.getElementById('edit-avatar');
        const editCover = document.getElementById('edit-cover');
        const editUsername = document.getElementById('edit-username');
        const editBio = document.getElementById('edit-bio');

        if (editAvatar) editAvatar.value = userData.avatarUrl || '';
        if (editCover) editCover.value = userData.coverUrl || '';
        if (editUsername) editUsername.value = userData.displayName || '';
        if (editBio) editBio.value = userData.bio || '';
    },

    // Load danh sách bạn bè
    loadFriends: async function() {
        const friendsList = document.querySelector('.friends-list');
        if (!friendsList) return;

        try {
            friendsList.innerHTML = '<div class="loading">Đang tải danh sách bạn bè...</div>';
            
            const response = await FriendshipService.getFriendships(localStorage.getItem('userId'));
            if (response.status?.code === '00') {
                this.displayFriends(response.data);
            } else {
                friendsList.innerHTML = `<div class="error-message">Lỗi: ${response.status?.displayMessage || 'Không thể tải danh sách bạn bè'}</div>`;
            }
        } catch (error) {
            console.error('Lỗi khi tải bạn bè:', error.message);
            friendsList.innerHTML = `<div class="error-message">Lỗi kết nối: ${error.message}</div>`;
        }
    },

    // Hiển thị danh sách bạn bè
    displayFriends: function(friends) {
        const friendsList = document.querySelector('.friends-list');
        if (!friendsList) return;

        friendsList.innerHTML = '';
        
        if (!friends || friends.length === 0) {
            friendsList.innerHTML = '<p class="no-data">Chưa có bạn bè nào</p>';
            return;
        }

        friends.forEach(friend => {
            const friendItem = this.createFriendItem(friend, 'friend');
            friendsList.appendChild(friendItem);
        });
    },

    // Load danh sách lời mời kết bạn
    loadFriendRequests: async function() {
        const requestsList = document.querySelector('.friend-requests-list');
        if (!requestsList) return;

        try {
            requestsList.innerHTML = '<div class="loading">Đang tải lời mời kết bạn...</div>';
            
            const response = await FriendshipService.getPendingRequests(localStorage.getItem('userId'));
            if (response.status?.code === '00') {
                this.displayFriendRequests(response.data);
            } else {
                requestsList.innerHTML = `<div class="error-message">Lỗi: ${response.status?.displayMessage || 'Không thể tải lời mời kết bạn'}</div>`;
            }
        } catch (error) {
            console.error('Lỗi khi tải lời mời kết bạn:', error.message);
            requestsList.innerHTML = `<div class="error-message">Lỗi kết nối: ${error.message}</div>`;
        }
    },

    // Hiển thị danh sách lời mời kết bạn
    displayFriendRequests: function(requests) {
        const requestsList = document.querySelector('.friend-requests-list');
        if (!requestsList) return;

        requestsList.innerHTML = '';
        
        if (!requests || requests.length === 0) {
            requestsList.innerHTML = '<p class="no-data">Không có lời mời kết bạn nào</p>';
            return;
        }

        requests.forEach(request => {
            const requestItem = this.createFriendItem(request, 'request');
            requestsList.appendChild(requestItem);
        });
    },

    // Load danh sách người dùng bị chặn
    loadBlockedUsers: async function() {
        const blockedList = document.querySelector('.blocked-users-list');
        if (!blockedList) return;

        try {
            blockedList.innerHTML = '<div class="loading">Đang tải danh sách chặn...</div>';
            
            const response = await ProfileService.getBlockedUsers();
            if (response.status?.code === '00') {
                this.displayBlockedUsers(response.data);
            } else {
                blockedList.innerHTML = `<div class="error-message">Lỗi: ${response.status?.displayMessage || 'Không thể tải danh sách chặn'}</div>`;
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách chặn:', error.message);
            blockedList.innerHTML = `<div class="error-message">Lỗi kết nối: ${error.message}</div>`;
        }
    },

    // Hiển thị danh sách người dùng bị chặn
    displayBlockedUsers: function(blockedUsers) {
        const blockedList = document.querySelector('.blocked-users-list');
        if (!blockedList) return;

        blockedList.innerHTML = '';
        
        if (!blockedUsers || blockedUsers.length === 0) {
            blockedList.innerHTML = '<p class="no-data">Không có người dùng nào bị chặn</p>';
            return;
        }

        blockedUsers.forEach(user => {
            const blockedItem = this.createFriendItem(user, 'blocked');
            blockedList.appendChild(blockedItem);
        });
    },

    // Tạo element cho friend/request/blocked user
    createFriendItem: function(user, type) {
        const item = document.createElement('div');
        item.className = 'friend-item';
        item.dataset.userId = user.id;

        const avatar = user.avatarUrl || 'images/default_avatar.jpg';
        const name = user.displayName || 'Người dùng';
        const status = user.status || 'Offline';

        item.innerHTML = `
            <img src="${avatar}" alt="Ảnh ${name}" class="friend-avatar"/>
            <div class="friend-info">
                <h3 class="friend-name">${name}</h3>
                ${type === 'friend' ? `<p class="friend-status">${status}</p>` : ''}
            </div>
            <div class="friend-actions">
                ${this.getActionButtons(type, user.id)}
            </div>
        `;

        // Thêm event listeners cho các nút
        this.addActionEventListeners(item, type, user.id);
        
        return item;
    },

    // Tạo các nút hành động tùy theo loại
    getActionButtons: function(type, userId) {
        switch(type) {
            case 'friend':
                return `
                    <button class="friend-btn primary" data-action="message" data-user-id="${userId}">
                        <i class="bi bi-chat-fill"></i> Nhắn tin
                    </button>
                    <button class="friend-btn" data-action="remove" data-user-id="${userId}">
                        <i class="bi bi-person-x-fill"></i> Xóa
                    </button>
                `;
            case 'request':
                return `
                    <button class="friend-btn primary" data-action="accept" data-user-id="${userId}">
                        <i class="bi bi-check-circle-fill"></i> Chấp nhận
                    </button>
                    <button class="friend-btn" data-action="decline" data-user-id="${userId}">
                        <i class="bi bi-x-circle-fill"></i> Từ chối
                    </button>
                `;
            case 'blocked':
                return `
                    <button class="friend-btn" data-action="unblock" data-user-id="${userId}">
                        <i class="bi bi-unlock-fill"></i> Bỏ chặn
                    </button>
                `;
            default:
                return '';
        }
    },

    // Thêm event listeners cho các nút hành động
    addActionEventListeners: function(item, type, userId) {
        const buttons = item.querySelectorAll('.friend-btn');
        buttons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const action = button.dataset.action;
                
                try {
                    await this.handleFriendAction(action, userId, type);
                } catch (error) {
                    console.error('Lỗi khi xử lý hành động:', error.message);
                    alert('Có lỗi xảy ra: ' + error.message);
                }
            });
        });
    },

    // Xử lý các hành động với bạn bè
    handleFriendAction: async function(action, targetUserId, type) {
        const currentUserId = localStorage.getItem('userId');
        
        switch(action) {
            case 'accept':
                await FriendshipService.acceptFriendRequest(targetUserId, currentUserId);
                this.showSuccessMessage('Đã chấp nhận lời mời kết bạn!');
                this.loadFriendRequests();
                break;
                
            case 'decline':
                await FriendshipService.rejectFriendRequest(targetUserId, currentUserId);
                this.showSuccessMessage('Đã từ chối lời mời kết bạn!');
                this.loadFriendRequests();
                break;
                
            case 'remove':
                if (confirm('Bạn có chắc muốn xóa người này khỏi danh sách bạn bè?')) {
                    // Cần thêm API xóa bạn bè
                    this.showSuccessMessage('Đã xóa khỏi danh sách bạn bè!');
                    this.loadFriends();
                }
                break;
                
            case 'unblock':
                await ProfileService.unblockUser(targetUserId);
                this.showSuccessMessage('Đã bỏ chặn người dùng!');
                this.loadBlockedUsers();
                break;
                
            case 'message':
                // Chuyển đến chat với người này
                this.startChatWithUser(targetUserId);
                break;
        }
    },

    // Bắt đầu chat với người dùng
    startChatWithUser: function(userId) {
        // Đóng menu overlay
        document.getElementById('menu-content-overlay').style.display = 'none';
        
        // Tìm conversation với user này hoặc tạo mới
        // Logic này sẽ được xử lý trong ConversationService
        console.log('Bắt đầu chat với user:', userId);
    },

    // Setup event listeners
    setupEventListeners: function() {
        // Event listener cho việc chuyển tab
        document.querySelectorAll('#sidebar-menu li').forEach(item => {
            item.addEventListener('click', (e) => {
                const sectionId = item.dataset.section;
                this.handleSectionChange(sectionId);
            });
        });

        // Event listener cho form cập nhật profile
        const editProfileForm = document.querySelector('#security-edit-info form');
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleUpdateProfile();
            });
        }

        // Event listener cho form đổi mật khẩu
        const changePasswordForm = document.querySelector('#security-change-password form');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleChangePassword();
            });
        }

        // Event listener cho tìm kiếm bạn bè
        const friendSearch = document.getElementById('friend-search');
        if (friendSearch) {
            friendSearch.addEventListener('input', (e) => {
                this.filterFriends(e.target.value);
            });
        }
    },

    // Xử lý khi chuyển section
    handleSectionChange: function(sectionId) {
        switch(sectionId) {
            case 'profile':
                this.loadUserProfile();
                break;
            case 'friends':
                this.loadFriends();
                break;
            case 'friend-requests':
                this.loadFriendRequests();
                break;
            case 'security':
                this.loadBlockedUsers();
                break;
        }
    },

    // Xử lý cập nhật profile
    handleUpdateProfile: async function() {
        const form = document.querySelector('#security-edit-info form');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        try {
            submitBtn.textContent = 'Đang cập nhật...';
            submitBtn.disabled = true;

            const formData = {
                displayName: document.getElementById('edit-username').value,
                avatarUrl: document.getElementById('edit-avatar').value,
                coverUrl: document.getElementById('edit-cover').value,
                bio: document.getElementById('edit-bio').value
            };

            const response = await ProfileService.updateProfile(formData);
            if (response.status?.code === '00') {
                this.showSuccessMessage('Cập nhật thông tin thành công!');
                this.loadUserProfile();
            } else {
                this.showErrorMessage('Lỗi khi cập nhật: ' + response.status?.displayMessage);
            }
        } catch (error) {
            this.showErrorMessage('Lỗi khi cập nhật profile: ' + error.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    },

    // Xử lý đổi mật khẩu
    handleChangePassword: async function() {
        const form = document.querySelector('#security-change-password form');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        try {
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                this.showErrorMessage('Mật khẩu mới không khớp!');
                return;
            }

            submitBtn.textContent = 'Đang đổi mật khẩu...';
            submitBtn.disabled = true;

            const response = await ProfileService.changePassword(currentPassword, newPassword);
            if (response.status?.code === '00') {
                this.showSuccessMessage('Đổi mật khẩu thành công!');
                // Reset form
                document.getElementById('current-password').value = '';
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
            } else {
                this.showErrorMessage('Lỗi khi đổi mật khẩu: ' + response.status?.displayMessage);
            }
        } catch (error) {
            this.showErrorMessage('Lỗi khi đổi mật khẩu: ' + error.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    },

    // Lọc bạn bè theo tên
    filterFriends: function(searchTerm) {
        const friendItems = document.querySelectorAll('.friends-list .friend-item');
        friendItems.forEach(item => {
            const name = item.querySelector('.friend-name').textContent.toLowerCase();
            const shouldShow = name.includes(searchTerm.toLowerCase());
            item.style.display = shouldShow ? 'flex' : 'none';
        });
    },

    // Hiển thị thông báo thành công
    showSuccessMessage: function(message) {
        const existingMessage = document.querySelector('.success-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.textContent = message;
        
        const activeSection = document.querySelector('.menu-section[style*="block"]');
        if (activeSection) {
            activeSection.insertBefore(messageDiv, activeSection.firstChild);
            
            setTimeout(() => {
                messageDiv.remove();
            }, 3000);
        }
    },

    // Hiển thị thông báo lỗi
    showErrorMessage: function(message) {
        const existingMessage = document.querySelector('.error-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = 'error-message';
        messageDiv.textContent = message;
        
        const activeSection = document.querySelector('.menu-section[style*="block"]');
        if (activeSection) {
            activeSection.insertBefore(messageDiv, activeSection.firstChild);
            
            setTimeout(() => {
                messageDiv.remove();
            }, 5000);
        }
    }
};

// Khởi tạo controller khi DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    ProfileController.init();
}); 