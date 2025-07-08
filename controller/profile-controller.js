const ProfileController = {


    // Khởi tạo controller
    init: function () {
        console.log('Khởi tạo ProfileController...');
        this.checkAuthentication();
        this.loadUserProfile();
        this.setupEventListeners();
        this.initEventListeners();
    },

    // Khởi tạo event listeners
    initEventListeners: function () {
        // Form cập nhật profile
        const updateProfileForm = document.querySelector('#security-edit-info form');
        if (updateProfileForm) {
            updateProfileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleUpdateProfile();
            });
        }

        // Form đổi mật khẩu
        const changePasswordForm = document.querySelector('#security-change-password form');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleChangePassword();
            });
        }

        // Search friends
        const friendsSearch = document.getElementById('friends-search');
        if (friendsSearch) {
            friendsSearch.addEventListener('input', (e) => {
                this.filterFriends(e.target.value);
            });
        }

        // Search friend requests
        const requestsSearch = document.getElementById('friend-requests-search');
        if (requestsSearch) {
            requestsSearch.addEventListener('input', (e) => {
                this.filterFriendRequests(e.target.value);
            });
        }
        // Search user by email
        const searchEmailBtn = document.getElementById('search-email-btn');
        if (searchEmailBtn) {
            searchEmailBtn.addEventListener('click', async () => {
                const email = document.getElementById('search-email-input').value.trim();
                if (!email) return;
                try {
                    const result = await UserService.searchByEmail(email);
                    this.displaySearchEmailResult(result);
                } catch (err) {
                    this.showErrorMessage('Lỗi tìm kiếm: ' + err.message);
                }
            });
        }
    },

    // Kiểm tra authentication
    checkAuthentication: function () {
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
    loadUserProfile: async function () {
        try {
            console.log('Đang tải thông tin profile...');

            // Hiển thị loading state
            const username = document.getElementById('username');
            const avatar = document.getElementById('avatar');

            if (username) username.textContent = 'Đang tải...';
            if (avatar) avatar.src = 'images/default_avatar.jpg';

            const response = await ProfileService.getCurrentUserProfile();
            console.log('Response từ API:', response);

            if (response.status?.code === '00') {
                this.displayUserProfile(response.data);
            } else {
                console.error('Lỗi khi tải thông tin profile:', response.status?.displayMessage);
                if (username) username.textContent = 'Lỗi tải dữ liệu';
            }
        } catch (error) {
            console.error('Lỗi khi tải profile:', error.message);
            const username = document.getElementById('username');
            if (username) username.textContent = 'Lỗi kết nối';
        }
    },

    // Hiển thị thông tin profile
    displayUserProfile: function (userData) {
        const avatar = document.getElementById('avatar');
        const username = document.getElementById('username');
        const coverImg = document.querySelector('.cover-img');

        if (avatar) {
            avatar.src = getAvatarUrl(userData.avatarUrl);
            avatar.alt = userData.displayName || 'Avatar';
        }

        if (username) {
            username.textContent = userData.displayName || 'Người dùng';
        }

        // Cập nhật ảnh bìa nếu có
        if (coverImg && userData.coverUrl) {
            coverImg.src = getAvatarUrl(userData.coverUrl);
        }

        // Cập nhật form chỉnh sửa
        this.populateEditForm(userData);
    },

    // Load danh sách bạn bè
    loadFriends: async function () {
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
    displayFriends: function (friends) {
        const friendsList = document.querySelector('.friends-list');
        if (!friendsList) return;

        friendsList.innerHTML = '';

        // Lưu cache danh sách bạn bè
        ProfileController.friendsListCache = friends;
        localStorage.setItem('friendsList', JSON.stringify(friends));

        if (!friends || friends.length === 0) {
            friendsList.innerHTML = '<p class="no-data">Chưa có bạn bè nào</p>';
            return;
        }

        friends.forEach(friend => {
            const friendItem = this.createFriendItem(friend);
            friendsList.appendChild(friendItem);
        });
    },

    // Load danh sách lời mời kết bạn
    loadFriendRequests: async function () {
        const requestsList = document.querySelector('.friend-requests-list');
        if (!requestsList) return;

        try {
            requestsList.innerHTML = '<div class="loading">Đang tải lời mời kết bạn...</div>';

            const response = await FriendshipService.getPendingRequests(localStorage.getItem('userId'));
            if (response.status?.code === '00') {
                await this.displayFriendRequests(response.data);
            } else {
                requestsList.innerHTML = `<div class="error-message">Lỗi: ${response.status?.displayMessage || 'Không thể tải lời mời kết bạn'}</div>`;
            }
        } catch (error) {
            console.error('Lỗi khi tải lời mời kết bạn:', error.message);
            requestsList.innerHTML = `<div class="error-message">Lỗi kết nối: ${error.message}</div>`;
        }
    },

    // Hiển thị danh sách lời mời kết bạn
    displayFriendRequests: async function (requests) {
        const requestsList = document.querySelector('.friend-requests-list');
        if (!requestsList) return;

        requestsList.innerHTML = '';

        if (!requests || requests.length === 0) {
            requestsList.innerHTML = '<p class="no-data">Không có lời mời kết bạn nào</p>';
            return;
        }

        // Debug: Log cấu trúc dữ liệu để kiểm tra
        console.log('Friend requests data structure:', requests);

        // Xử lý từng request một cách tuần tự để đảm bảo async hoạt động đúng
        for (const request of requests) {
            const requestItem = await this.createFriendRequestItem(request);
            requestsList.appendChild(requestItem);
        }
    },

    // Load danh sách người dùng bị chặn
    loadBlockedUsers: async function () {
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
    displayBlockedUsers: function (blockedUsers) {
        const blockedList = document.querySelector('.blocked-users-list');
        if (!blockedList) return;

        blockedList.innerHTML = '';

        if (!blockedUsers || blockedUsers.length === 0) {
            blockedList.innerHTML = '<p class="no-data">Không có người dùng nào bị chặn</p>';
            return;
        }

        blockedUsers.forEach(user => {
            const blockedItem = this.createBlockedUserItem(user);
            blockedList.appendChild(blockedItem);
        });
    },

    // Tạo element cho friend/request/blocked user
    createFriendItem: function (user) {
        const item = document.createElement('div');
        item.className = 'friend-item';
        item.dataset.userId = user.id;

        // Nếu không có avatar thì dùng ảnh mặc định
        const avatarSrc = user.avatarUrl ? getAvatarUrl(user.avatarUrl) : 'images/default_avatar.jpg';

        item.innerHTML = `
            <img src="${avatarSrc}" alt="Ảnh ${user.displayName}" class="friend-avatar"/>
            <div class="friend-info">
                <h3 class="friend-name clickable-profile" data-user-id="${user.id}">${user.displayName}</h3>
                <p class="friend-status">${user.statusText || ''}</p>
            </div>
            <div class="friend-actions">
                <button class="friend-btn" data-action="message" data-user-id="${user.id}" data-user-name="${user.displayName}">
                    <i class="bi bi-chat-dots"></i> Nhắn tin
                </button>
                <button class="friend-btn" data-action="remove" data-user-id="${user.id}" data-user-name="${user.displayName}">
                    <i class="bi bi-person-x"></i> Xóa bạn
                </button>
            </div>
        `;
        this.addFriendEventListeners(item, user.id, user.displayName);
        // Thêm event click vào tên để mở profile
        const nameEl = item.querySelector('.friend-name.clickable-profile');
        if (nameEl) {
            nameEl.style.cursor = 'pointer';
            nameEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showUserProfile(user.id);
            });
        }
        return item;
    },

    // Tạo element cho friend chỉ có tên (từ API getFriendships)
    createFriendItemFromName: function (friendName, type) {
        const item = document.createElement('div');
        item.className = 'friend-item';
        item.dataset.friendName = friendName;

        item.innerHTML = `
            <img src="images/default_avatar.jpg" alt="Ảnh ${friendName}" class="friend-avatar"/>
            <div class="friend-info">
                <h3 class="friend-name">${friendName}</h3>
                ${type === 'friend' ? `<p class="friend-status">Online</p>` : ''}
            </div>
            <div class="friend-actions">
                ${this.getActionButtonsForName(type, friendName)}
            </div>
        `;

        // Thêm event listeners cho các nút
        this.addActionEventListenersForName(item, type, friendName);

        return item;
    },

    // Tạo element cho lời mời kết bạn (từ API getPendingRequests)
    createFriendRequestItem: async function (request) {
        const item = document.createElement('div');
        item.className = 'friend-item';
        item.dataset.userId = request.senderId;

        console.log('Processing request:', request);
        console.log('Request keys:', Object.keys(request));
        
        // Xử lý thông tin người gửi lời mời
        let senderName = '';
        let senderAvatar = 'images/default_avatar.jpg';
        
        // Kiểm tra tất cả các trường hợp có thể có thông tin sender
        if (request.sender) {
            // Trường hợp 1: Có object sender
            console.log('Found sender object:', request.sender);
            console.log('Sender avatar fields:', {
                avatarUrl: request.sender.avatarUrl,
                avatar: request.sender.avatar,
                imageUrl: request.sender.imageUrl,
                image: request.sender.image,
                profileImage: request.sender.profileImage
            });
            senderName = request.sender.displayName || request.sender.name || request.sender.username || 'Người dùng';
            senderAvatar = request.sender.avatarUrl || request.sender.avatar || request.sender.imageUrl || request.sender.image || request.sender.profileImage;
            senderAvatar = senderAvatar ? getAvatarUrl(senderAvatar) : 'images/default_avatar.jpg';
        } else if (request.senderInfo) {
            // Trường hợp 2: Có object senderInfo
            console.log('Found senderInfo object:', request.senderInfo);
            console.log('SenderInfo avatar fields:', {
                avatarUrl: request.senderInfo.avatarUrl,
                avatar: request.senderInfo.avatar,
                imageUrl: request.senderInfo.imageUrl,
                image: request.senderInfo.image,
                profileImage: request.senderInfo.profileImage
            });
            senderName = request.senderInfo.displayName || request.senderInfo.name || request.senderInfo.username || 'Người dùng';
            senderAvatar = request.senderInfo.avatarUrl || request.senderInfo.avatar || request.senderInfo.imageUrl || request.senderInfo.image || request.senderInfo.profileImage;
            senderAvatar = senderAvatar ? getAvatarUrl(senderAvatar) : 'images/default_avatar.jpg';
        } else if (request.user) {
            // Trường hợp 3: Có object user
            console.log('Found user object:', request.user);
            console.log('User avatar fields:', {
                avatarUrl: request.user.avatarUrl,
                avatar: request.user.avatar,
                imageUrl: request.user.imageUrl,
                image: request.user.image,
                profileImage: request.user.profileImage
            });
            senderName = request.user.displayName || request.user.name || request.user.username || 'Người dùng';
            senderAvatar = request.user.avatarUrl || request.user.avatar || request.user.imageUrl || request.user.image || request.user.profileImage;
            senderAvatar = senderAvatar ? getAvatarUrl(senderAvatar) : 'images/default_avatar.jpg';
        } else {
            // Trường hợp 4: Thông tin sender được trả về trực tiếp
            console.log('Using direct sender info');
            console.log('Direct avatar fields:', {
                avatarUrl: request.avatarUrl,
                avatar: request.avatar,
                imageUrl: request.imageUrl,
                image: request.image,
                profileImage: request.profileImage
            });
            senderName = request.displayName || request.senderName || request.name || request.username || request.senderDisplayName || 'Người dùng';
            senderAvatar = request.avatarUrl || request.avatar || request.imageUrl || request.image || request.profileImage;
            senderAvatar = senderAvatar ? getAvatarUrl(senderAvatar) : 'images/default_avatar.jpg';
        }
        
        console.log('Final sender info:', { senderName, senderAvatar });

        // Nếu không tìm thấy tên người gửi hoặc avatar, thử lấy từ API
        if ((senderName === 'Người dùng' || senderAvatar === 'images/default_avatar.jpg') && request.senderId) {
            console.log('Trying to get user info from API for senderId:', request.senderId);
            try {
                const userInfo = await this.getUserInfo(request.senderId);
                if (userInfo) {
                    console.log('User info from API:', userInfo);
                    senderName = userInfo.displayName || userInfo.name || userInfo.username || senderName;
                    const apiAvatar = userInfo.avatarUrl || userInfo.avatar || userInfo.imageUrl || userInfo.image || userInfo.profileImage;
                    senderAvatar = apiAvatar ? getAvatarUrl(apiAvatar) : senderAvatar;
                    console.log('Updated sender info from API:', { senderName, senderAvatar });
                }
            } catch (error) {
                console.warn('Không thể lấy thông tin người dùng từ API:', error.message);
            }
        }

        const currentUserId = localStorage.getItem('userId');

        item.innerHTML = `
            <img src="${senderAvatar}" alt="Ảnh ${senderName}" class="friend-avatar"/>
            <div class="friend-info">
                <h3 class="friend-name">${senderName}</h3>
                <p class="friend-status">Đã gửi lúc ${request.requestedAt ? new Date(request.requestedAt).toLocaleString() : ''}</p>
            </div>
            <div class="friend-actions">
                <button class="friend-btn" data-action="message" data-sender-id="${request.senderId}" data-receiver-id="${currentUserId}" data-user-name="${senderName}">
                    <i class="bi bi-chat-dots"></i> Nhắn tin
                </button>
                <button class="friend-btn" data-action="accept" data-sender-id="${request.senderId}" data-receiver-id="${currentUserId}" data-user-name="${senderName}">
                    <i class="bi bi-person-check"></i> Chấp nhận
                </button>
                <button class="friend-btn" data-action="reject" data-sender-id="${request.senderId}" data-receiver-id="${currentUserId}" data-user-name="${senderName}">
                    <i class="bi bi-person-x"></i> Từ chối
                </button>
            </div>
        `;
        this.addFriendRequestEventListeners(item);
        return item;
    },

    // Tạo các nút hành động tùy theo loại
    getActionButtons: function (type, userId) {
        switch (type) {
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

    // Tạo các nút hành động cho friend chỉ có tên
    getActionButtonsForName: function (type, friendName) {
        switch (type) {
            case 'friend':
                return `
                    <button class="friend-btn primary" data-action="message" data-friend-name="${friendName}">
                        <i class="bi bi-chat-fill"></i> Nhắn tin
                    </button>
                    <button class="friend-btn" data-action="remove" data-friend-name="${friendName}">
                        <i class="bi bi-person-x-fill"></i> Xóa
                    </button>
                `;
            default:
                return '';
        }
    },

    // Thêm event listeners cho các nút hành động
    addActionEventListeners: function (item, type, userId) {
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

    // Thêm event listeners cho các nút hành động (cho friend chỉ có tên)
    addActionEventListenersForName: function (item, type, friendName) {
        const buttons = item.querySelectorAll('.friend-btn');
        buttons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const action = button.dataset.action;

                try {
                    await this.handleFriendActionForName(action, friendName, type);
                } catch (error) {
                    console.error('Lỗi khi xử lý hành động:', error.message);
                    alert('Có lỗi xảy ra: ' + error.message);
                }
            });
        });
    },

    // Thêm event listeners cho friend request
    addFriendRequestEventListeners: function (item) {
        const buttons = item.querySelectorAll('.friend-btn');
        buttons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const action = button.dataset.action;
                const senderId = button.dataset.senderId;
                const receiverId = button.dataset.receiverId;
                const userName = button.dataset.userName;
                try {
                    await this.handleFriendRequestAction(action, senderId, receiverId, userName);
                } catch (error) {
                    console.error('Lỗi khi xử lý hành động:', error.message);
                    alert('Có lỗi xảy ra: ' + error.message);
                }
            });
        });
    },

    // Xử lý các hành động với bạn bè
    handleFriendAction: async function (action, targetUserId, type) {
        const currentUserId = localStorage.getItem('userId');

        switch (action) {
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
                    try {
                        await FriendshipService.removeFriend(currentUserId, targetUserId);
                        this.showSuccessMessage('Đã xóa khỏi danh sách bạn bè!');
                        this.loadFriends();
                    } catch (error) {
                        this.showErrorMessage(`Lỗi khi xóa bạn bè: ${error.message}`);
                    }
                }
                break;

            case 'unblock':
                await ProfileService.unblockUser(targetUserId);
                this.showSuccessMessage('Đã bỏ chặn người dùng!');
                this.loadBlockedUsers();
                break;

            case 'message':
                // Chuyển đến chat với người này
                // Thử lấy thông tin người dùng từ API trước khi mở chat
                try {
                    const userInfo = await this.getUserInfo(targetUserId);
                    this.startChatWithUser(targetUserId, userInfo);
                } catch (error) {
                    console.warn('Không thể lấy thông tin người dùng, mở chat với thông tin cơ bản');
                    this.startChatWithUser(targetUserId);
                }
                break;
        }
    },

    // Xử lý các hành động với bạn bè (cho friend chỉ có tên)
    handleFriendActionForName: async function (action, friendName, type) {
        switch (action) {
            case 'remove':
                if (confirm(`Bạn có chắc muốn xóa ${friendName} khỏi danh sách bạn bè?`)) {
                    // TODO: Cần thêm API xóa bạn bè theo tên
                    this.showSuccessMessage(`Đã xóa ${friendName} khỏi danh sách bạn bè!`);
                    this.loadFriends();
                }
                break;

            case 'message':
                // Chuyển đến chat với người này
                this.startChatWithFriend(friendName);
                break;
        }
    },

    // Xử lý các hành động với friend request
    handleFriendRequestAction: async function (action, senderId, receiverId, userName) {
        switch (action) {
            case 'accept':
                try {
                    await FriendshipService.acceptFriendRequest(senderId, receiverId);
                    this.showSuccessMessage(`Đã chấp nhận lời mời kết bạn từ ${userName}!`);
                    this.loadFriendRequests();
                    this.loadFriends(); // cập nhật danh sách bạn bè
                } catch (error) {
                    this.showErrorMessage(`Lỗi khi chấp nhận lời mời: ${error.message}`);
                }
                break;
            case 'reject':
                try {
                    await FriendshipService.rejectFriendRequest(senderId, receiverId);
                    this.showSuccessMessage(`Đã từ chối lời mời kết bạn từ ${userName}!`);
                    this.loadFriendRequests();
                } catch (error) {
                    this.showErrorMessage(`Lỗi khi từ chối lời mời: ${error.message}`);
                }
                break;
            case 'message':
                // Chuyển đến chat với người này
                // Thử lấy thông tin người dùng từ API trước khi mở chat
                try {
                    const userInfo = await this.getUserInfo(senderId);
                    this.startChatWithUser(senderId, userInfo);
                } catch (error) {
                    console.warn('Không thể lấy thông tin người dùng, mở chat với thông tin cơ bản');
                    this.startChatWithUser(senderId);
                }
                break;
        }
    },

    // Format thời gian
    formatTimeAgo: function (date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;

        return date.toLocaleDateString('vi-VN');
    },

    // Bắt đầu chat với người dùng
    startChatWithUser: async function(userId, userInfo = null) {
        document.getElementById('menu-content-overlay').style.display = 'none';

        const token = localStorage.getItem('token');
        const currentUserId = localStorage.getItem('userId');
        if (!token || !currentUserId) return;

        try {
            // Gọi API tạo hoặc lấy conversation — trả về object chứ không bọc trong data
            const convResponse = await ConversationService.getOrCreateOneToOneConversation(currentUserId, userId, token);
            console.log("Conversation creation response:", convResponse);

            const convId = convResponse?.id;
            if (!convId) {
                alert('Không thể tạo hoặc lấy đoạn chat!');
                return;
            }

            // Lấy danh sách conversation của người dùng
            const allConvs = await ConversationService.getConversationsByUser(currentUserId, token);
            let conversation = null;

            if (allConvs && allConvs.data && Array.isArray(allConvs.data)) {
                conversation = allConvs.data.find(conv => conv.id === convId);
            }

            if (!conversation) {
                alert('Không thể tìm thấy đoạn chat sau khi tạo!');
                return;
            }

            const isGroup = conversation.isGroup || false;

            // Tìm bạn bè đối diện - ưu tiên thông tin từ userInfo nếu có
            let friendName = '';
            let friendAvatar = 'images/default_avatar.jpg';

            // Nếu có thông tin người dùng từ tìm kiếm, sử dụng thông tin đó
            if (userInfo) {
                friendName = userInfo.displayName || '';
                friendAvatar = userInfo.avatarUrl ? getAvatarUrl(userInfo.avatarUrl) : 'images/default_avatar.jpg';
            } else {
                // Tìm từ conversation members
                if (conversation.members && Array.isArray(conversation.members)) {
                    const friend = conversation.members.find(m => m.id !== currentUserId);
                    if (friend) {
                        friendName = friend.displayName || '';
                        friendAvatar = friend.avatarUrl ? getAvatarUrl(friend.avatarUrl) : friendAvatar;
                    }
                }
                
                // Nếu vẫn không có thông tin, thử lấy từ API
                if (!friendName || friendName === '') {
                    try {
                        const userInfoFromAPI = await this.getUserInfo(userId);
                        if (userInfoFromAPI) {
                            friendName = userInfoFromAPI.displayName || userInfoFromAPI.name || userInfoFromAPI.username || 'Người dùng';
                            const apiAvatar = userInfoFromAPI.avatarUrl || userInfoFromAPI.avatar || userInfoFromAPI.imageUrl || userInfoFromAPI.image || userInfoFromAPI.profileImage;
                            friendAvatar = apiAvatar ? getAvatarUrl(apiAvatar) : friendAvatar;
                        }
                    } catch (error) {
                        console.warn('Không thể lấy thông tin người dùng từ API:', error.message);
                    }
                }
            }

            if (!friendName) friendName = conversation.name || 'Người dùng';
            if (!friendAvatar || friendAvatar === 'images/default_avatar.jpg') {
                friendAvatar = conversation.avatarUrl ? getAvatarUrl(conversation.avatarUrl) : 'images/default_avatar.jpg';
            }

            // Tìm chat-item nếu đã hiển thị sidebar
            let foundItem = null;
            const chatItems = document.querySelectorAll('.chat-item');
            chatItems.forEach(item => {
                if (item.dataset.chatId === convId) {
                    foundItem = item;
                }
            });

            // Load đoạn chat
            loadChat(convId, foundItem, friendName, friendAvatar, isGroup);

            // Highlight chat item trong sidebar
            this.highlightChatItem(convId);

        } catch (err) {
            alert('Có lỗi khi mở đoạn chat: ' + (err?.message || 'Không xác định'));
        }
    },

    // Highlight chat item trong sidebar
    highlightChatItem: function(convId) {
        // Nếu chưa tìm thấy chat-item, gọi lại chat list và lặp lại highlight
        let foundItem = document.querySelector(`.chat-item[data-chat-id="${convId}"]`);
        
        if (!foundItem) {
            if (typeof loadChatList === 'function') {
                loadChatList();
            }
            
            let tryCount = 0;
            const tryHighlightChatItem = () => {
                const chatItem = document.querySelector(`.chat-item[data-chat-id="${convId}"]`);
                if (chatItem) {
                    // Remove active class from all chat items
                    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
                    // Add active class to current chat item
                    chatItem.classList.add('active');
                    
                    // Scroll to the chat item if needed
                    chatItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else if (tryCount < 15) { // Tăng số lần thử
                    tryCount++;
                    setTimeout(tryHighlightChatItem, 100);
                }
            };
            setTimeout(tryHighlightChatItem, 200);
        } else {
            // Nếu đã tìm thấy, highlight ngay lập tức
            document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
            foundItem.classList.add('active');
            foundItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
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

        // Event listener cho tìm kiếm lời mời kết bạn
        const friendRequestSearch = document.getElementById('friend-request-search');
        if (friendRequestSearch) {
            friendRequestSearch.addEventListener('input', (e) => {
                this.filterFriendRequests(e.target.value);
            });
        }
    },

    // Xử lý thay đổi section
    handleSectionChange: function(sectionId) {
        console.log('Chuyển sang section:', sectionId);
        
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
                // Khi vào section bảo mật, load tab đầu tiên
                this.loadEditFormData();
                break;
            case 'search-user':
                this.showSearchUserSection();
                break;
        }
    },

    // Load dữ liệu cho form chỉnh sửa khi vào tab bảo mật
    loadEditFormData: async function() {
        try {
            const userData = await ProfileService.getCurrentUserProfile();
            if (userData.status?.code === '00') {
                this.populateEditForm(userData.data);
            } else {
                this.showErrorMessage('Lỗi khi tải thông tin: ' + userData.status?.displayMessage);
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu form:', error.message);
            this.showErrorMessage('Lỗi kết nối: ' + error.message);
        }
    },

    // Xử lý navigation trong security section
    handleSecurityNavigation: function(targetId) {
        console.log('Chuyển sang tab bảo mật:', targetId);
        
        switch(targetId) {
            case 'security-edit-info':
                this.loadEditFormData();
                break;
            case 'security-change-password':
                // Reset form đổi mật khẩu
                document.getElementById('current-password').value = '';
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
                break;
            case 'security-blocked-users':
                this.loadBlockedUsers();
                break;
        }
    },

    // Điền dữ liệu vào form chỉnh sửa
    populateEditForm: function(userData) {
        const editAvatar = document.getElementById('edit-avatar');
        const editCover = document.getElementById('edit-cover');
        const editUsername = document.getElementById('edit-username');
        const editBio = document.getElementById('edit-bio');

        // Xử lý avatar URL để chỉ lưu đường dẫn tương đối
        let avatarUrl = userData.avatarUrl || '';
        if (avatarUrl && avatarUrl.startsWith('http://localhost:8885/')) {
            avatarUrl = avatarUrl.replace('http://localhost:8885/', '');
        } else if (avatarUrl && avatarUrl.startsWith('http://localhost:8885')) {
            avatarUrl = avatarUrl.replace('http://localhost:8885', '');
        }

        // Xử lý cover URL để chỉ lưu đường dẫn tương đối
        let coverUrl = userData.coverUrl || '';
        if (coverUrl && coverUrl.startsWith('http://localhost:8885/')) {
            coverUrl = coverUrl.replace('http://localhost:8885/', '');
        } else if (coverUrl && coverUrl.startsWith('http://localhost:8885')) {
            coverUrl = coverUrl.replace('http://localhost:8885', '');
        }

        if (editAvatar) editAvatar.value = avatarUrl;
        if (editCover) editCover.value = coverUrl;
        if (editUsername) editUsername.value = userData.displayName || '';
        if (editBio) editBio.value = userData.bio || '';
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

            console.log('Gửi dữ liệu cập nhật:', formData);
            const response = await ProfileService.updateProfile(formData);
            console.log('Response cập nhật:', response);
            
            if (response.status?.code === '00') {
                this.showSuccessMessage('Cập nhật thông tin thành công!');
                this.loadUserProfile();
            } else {
                this.showErrorMessage('Lỗi khi cập nhật: ' + response.status?.displayMessage);
            }
        } catch (error) {
            console.error('Lỗi cập nhật profile:', error);
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

            if (!currentPassword || !newPassword || !confirmPassword) {
                this.showErrorMessage('Vui lòng điền đầy đủ thông tin!');
                return;
            }

            if (newPassword !== confirmPassword) {
                this.showErrorMessage('Mật khẩu mới không khớp!');
                return;
            }

            if (newPassword.length < 6) {
                this.showErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự!');
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

    // Lọc lời mời kết bạn theo tên
    filterFriendRequests: function(searchTerm) {
        const requestItems = document.querySelectorAll('.friend-requests-list .friend-item');
        requestItems.forEach(item => {
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
    },

    // Tạo element cho người dùng bị chặn
    createBlockedUserItem: function(user) {
        const item = document.createElement('div');
        item.className = 'friend-item';
        item.dataset.userId = user.id;

        item.innerHTML = `
            <img src="${getAvatarUrl(user.avatarUrl)}" alt="Ảnh ${user.displayName}" class="friend-avatar"/>
            <div class="friend-info">
                <h3 class="friend-name">${user.displayName}</h3>
                <p class="friend-status">Đã bị chặn</p>
            </div>
            <div class="friend-actions">
                <button class="friend-btn" data-action="unblock" data-user-id="${user.id}" data-user-name="${user.displayName}">
                    <i class="bi bi-unlock-fill"></i> Bỏ chặn
                </button>
            </div>
        `;

        // Thêm event listeners cho các nút
        this.addBlockedUserEventListeners(item, user.id, user.displayName);
        
        return item;
    },

    // Thêm event listeners cho người dùng bị chặn
    addBlockedUserEventListeners: function(item, userId, userName) {
        const buttons = item.querySelectorAll('.friend-btn');
        buttons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const action = button.dataset.action;
                
                try {
                    await this.handleBlockedUserAction(action, userId, userName);
                } catch (error) {
                    console.error('Lỗi khi xử lý hành động:', error.message);
                    alert('Có lỗi xảy ra: ' + error.message);
                }
            });
        });
    },

    // Xử lý các hành động với người dùng bị chặn
    handleBlockedUserAction: async function(action, userId, userName) {
        switch(action) {
            case 'unblock':
                if (confirm(`Bạn có chắc muốn bỏ chặn ${userName}?`)) {
                    try {
                        await ProfileService.unblockUser(userId);
                        this.showSuccessMessage(`Đã bỏ chặn ${userName}!`);
                        this.loadBlockedUsers();
                    } catch (error) {
                        this.showErrorMessage(`Lỗi khi bỏ chặn: ${error.message}`);
                    }
                }
                break;
        }
    },

    // Thêm event listeners cho bạn bè
    addFriendEventListeners: function(item, userId, userName) {
        const buttons = item.querySelectorAll('.friend-btn');
        buttons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const action = button.dataset.action;
                try {
                    await this.handleFriendAction(action, userId);
                } catch (error) {
                    console.error('Lỗi khi xử lý hành động:', error.message);
                    alert('Có lỗi xảy ra: ' + error.message);
                }
            });
        });
    },

    // Hàm mở trang cá nhân của người khác
    showUserProfile: function(userId) {
        // Đóng menu overlay nếu đang mở
        document.getElementById('menu-content-overlay').style.display = 'none';
        // Gọi hàm load profile của userId này (giả sử đã có hàm loadUserProfileById)
        if (typeof this.loadUserProfileById === 'function') {
            this.loadUserProfileById(userId);
        } else {
            alert('Chức năng xem trang cá nhân đang được phát triển!');
        }
    },

    showSearchUserSection: function() {
        // Ẩn tất cả các section khác
        document.querySelectorAll('.menu-section').forEach(sec => sec.style.display = 'none');
        // Hiện section tìm kiếm
        const searchSection = document.getElementById('search-user-section');
        if (searchSection) searchSection.style.display = 'block';

        // Nếu chưa có cache bạn bè, tự động load
        if (!ProfileController.friendsListCache || !Array.isArray(ProfileController.friendsListCache) || ProfileController.friendsListCache.length === 0) {
            ProfileController.loadFriends();
        }
    },

    // Refresh danh sách bạn bè cache
    refreshFriendsListCache: async function() {
        try {
            const response = await FriendshipService.getFriendships(localStorage.getItem('userId'));
            if (response.status?.code === '00') {
                ProfileController.friendsListCache = response.data || [];
                localStorage.setItem('friendsList', JSON.stringify(response.data || []));
            } else {
                console.warn('Không thể refresh danh sách bạn bè:', response.status?.displayMessage);
            }
        } catch (error) {
            console.warn('Lỗi khi refresh danh sách bạn bè:', error.message);
        }
    },

    // Lấy thông tin người dùng từ API nếu cần
    getUserInfo: async function(userId) {
        try {
            const response = await UserService.getByUserId(userId);
            if (response.status?.code === '00') {
                return response.data;
            } else {
                console.warn('Không thể lấy thông tin người dùng:', response.status?.displayMessage);
                return null;
            }
        } catch (error) {
            console.warn('Lỗi khi lấy thông tin người dùng:', error.message);
            return null;
        }
    },

    displaySearchEmailResult: async function(users) {
        const resultDiv = document.getElementById('search-email-result');
        resultDiv.innerHTML = '';
        if (!users || users.length === 0) {
            resultDiv.innerHTML = '<p>Không tìm thấy người dùng nào.</p>';
            return;
        }
        
        // Refresh danh sách bạn bè cache nếu cần
        await this.refreshFriendsListCache();
        
        // Lấy danh sách bạn bè hiện tại từ cache
        let currentFriends = ProfileController.friendsListCache || [];
        const currentUserId = localStorage.getItem('userId');
        // Lấy danh sách lời mời đã gửi từ backend
        let sentRequests = [];
        try {
            const sentRes = await FriendshipService.getSentRequests(currentUserId);
            if (sentRes && sentRes.status && sentRes.status.code === '00') {
                sentRequests = sentRes.data || [];
            } else {
                console.warn('API trả về lỗi khi lấy danh sách lời mời đã gửi:', sentRes?.status?.displayMessage);
            }
        } catch (err) {
            console.warn('Không lấy được danh sách lời mời đã gửi:', err.message);
            // Không làm crash ứng dụng, chỉ log warning và tiếp tục với sentRequests = []
        }

        // Lấy danh sách lời mời đã nhận từ backend
        let receivedRequests = [];
        try {
            const receivedRes = await FriendshipService.getPendingRequests(currentUserId);
            if (receivedRes && receivedRes.status && receivedRes.status.code === '00') {
                receivedRequests = receivedRes.data || [];
            } else {
                console.warn('API trả về lỗi khi lấy danh sách lời mời đã nhận:', receivedRes?.status?.displayMessage);
            }
        } catch (err) {
            console.warn('Không lấy được danh sách lời mời đã nhận:', err.message);
            // Không làm crash ứng dụng, chỉ log warning và tiếp tục với receivedRequests = []
        }

        // Lấy danh sách người dùng bị chặn
        let blockedUsers = [];
        try {
            const blockedRes = await ProfileService.getBlockedUsers();
            if (blockedRes && blockedRes.status && blockedRes.status.code === '00') {
                blockedUsers = blockedRes.data || [];
            } else {
                console.warn('API trả về lỗi khi lấy danh sách người dùng bị chặn:', blockedRes?.status?.displayMessage);
            }
        } catch (err) {
            console.warn('Không lấy được danh sách người dùng bị chặn:', err.message);
        }

        // Lấy danh sách người đã chặn mình
        let blockedByUsers = [];
        try {
            const blockedByRes = await ProfileService.getBlockedByUsers();
            if (blockedByRes && blockedByRes.status && blockedByRes.status.code === '00') {
                blockedByUsers = blockedByRes.data || [];
            } else {
                console.warn('API trả về lỗi khi lấy danh sách người đã chặn mình:', blockedByRes?.status?.displayMessage);
            }
        } catch (err) {
            console.warn('Không lấy được danh sách người đã chặn mình:', err.message);
        }
        users.forEach(user => {
            const isFriend = currentFriends.some(f => String(f.id) === String(user.id));
            
            // Kiểm tra xem đã gửi lời mời kết bạn cho user này chưa
            const isSentRequest = sentRequests.some(r => {
                // Có thể API trả về receiverId hoặc receiver.id
                const receiverId = r.receiverId || r.receiver?.id;
                return String(receiverId) === String(user.id);
            });
            
            // Kiểm tra xem user này đã gửi lời mời kết bạn cho mình chưa
            const isReceivedRequest = receivedRequests.some(r => {
                // Có thể API trả về senderId hoặc sender.id
                const senderId = r.senderId || r.sender?.id;
                return String(senderId) === String(user.id);
            });

            // Kiểm tra trạng thái chặn
            const isBlockedByMe = blockedUsers.some(b => String(b.id) === String(user.id));
            const isBlockedByUser = blockedByUsers.some(b => String(b.id) === String(user.id));
            const item = document.createElement('div');
            item.className = 'search-user-item';
            item.innerHTML = `
                <img src="${getAvatarUrl(user.avatarUrl)}" alt="Avatar" class="friend-avatar"/>
                <span class="user-name-clickable" data-user-id="${user.id}" data-user-name="${user.displayName}">${user.displayName} (${user.email})</span>
                <div class="friend-actions">
                    ${isBlockedByUser ? `
                        <span class="blocked-notice">Bạn đã bị chặn</span>
                    ` : isBlockedByMe ? `
                        <button class="friend-btn" data-action="unblock" data-user-id="${user.id}" data-user-name="${user.displayName}"><i class="bi bi-person-check"></i> Bỏ chặn</button>
                    ` : isFriend ? `
                        <button class="friend-btn" data-action="message" data-user-id="${user.id}" data-user-name="${user.displayName}"><i class="bi bi-chat-dots"></i> Nhắn tin</button>
                        <button class="friend-btn" data-action="remove" data-user-id="${user.id}" data-user-name="${user.displayName}"><i class="bi bi-person-x"></i> Xóa bạn</button>
                    ` : isReceivedRequest ? `
                        <button class="friend-btn" data-action="accept" data-user-id="${user.id}" data-user-name="${user.displayName}"><i class="bi bi-check-circle"></i> Chấp nhận</button>
                        <button class="friend-btn" data-action="reject" data-user-id="${user.id}" data-user-name="${user.displayName}"><i class="bi bi-x-circle"></i> Từ chối</button>
                    ` : isSentRequest ? `
                        <button class="friend-btn" data-action="cancel-request" data-user-id="${user.id}" data-user-name="${user.displayName}">Hủy lời mời</button>
                    ` : `
                        <button class="friend-btn" data-action="add" data-user-id="${user.id}" data-user-name="${user.displayName}">Kết bạn</button>
                    `}
                </div>
            `;
            // Gắn event cho các nút
            const actions = item.querySelectorAll('.friend-btn');
            actions.forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    
                    try {
                        if (action === 'message') {
                            ProfileController.startChatWithUser(user.id, user);
                        } else if (action === 'remove') {
                            if (confirm(`Bạn có chắc muốn xóa ${user.displayName} khỏi danh sách bạn bè?`)) {
                                await FriendshipService.removeFriend(currentUserId, user.id);
                                ProfileController.showSuccessMessage('Đã xóa khỏi danh sách bạn bè!');
                                // Refresh lại danh sách để cập nhật trạng thái
                                await ProfileController.refreshFriendsListCache();
                                ProfileController.displaySearchEmailResult(users);
                            }
                        } else if (action === 'add') {
                            await FriendshipService.sendFriendRequest(currentUserId, user.id);
                            ProfileController.showSuccessMessage(`Đã gửi lời mời kết bạn tới ${user.displayName}!`);
                            // Refresh lại danh sách để cập nhật trạng thái
                            await ProfileController.refreshFriendsListCache();
                            ProfileController.displaySearchEmailResult(users);
                        } else if (action === 'cancel-request') {
                            await FriendshipService.cancelFriendRequest(currentUserId, user.id);
                            ProfileController.showSuccessMessage(`Đã hủy lời mời kết bạn tới ${user.displayName}!`);
                            // Refresh lại danh sách để cập nhật trạng thái
                            ProfileController.displaySearchEmailResult(users);
                        } else if (action === 'accept') {
                            await FriendshipService.acceptFriendRequest(user.id, currentUserId);
                            ProfileController.showSuccessMessage(`Đã chấp nhận lời mời kết bạn từ ${user.displayName}!`);
                            // Refresh lại danh sách để cập nhật trạng thái
                            await ProfileController.refreshFriendsListCache();
                            ProfileController.displaySearchEmailResult(users);
                        } else if (action === 'reject') {
                            await FriendshipService.rejectFriendRequest(user.id, currentUserId);
                            ProfileController.showSuccessMessage(`Đã từ chối lời mời kết bạn từ ${user.displayName}!`);
                            // Refresh lại danh sách để cập nhật trạng thái
                            ProfileController.displaySearchEmailResult(users);
                        } else if (action === 'unblock') {
                            if (confirm(`Bạn có chắc muốn bỏ chặn ${user.displayName}?`)) {
                                await ProfileService.unblockUser(user.id);
                                ProfileController.showSuccessMessage(`Đã bỏ chặn ${user.displayName}!`);
                                // Refresh lại danh sách để cập nhật trạng thái
                                ProfileController.displaySearchEmailResult(users);
                            }
                        }
                    } catch (error) {
                        console.error('Lỗi khi xử lý hành động:', error);
                        ProfileController.showErrorMessage(`Lỗi: ${error.message}`);
                    }
                });
            });

            // Thêm event listener cho việc click vào tên người dùng
            const userNameElement = item.querySelector('.user-name-clickable');
            if (userNameElement) {
                userNameElement.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const userId = userNameElement.dataset.userId;
                    const userName = userNameElement.dataset.userName;
                    
                    try {
                        // Lấy thông tin chi tiết của người dùng
                        const userInfo = await ProfileController.getUserInfo(userId);
                        if (userInfo) {
                            // Hiển thị thông tin cơ bản trong alert
                            alert(`Thông tin người dùng:\nTên: ${userInfo.displayName}\nEmail: ${userInfo.email}${userInfo.phoneNumber ? '\nSĐT: ' + userInfo.phoneNumber : ''}${userInfo.bio ? '\nGiới thiệu: ' + userInfo.bio : ''}`);
                        } else {
                            ProfileController.showErrorMessage('Không thể lấy thông tin người dùng');
                        }
                    } catch (error) {
                        console.error('Lỗi khi mở trang cá nhân:', error);
                        ProfileController.showErrorMessage(`Lỗi: ${error.message}`);
                    }
                });
            }

            resultDiv.appendChild(item);
        });
    }
};

// Khởi tạo controller khi DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    ProfileController.init();

    // Đóng overlay khi click ra ngoài menu-content
    const overlay = document.getElementById('menu-content-overlay');
    if (overlay) {
        overlay.addEventListener('mousedown', function(e) {
            // Nếu click vào chính overlay (không phải menu-content hoặc con của nó)
            if (e.target === overlay) {
                overlay.style.display = 'none';
            }
        });
    }
}); 