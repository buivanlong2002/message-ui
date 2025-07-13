function goToProfile(name ,isGroup, avatarUrl, groupId, isCreator) {
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
        const groupAvatar = avatarUrl ? getAvatarUrl(avatarUrl) : 'images/default_avatar.jpg';
        profileDetails.innerHTML = `
            <div class="profile-avatar-center">
                <img id="group-avatar-img" src="${groupAvatar}" class="avatar-lg" onerror="this.src='images/default_avatar.jpg'" />
                <h4 class="group-name">${name}</h4>
                <div class="group-actions">
                    <button onclick="searchMessages()"><i class="bi bi-search"></i><br>Tìm tin nhắn</button>
                    <button onclick="addGroupMember()"><i class="bi bi-person-plus"></i><br>Thêm thành viên</button>
                    ${isCreator ? `<button id='change-group-avatar-btn'><i class='bi bi-camera'></i><br>Đổi ảnh nhóm</button>
                    <button id='rename-group-btn'><i class='bi bi-pencil'></i><br>Đổi tên nhóm</button>` : ''}
                </div>
                <input type="file" id="group-avatar-file" accept="image/*" style="display:none;" />
            </div>

            <div class="profile-section" id="group-members-section">
                <div class="section-header">Thành viên nhóm (<span id="group-member-count">...</span>)</div>
                <ul id="group-member-list" class="group-member-list"></ul>
            </div>

            <div class="profile-section">
                <div class="section-header">Bảng tin nhóm</div>
                <ul class="group-board">
                    <li><i class="bi bi-clock-history"></i> Danh sách nhắc hẹn</li>
                    <li><i class="bi bi-journal-text"></i> Ghi chú, ghim, bình chọn</li>
                    <li onclick="createReminder()"><i class="bi bi-bell-fill"></i> Tạo nhắc nhở</li>
                </ul>
            </div>

            <div class="profile-section">
                <div class="section-header">Ảnh/Video</div>
                <div class="media-grid"></div>
                <button class="view-all">Xem tất cả</button>
            </div>

            <div class="profile-section">
                <div class="section-header">Tùy chọn nhóm</div>
                <div class="group-actions">
                    ${isCreator ? `<button onclick="deleteGroup()"><i class="bi bi-trash"></i><br>Xóa nhóm</button>` : `<button onclick="leaveGroup()"><i class="bi bi-box-arrow-right"></i><br>Rời nhóm</button>`}
                    <button onclick="clearGroupMessages()"><i class="bi bi-trash"></i><br>Xóa tin nhắn nhóm</button>
                </div>
            </div>
        `;
        if (isCreator) {
            const btn = document.getElementById('change-group-avatar-btn');
            const fileInput = document.getElementById('group-avatar-file');
            btn.onclick = function() { fileInput.click(); };
            fileInput.onchange = async function() {
                if (!fileInput.files || !fileInput.files[0]) return;
                const formData = new FormData();
                formData.append('file', fileInput.files[0]);
                try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${API_CONFIG.BASE_URL}/conversations/groups/${groupId}/avatar`, {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token },
                        body: formData
                    });
                    const data = await res.json();
                    if (data.status && data.status.success) {
                        const img = document.getElementById('group-avatar-img');
                        img.src = getAvatarUrl(data.data) + '?t=' + Date.now();
                        if (typeof allConversations !== 'undefined') {
                            const conv = allConversations.find(c => c.id === groupId);
                            if (conv) conv.avatarUrl = data.data;
                            if (typeof displayConversations === 'function') displayConversations(allConversations);
                        }
                        alert('Đổi ảnh nhóm thành công!');
                    } else {
                        alert(data.status?.displayMessage || 'Đổi ảnh nhóm thất bại!');
                    }
                } catch (err) {
                    alert('Lỗi khi upload ảnh nhóm!');
                }
            };
            const renameBtn = document.getElementById('rename-group-btn');
            if (renameBtn) renameBtn.onclick = () => alert('Chức năng đang phát triển!');
        }

        loadGroupMembers(groupId, isCreator);

        // === SỬA LỖI TẠI ĐÂY (CHO NHÓM) ===
        // 1. Tìm phần tử chứa ảnh/video sau khi đã render HTML
        const mediaGrid = profileDetails.querySelector('.media-grid');
        // 2. Gọi hàm tải ảnh/video với đầy đủ 2 tham số
        loadConversationAttachments(groupId, mediaGrid);
        
        // 3. Gán sự kiện cho nút "Xem tất cả"
        const viewAllBtn = profileDetails.querySelector('.view-all');
        if (viewAllBtn) {
            viewAllBtn.onclick = () => {
                showAllMediaModal(groupId);
            };
        }

    } else {
        // === Giao diện cá nhân (1-1) ===
        let isCurrentUser = false;
        try {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (currentUser && (currentUser.id === groupId || currentUser.email === name)) {
                isCurrentUser = true;
            }
        } catch (e) {}

        const userAvatar = avatarUrl ? getAvatarUrl(avatarUrl) : 'images/default_avatar.jpg';
        profileDetails.innerHTML = `
            <div class="profile-avatar-center">
               <img id="user-avatar-img" src="${userAvatar}" class="avatar-lg" style="width:88px;height:88px;border-radius:50%;object-fit:cover;box-shadow:0 1px 8px #b6c6e3;" onerror="this.src='images/default_avatar.jpg'" />
               ${isCurrentUser ? `<input type="file" id="user-avatar-file" accept="image/*" style="display:none;" /><button id='change-user-avatar-btn' style='margin-top:8px;'><i class='bi bi-camera'></i> Đổi ảnh đại diện</button>` : ''}
                <h4 class="group-name">${name}</h4>
                <div class="group-actions">
                    <button onclick="searchMessages()"><i class="bi bi-search"></i><br>Tìm tin nhắn</button>
                    <button onclick="viewProfileDetails()"><i class="bi bi-person-lines-fill"></i><br>Trang cá nhân</button>
                </div>
            </div>
            <div class="profile-section">
                <div class="section-header">Bảng tin nhóm</div>
                <ul class="group-board">
                    <li><i class="bi bi-clock-history"></i> Danh sách nhắc hẹn</li>
                    <li><i class="bi bi-journal-text"></i> Ghi chú, ghim, bình chọn</li>
                    <li onclick="createReminder()"><i class="bi bi-bell-fill"></i> Tạo nhắc nhở</li>
                </ul>
            </div>

            <div class="profile-section">
                <div class="section-header">Ảnh/Video</div>
                <div class="media-grid"></div>
                <button class="view-all">Xem tất cả</button>
            </div>
            <div class="profile-section">
                <div class="section-header">Tùy chọn</div>
                <div class="group-actions">
                    <button onclick="clearConversation()"><i class="bi bi-trash"></i><br>Xóa cuộc trò chuyện</button>
                    <button id='block-user-btn'><i class='bi bi-person-x-fill'></i><br>Chặn người dùng</button>
                </div>
            </div>
        `;

        // === SỬA LỖI TẠI ĐÂY (CHO CHAT 1-1) ===
        // 1. Tìm phần tử chứa ảnh/video sau khi đã render HTML
        const mediaGrid = profileDetails.querySelector('.media-grid');
        // 2. Gọi hàm tải ảnh/video với đầy đủ 2 tham số
        loadConversationAttachments(window.currentChatId, mediaGrid);
        
        // 3. Gán sự kiện cho nút "Xem tất cả"
        const viewAllBtn = profileDetails.querySelector('.view-all');
        if (viewAllBtn) {
            viewAllBtn.onclick = () => {
                showAllMediaModal(window.currentChatId);
            };
        }

        // Gán sự kiện cho các nút chức năng
        const blockBtn = document.getElementById('block-user-btn');
        if (blockBtn) {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const targetUserId = groupId;
            // Sử dụng hàm đã có để kiểm tra và gán sự kiện chặn/bỏ chặn
            checkBlockedStatusAndBind(blockBtn, targetUserId);
        }

        if (isCurrentUser) {
            const btn = document.getElementById('change-user-avatar-btn');
            const fileInput = document.getElementById('user-avatar-file');
            btn.onclick = function() { fileInput.click(); };
            fileInput.onchange = async function() {
                if (!fileInput.files || !fileInput.files[0]) return;
                const formData = new FormData();
                formData.append('file', fileInput.files[0]);
                try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${API_CONFIG.BASE_URL}/profiles/avatar`, {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token },
                        body: formData
                    });
                    const data = await res.json();
                    if (data.status && data.status.success) {
                        const img = document.getElementById('user-avatar-img');
                        img.src = getAvatarUrl(data.data) + '?t=' + Date.now();
                        alert('Đổi ảnh đại diện thành công!');
                    } else {
                        alert(data.status?.displayMessage || 'Đổi ảnh đại diện thất bại!');
                    }
                } catch (err) {
                    alert('Lỗi khi upload ảnh đại diện!');
                }
            };
        }
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
    // Nếu đã có ô tìm kiếm thì không tạo lại
    if (document.getElementById('search-message-overlay')) return;

    // Lấy conversationId hiện tại
    const chatId = window.currentChatId;
    if (!chatId) {
        alert('Không xác định được cuộc trò chuyện!');
        return;
    }

    // Tạo overlay tìm kiếm
    const overlay = document.createElement('div');
    overlay.id = 'search-message-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '90px';
    overlay.style.left = '50%';
    overlay.style.transform = 'translateX(-50%)';
    overlay.style.zIndex = '2000';
    overlay.style.background = 'rgba(255,255,255,0.98)';
    overlay.style.boxShadow = '0 8px 32px rgba(16,80,133,0.18), 0 1.5px 8px rgba(16,80,133,0.10)';
    overlay.style.borderRadius = '18px';
    overlay.style.padding = '28px 32px 18px 32px';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'stretch';
    overlay.style.gap = '18px';
    overlay.style.minWidth = '350px';
    overlay.style.maxWidth = '95vw';
    overlay.style.transition = 'box-shadow 0.3s';
    overlay.innerHTML = `
        <div style="display:flex;align-items:center;gap:14px;">
            <input id="search-message-input" type="text" placeholder="Nhập từ khóa tìm tin nhắn..." style="font-size:18px;padding:14px 20px;border-radius:10px;border:1.5px solid #b6c6e3;min-width:220px;outline:none;flex:1;box-shadow:0 2px 8px rgba(16,80,133,0.07);background:#f8fafc;transition:border 0.2s;" />
            <button id="search-message-close" style="background:#f3f4f6;border:none;font-size:28px;color:#105085;cursor:pointer;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;transition:background 0.2s, color 0.2s;">&times;</button>
        </div>
        <div id="search-message-results" style="max-height:340px;overflow-y:auto;"></div>
    `;
    document.body.appendChild(overlay);

    // Focus input
    document.getElementById('search-message-input').focus();

    // Đóng overlay
    document.getElementById('search-message-close').onclick = () => overlay.remove();

    // Xử lý tìm kiếm
    let searchTimeout = null;
    document.getElementById('search-message-input').oninput = function() {
        const keyword = this.value.trim();
        const resultsDiv = document.getElementById('search-message-results');
        resultsDiv.innerHTML = '';
        if (!keyword) return;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            resultsDiv.innerHTML = '<div style="color:#888;padding:8px;">Đang tìm kiếm...</div>';
            fetchAPI(`/messages/search?conversationId=${encodeURIComponent(chatId)}&keyword=${encodeURIComponent(keyword)}&page=0&size=20`)
            .then(data => {
                resultsDiv.innerHTML = '';
                if (data && data.data && data.data.length > 0) {
                    data.data.forEach(msg => {
                        const item = document.createElement('div');
                        item.style.padding = '12px 10px 10px 10px';
                        item.style.borderBottom = '1px solid #e5e7eb';
                        item.style.cursor = 'pointer';
                        item.style.borderRadius = '8px';
                        item.style.marginBottom = '2px';
                        item.style.transition = 'background 0.18s, box-shadow 0.18s';
                        item.onmouseover = () => {
                            item.style.background = 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)';
                            item.style.boxShadow = '0 2px 8px rgba(16,80,133,0.10)';
                        };
                        item.onmouseout = () => {
                            item.style.background = '';
                            item.style.boxShadow = '';
                        };
                        const senderName = msg.sender && msg.sender.nameSender ? msg.sender.nameSender : '';
                        const content = msg.content || '[Không có nội dung]';
                        item.innerHTML = `<div style='font-size:15px;color:#1e293b;font-weight:500;'>${highlightKeyword(content, keyword)}</div><div style='font-size:12px;color:#6b7280;margin-top:2px;'>${senderName} - ${formatTimeAgo(msg.createdAt)}</div>`;
                        item.onclick = function() {
                            // Cuộn đến tin nhắn trong khung chat nếu có
                            const el = document.querySelector(`.message-wrapper[data-message-id='${msg.id}']`);
                            if (el) {
                                el.scrollIntoView({behavior:'smooth',block:'center'});
                                el.querySelector('.message-bubble').style.background = 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)';
                                setTimeout(()=>{
                                    el.querySelector('.message-bubble').style.background = '';
                                }, 2000);
                            } else {
                                alert('Tin nhắn này không nằm trong trang hiện tại!');
                            }
                        };
                        resultsDiv.appendChild(item);
                    });
                } else {
                    resultsDiv.innerHTML = '<div style="color:#888;padding:8px;">Không tìm thấy tin nhắn phù hợp.</div>';
                }
            })
            .catch(() => {
                resultsDiv.innerHTML = '<div style="color:#dc2626;padding:8px;">Lỗi khi tìm kiếm tin nhắn.</div>';
            });
        }, 400);
    };

    // Đóng overlay khi nhấn ESC
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', escHandler);
        }
    });

    // Hàm highlight từ khóa
    function highlightKeyword(text, keyword) {
        if (!text) return '';
        const re = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(re, '<span style="background:yellow;">$1</span>');
    }
    // Hàm format thời gian
    function formatTimeAgo(dateString) {
        const now = new Date();
        const msgDate = new Date(dateString);
        const diffMs = now - msgDate;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return diffMins + ' phút trước';
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return diffHours + ' giờ trước';
        const diffDays = Math.floor(diffHours / 24);
        return diffDays + ' ngày trước';
    }
}

function viewProfileDetails() {
    // Lấy thông tin người dùng hiện tại và conversation hiện tại
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const conversationId = window.currentChatId; // ID của conversation hiện tại
    const currentUserId = localStorage.getItem('userId');
    
    if (!conversationId) {
        alert('Không xác định được cuộc trò chuyện!');
        return;
    }

    // Gọi API để lấy thông tin conversation và tìm người đang chat cùng
    getOtherUserFromConversation(conversationId, currentUserId);
}

async function getOtherUserFromConversation(conversationId, currentUserId) {
    try {
        const token = localStorage.getItem('token');
        
        console.log('Đang lấy thông tin conversation:', conversationId);
        console.log('Current user ID:', currentUserId);
        
        // Sử dụng ConversationService để lấy danh sách conversation
        const response = await fetch(`${API_CONFIG.BASE_URL}/conversations/user/${currentUserId}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        console.log('Conversations API response:', data);
        
        if (data.status && data.status.success && data.data) {
            // Tìm conversation hiện tại trong danh sách
            const conversation = data.data.find(conv => conv.id === conversationId);
            console.log('Found conversation:', conversation);
            console.log('Conversation keys:', Object.keys(conversation));
            
            if (!conversation) {
                alert('Không tìm thấy cuộc trò chuyện!');
                return;
            }
            
            // Tìm người đang chat cùng (không phải chính mình)
            let targetUserId = null;
            
            // Thử tìm từ members nếu có
            if (conversation.members && Array.isArray(conversation.members)) {
                console.log('Members:', conversation.members);
                const otherUser = conversation.members.find(m => m.id !== currentUserId);
                if (otherUser) {
                    targetUserId = otherUser.id;
                    console.log('Found other user from members:', otherUser);
                }
            }
            
            // Nếu không tìm được từ members, thử tìm từ conversation name hoặc otherUserId
            if (!targetUserId) {
                console.log('Không tìm thấy members, thử cách khác...');
                
                // Thử tìm từ otherUserId nếu có
                if (conversation.otherUserId) {
                    targetUserId = conversation.otherUserId;
                    console.log('Found otherUserId:', targetUserId);
                }
                // Thử tìm từ conversation name (có thể là tên người khác)
                else if (conversation.name && conversation.name !== 'Không tên') {
                    console.log('Conversation name:', conversation.name);
                    // Cần gọi API để tìm user theo tên
                    try {
                        const userResponse = await fetch(`${API_CONFIG.BASE_URL}/users/search?displayName=${encodeURIComponent(conversation.name)}`, {
                            method: 'GET',
                            headers: { 'Authorization': 'Bearer ' + token }
                        });
                        const userData = await userResponse.json();
                        console.log('User search response:', userData);
                        
                        if (userData.status && userData.status.success && userData.data && userData.data.length > 0) {
                            const foundUser = userData.data.find(u => u.id !== currentUserId);
                            if (foundUser) {
                                targetUserId = foundUser.id;
                                console.log('Found user by name:', foundUser);
                            }
                        }
                    } catch (searchError) {
                        console.error('Lỗi khi tìm user theo tên:', searchError);
                    }
                }
            }
            
            if (!targetUserId) {
                alert('Không tìm thấy người đang chat cùng! Conversation: ' + JSON.stringify(conversation, null, 2));
                return;
            }
            
            // Kiểm tra nếu đang xem profile của chính mình
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (currentUser && (currentUser.id === targetUserId || currentUser.email === targetUserId)) {
                alert('Đây là trang cá nhân của bạn!');
                return;
            }
            
            console.log('Loading profile for user ID:', targetUserId);
            // Gọi API để lấy thông tin chi tiết của người dùng
            loadOtherUserProfile(targetUserId);
            
        } else {
            alert('Không thể lấy thông tin cuộc trò chuyện: ' + (data.status?.displayMessage || 'Lỗi không xác định'));
        }
    } catch (error) {
        console.error('Lỗi khi lấy thông tin conversation:', error);
        alert('Lỗi khi tải thông tin cuộc trò chuyện: ' + error.message);
    }
}

async function loadOtherUserProfile(userId) {
    try {
        const token = localStorage.getItem('token');
        console.log('Đang gọi API lấy thông tin user:', userId);
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        console.log('User API response:', data);
        
        if (data.status && data.status.success && data.data) {
            console.log('User data:', data.data);
            displayOtherUserProfile(data.data);
        } else {
            console.error('API error:', data);
            alert('Không thể lấy thông tin người dùng: ' + (data.status?.displayMessage || 'Lỗi không xác định'));
        }
    } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
        alert('Lỗi khi tải thông tin người dùng: ' + error.message);
    }
}

async function displayOtherUserProfile(userData) {
    const currentUserId = localStorage.getItem('userId');
    const targetUserId = userData.id;
    let isFriend = false;
    let isSentRequest = false;
    let isReceivedRequest = false;
    // Lấy trạng thái bạn bè, đã gửi, đã nhận lời mời
    try {
        // 1. Kiểm tra bạn bè
        const friendsRes = await FriendshipService.getFriendships(currentUserId);
        if (friendsRes.status && friendsRes.status.code === '00' && Array.isArray(friendsRes.data)) {
            isFriend = friendsRes.data.some(u => String(u.id) === String(targetUserId));
        }
        // 2. Kiểm tra đã gửi lời mời
        const sentRes = await FriendshipService.getSentRequests(currentUserId);
        if (sentRes.status && sentRes.status.code === '00' && Array.isArray(sentRes.data)) {
            isSentRequest = sentRes.data.some(r => {
                const receiverId = r.receiverId || r.receiver?.id;
                return String(receiverId) === String(targetUserId);
            });
        }
        // 3. Kiểm tra đã nhận lời mời
        const receivedRes = await FriendshipService.getPendingRequests(currentUserId);
        if (receivedRes.status && receivedRes.status.code === '00' && Array.isArray(receivedRes.data)) {
            isReceivedRequest = receivedRes.data.some(r => {
                const senderId = r.senderId || r.sender?.id;
                return String(senderId) === String(targetUserId);
            });
        }
    } catch (err) {
        console.warn('Không kiểm tra được trạng thái bạn bè/lời mời:', err);
    }

    const overlay = document.createElement('div');
    overlay.id = 'other-user-profile-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.45);
        z-index: 3000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;

    const userAvatar = userData.avatarUrl ? getAvatarUrl(userData.avatarUrl) : 'images/default_avatar.jpg';
    let friendBtnHtml = '';
    if (isFriend) {
        friendBtnHtml = `<button id="friend-status-btn" style="background:#e0f2fe;color:#0284c7;border:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;cursor:default;display:flex;align-items:center;gap:8px;" disabled><i class="bi bi-people-fill"></i> Bạn bè</button>`;
    } else if (isSentRequest) {
        friendBtnHtml = `<button id="cancel-request-btn" style="background:#fef3c7;color:#92400e;border:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px;"><i class="bi bi-clock"></i> Hủy lời mời</button>`;
    } else if (isReceivedRequest) {
        friendBtnHtml = `<button id="accept-request-btn" style="background:#d1fae5;color:#059669;border:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px;"><i class="bi bi-person-check"></i> Chấp nhận</button>`;
    } else {
        friendBtnHtml = `<button id="add-friend-btn" style="background:#f3f4f6;color:#105085;border:1.5px solid #d1d5db;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px;"><i class="bi bi-person-plus"></i> Kết bạn</button>`;
    }
    
    overlay.innerHTML = `
        <div style="background: #fff; border-radius: 20px; padding: 36px 32px 28px 32px; max-width: 410px; width: 100%; box-shadow: 0 8px 32px rgba(16,80,133,0.18), 0 1.5px 8px rgba(16,80,133,0.10); position: relative; display: flex; flex-direction: column; align-items: center;">
            <button id="close-profile-btn" style="position: absolute; top: 16px; right: 18px; background: none; border: none; font-size: 26px; color: #888; cursor: pointer; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">&times;</button>
            <img src="${userAvatar}" alt="Avatar" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; box-shadow: 0 4px 16px rgba(16,80,133,0.15); margin-bottom: 18px; border: 3px solid #e0e7ef; background: #f8fafc;" onerror="this.src='images/default_avatar.jpg'" />
            <h2 style="margin: 0 0 8px 0; color: #105085; font-size: 25px; font-weight: 700; letter-spacing: 0.5px; text-align: center;">${userData.displayName || userData.name || userData.username || 'Người dùng'}</h2>
            <div style="margin-bottom: 18px; min-height: 22px; width: 100%; text-align: center;"><span style="color: #6b7280; font-size: 15px; font-style: ${userData.bio ? 'normal' : 'italic'};">${userData.bio ? userData.bio : '<span style=\'color:#b6b6b6\'>Chưa có tiểu sử</span>'}</span></div>
            <div style="width: 100%; background: #f8fafc; border-radius: 14px; padding: 18px 18px 10px 18px; margin-bottom: 18px; box-shadow: 0 1px 6px #e5eaf3;">
                <div style="display: flex; align-items: center; margin-bottom: 13px;"><i class="bi bi-envelope" style="color: #105085; margin-right: 12px; width: 20px; font-size: 18px;"></i><span style="color: #374151; font-weight: 500; min-width: 80px;">Email:</span><span style="color: #6b7280; margin-left: 8px;">${userData.email || 'Không có thông tin'}</span></div>
                <div style="display: flex; align-items: center; margin-bottom: 13px;"><i class="bi bi-telephone" style="color: #105085; margin-right: 12px; width: 20px; font-size: 18px;"></i><span style="color: #374151; font-weight: 500; min-width: 80px;">Số điện thoại:</span><span style="color: #6b7280; margin-left: 8px;">${userData.phoneNumber || 'Không có thông tin'}</span></div>
                <div style="display: flex; align-items: center;"><i class="bi bi-calendar3" style="color: #105085; margin-right: 12px; width: 20px; font-size: 18px;"></i><span style="color: #374151; font-weight: 500; min-width: 80px;">Tham gia:</span><span style="color: #6b7280; margin-left: 8px;">${userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('vi-VN') : 'Không có thông tin'}</span></div>
            </div>
            <div style="display: flex; gap: 16px; justify-content: center; width: 100%; margin-bottom: 2px;">
                <button id="message-user-btn" style="background: linear-gradient(135deg, #105085, #1a7cb3); color: white; border: none; padding: 12px 28px; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 600; box-shadow: 0 2px 8px rgba(16,80,133,0.07); transition: all 0.2s; display: flex; align-items: center; gap: 8px;"><i class="bi bi-chat-dots"></i> Nhắn tin</button>
                <span id="friend-action-btn-container"></span>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('close-profile-btn').onclick = () => {
        overlay.remove();
    };
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    };
    document.getElementById('message-user-btn').onclick = () => {
        overlay.remove();
        if (window.currentChatId === targetUserId) {
            return;
        }
        if (typeof ProfileController !== 'undefined' && ProfileController.startChatWithUser) {
            const simpleUser = {
                id: userData.id,
                displayName: userData.displayName,
                avatarUrl: userData.avatarUrl
            };
            ProfileController.startChatWithUser(targetUserId, simpleUser);
        }
    };
    // Render nút trạng thái bạn bè
    const friendActionBtnContainer = document.getElementById('friend-action-btn-container');
    renderFriendActionButton(friendActionBtnContainer, userData, currentUserId, targetUserId);
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

function blockUser() {
    // Placeholder: Xử lý logic chặn người dùng
    alert("Đã nhấn Chặn người dùng. Chức năng này cần được triển khai thêm!");
}

function addGroupMember() {
    // Nếu đã có overlay thì không tạo lại
    if (document.getElementById('add-member-overlay')) return;

    // Lấy groupId hiện tại
    const groupId = window.currentChatId;
    if (!groupId) {
        alert('Không xác định được nhóm!');
        return;
    }

    // Tạo overlay
    const overlay = document.createElement('div');
    overlay.id = 'add-member-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.25)';
    overlay.style.zIndex = '3000';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.innerHTML = `
        <div style="background:#fff;padding:32px 28px;border-radius:16px;min-width:340px;box-shadow:0 8px 32px rgba(16,80,133,0.18);position:relative;">
            <button id="add-member-close" style="position:absolute;top:10px;right:10px;background:none;border:none;font-size:22px;color:#888;cursor:pointer;">&times;</button>
            <h3 style="margin-bottom:18px;color:#105085;">Thêm thành viên vào nhóm</h3>
            <div style="display:flex;gap:10px;margin-bottom:16px;">
                <input id="add-member-email" type="email" placeholder="Nhập email người dùng..." style="flex:1;padding:10px 14px;border-radius:8px;border:1px solid #b6c6e3;font-size:15px;outline:none;" />
                <button id="add-member-search-btn" style="padding:10px 18px;background:linear-gradient(135deg,#105085,#1a7cb3);color:#fff;border:none;border-radius:8px;font-size:15px;cursor:pointer;">Tìm</button>
            </div>
            <div id="add-member-search-result"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Đóng overlay
    document.getElementById('add-member-close').onclick = () => overlay.remove();

    // Xử lý tìm kiếm
    document.getElementById('add-member-search-btn').onclick = async function() {
        const email = document.getElementById('add-member-email').value.trim();
        const resultDiv = document.getElementById('add-member-search-result');
        resultDiv.innerHTML = '';
        if (!email) {
            resultDiv.innerHTML = '<div style="color:#dc2626;">Vui lòng nhập email!</div>';
            return;
        }
        resultDiv.innerHTML = '<div style="color:#888;">Đang tìm kiếm...</div>';
        try {
            const res = await fetchAPI(`/users/find?email=${encodeURIComponent(email)}`);
            if (res && res.data) {
                const user = res.data;
                // Kiểm tra nếu user đã là thành viên nhóm
                let isMember = false;
                if (typeof allConversations !== 'undefined') {
                    const conv = allConversations.find(c => c.id === groupId);
                    if (conv && conv.members && Array.isArray(conv.members)) {
                        isMember = conv.members.some(m => m.id === user.id);
                    }
                }
                if (isMember) {
                    resultDiv.innerHTML = `<div style='color:#dc2626;'>Người dùng này đã là thành viên của nhóm!</div>`;
                    return;
                }
                resultDiv.innerHTML = `
                    <div style='display:flex;align-items:center;gap:12px;padding:10px 0;'>
                        <img src="${getAvatarUrl(user.avatarUrl)}" alt="avatar" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:1px solid #e5e7eb;" />
                        <span style="flex:1;font-size:16px;">${user.displayName || user.email}</span>
                        <button id="add-member-confirm-btn" style="padding:8px 16px;background:linear-gradient(135deg,#105085,#1a7cb3);color:#fff;border:none;border-radius:8px;font-size:15px;cursor:pointer;">Thêm</button>
                    </div>
                `;
                document.getElementById('add-member-confirm-btn').onclick = async function() {
                    // Gọi API thêm thành viên
                    try {
                        const addRes = await fetchAPI('/conversation-members/add', {
                            method: 'POST',
                            body: JSON.stringify({
                                conversationId: groupId,
                                userId: user.id
                            })
                        });
                        if (addRes && addRes.status && addRes.status.success) {
                            resultDiv.innerHTML = '<div style="color:#059669;">Đã thêm thành viên thành công!</div>';
                            setTimeout(()=>overlay.remove(), 1200);
                            // TODO: reload lại danh sách thành viên nếu cần
                        } else {
                            resultDiv.innerHTML = `<div style='color:#dc2626;'>${addRes.status?.displayMessage || 'Thêm thành viên thất bại!'}</div>`;
                        }
                    } catch (err) {
                        resultDiv.innerHTML = `<div style='color:#dc2626;'>Lỗi khi thêm thành viên!</div>`;
                    }
                };
            } else {
                resultDiv.innerHTML = '<div style="color:#dc2626;">Không tìm thấy người dùng!</div>';
            }
        } catch (err) {
            resultDiv.innerHTML = '<div style="color:#dc2626;">Lỗi khi tìm kiếm người dùng!</div>';
        }
    };
}

// Sửa lại hàm loadGroupMembers để nhận thêm creatorId
async function loadGroupMembers(groupId, isCreator = false, creatorId = null) {
    const token = localStorage.getItem('token');
    const section = document.getElementById('group-members-section');
    const list = document.getElementById('group-member-list');
    const countSpan = document.getElementById('group-member-count');
    if (!section || !list || !countSpan) return;
    list.innerHTML = '<li>Đang tải...</li>';

    try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/conversation-members/members-by-conversation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ conversationId: groupId })
        });

        const data = await res.json();

        // Nếu API trả về data.users và data.creatorId
        let users = data.data;
        if (data.data && data.data.users && data.data.creatorId) {
            users = data.data.users;
            creatorId = data.data.creatorId;
        }

        if (data.status && data.status.success && Array.isArray(users)) {
            countSpan.textContent = users.length;
            if (users.length === 0) {
                list.innerHTML = '<li>Chưa có thành viên nào.</li>';
            } else {
                let currentUser = {};
                try {
                    currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                    if (!currentUser.id && localStorage.getItem('userId')) {
                        currentUser.id = localStorage.getItem('userId');
                    }
                } catch (e) {
                    if (localStorage.getItem('userId')) {
                        currentUser.id = localStorage.getItem('userId');
                    }
                }

                list.innerHTML = users.map(u => {
                    let actionBtn = '';
                    // Nút Xóa: chỉ trưởng nhóm mới thấy, không render cho creator
                    if (isCreator && u.id !== creatorId) {
                        actionBtn = `<button class="remove-member-btn" data-user-id="${u.id}" data-user-name="${u.displayName || u.name || 'Không rõ tên'}" style="margin-left:8px;padding:4px 16px;background:#dc2626;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;min-width:48px;box-shadow:0 1px 4px #b6c6e3;transition:background 0.2s;" onmouseover="this.style.background='#b91c1c'\" onmouseout="this.style.background='#dc2626'">Xóa</button>`;
                    }
                    // Nhãn Leader cạnh tên creator cho tất cả mọi người
                    const leaderLabel = u.id === creatorId ? `<span style=\"margin-left:8px;padding:2px 10px;background:linear-gradient(90deg,#22c55e,#16a34a);color:#fff;border-radius:6px;font-size:12px;font-weight:600;display:inline-block;box-shadow:0 1px 4px #b6c6e3;letter-spacing:1px;vertical-align:middle;min-width:40px;text-align:center;\">Leader</span>` : '';
                    return `
                        <li style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;padding:8px 12px;border-radius:8px;background:#f8fafc;border:1px solid #e5e7eb;list-style:none;">
                            <div style="display:flex;align-items:center;gap:10px;">
                                <img src="${getAvatarUrl(u.avatarUrl)}" class="avatar-sm"
                                     style="width:36px;height:36px;border-radius:50%;object-fit:cover;box-shadow:0 1px 4px #b6c6e3;">
                                <span class='member-displayname' style="font-size:16px;font-weight:500;color:#374151;display:flex;align-items:center;">
                                    ${u.displayName || u.name || 'Không rõ tên'} ${leaderLabel}
                                </span>
                            </div>
                            ${actionBtn}
                        </li>
                    `;
                }).join('');

                // Gán sự kiện xóa nếu là người tạo
                if (isCreator) {
                    list.querySelectorAll('.remove-member-btn').forEach(btn => {
                        btn.onclick = async function () {
                            const userId = btn.getAttribute('data-user-id');
                            const userName = btn.getAttribute('data-user-name');
                            
                            if (!confirm(`Bạn có chắc muốn xóa "${userName}" khỏi nhóm?`)) return;

                            try {
                                // Hiển thị loading trên nút
                                btn.innerHTML = 'Đang xóa...';
                                btn.disabled = true;
                                btn.style.background = '#9ca3af';
                                
                                const removeRes = await fetch(`${API_CONFIG.BASE_URL}/conversation-members/remove`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': 'Bearer ' + token
                                    },
                                    body: JSON.stringify({ conversationId: groupId, userId })
                                });

                                const removeData = await removeRes.json();
                                if (removeData.status && removeData.status.success) {
                                    showToast(`Đã xóa "${userName}" khỏi nhóm thành công!`, 'success');
                                    loadGroupMembers(groupId, isCreator, creatorId); // Reload lại danh sách
                                } else {
                                    showToast(removeData.status?.displayMessage || 'Xóa thành viên thất bại!', 'error');
                                    // Khôi phục nút
                                    btn.innerHTML = 'Xóa';
                                    btn.disabled = false;
                                    btn.style.background = '#dc2626';
                                }
                            } catch (err) {
                                console.error('Lỗi khi xóa thành viên:', err);
                                showToast('Lỗi khi xóa thành viên!', 'error');
                                // Khôi phục nút
                                btn.innerHTML = 'Xóa';
                                btn.disabled = false;
                                btn.style.background = '#dc2626';
                            }
                        };
                    });
                }
            }
        } else {
            countSpan.textContent = '0';
            list.innerHTML = '<li>Không lấy được danh sách thành viên.</li>';
        }
    } catch (err) {
        console.error("Lỗi khi tải thành viên:", err);
        countSpan.textContent = '?';
        list.innerHTML = '<li>Lỗi khi tải thành viên nhóm.</li>';
    }
}


async function loadConversationAttachments(conversationId, section) {
    if (!section) return;
    section.innerHTML = '<div style="color:#888;padding:10px;">Đang tải file...</div>';
    try {
        const token = localStorage.getItem('token');

        // 1. Gọi API chính
        const res = await fetch(`${API_CONFIG.BASE_URL}/conversation/${conversationId}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        let attachments = [];

        if (data.status?.success && Array.isArray(data.data) && data.data.length > 0) {
            attachments = data.data;
        } else {
            // 2. Lấy từ message nếu không có
            const msgRes = await fetch(`${API_CONFIG.BASE_URL}/messages/get-by-conversation?conversationId=${conversationId}&page=0&size=100`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                }
            });
            const msgData = await msgRes.json();
            if (msgData.status?.success && Array.isArray(msgData.data)) {
                msgData.data.forEach(msg => {
                    if (msg.attachments && Array.isArray(msg.attachments)) {
                        attachments.push(...msg.attachments);
                    }
                });
            }
        }

        // 3. Hiển thị ảnh/video
        if (attachments.length > 0) {
            section.innerHTML = attachments.slice(0, 4).map(att => {
                const fileUrl = `https://cms-service.up.railway.app${att.url}`;
                const type = att.type || '';

                if (type.startsWith('image') || fileUrl.match(/\.(jpg|jpeg|png|gif|bmp)$/i)) {
                    return `
                        <img src="${fileUrl}" alt="ảnh" 
                             style="width:100px;height:100px;object-fit:cover;
                                    border-radius:8px;margin:4px;box-shadow:0 1px 4px #b6c6e3;" />`;
                } else if (type.startsWith('video') || fileUrl.match(/\.(mp4|webm|ogg)$/i)) {
                    return `
                        <video src="${fileUrl}" controls 
                               style="width:100px;height:100px;border-radius:8px;
                                      margin:4px;box-shadow:0 1px 4px #b6c6e3;"></video>`;
                } else {
                    return `
                        <a href="${fileUrl}" target="_blank"
                           style="display:inline-block;width:100px;height:100px;
                                  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
                                  background:#f3f4f6;border-radius:8px;margin:4px;padding:8px;
                                  box-shadow:0 1px 4px #b6c6e3;vertical-align:top;font-size:13px;">
                            ${att.name || 'File đính kèm'}
                        </a>`;
                }
            }).join('');
        } else {
            section.innerHTML = '<div style="color:#888;padding:10px;">Không có file nào.</div>';
        }
    } catch (err) {
        console.error(err);
        section.innerHTML = '<div style="color:#dc2626;padding:10px;">Lỗi khi tải file!</div>';
    }
}


async function checkBlockedStatusAndBind(btn, userId) {
    try {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_CONFIG.BASE_URL}/blocked-users?userId=${currentUser.id}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        let isBlocked = false;
        if (data.status && data.status.success && Array.isArray(data.data)) {
            isBlocked = data.data.some(u => u.blockedUserId === userId);
        }
        updateBlockBtnUI(btn, isBlocked);
        btn.onclick = async function() {
            if (!isBlocked) {
                // Gọi API chặn
                if (!confirm('Bạn có chắc muốn chặn người này?')) return;
                try {
                    const res2 = await fetch(`${API_CONFIG.BASE_URL}/friendships/block`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({ userId: currentUser.id, blockedUserId: userId })
                    });
                    const data2 = await res2.json();
                    if (data2.status && data2.status.success) {
                        isBlocked = true;
                        updateBlockBtnUI(btn, true);
                        alert('Đã chặn thành công!');
                    } else {
                        alert(data2.status?.displayMessage || 'Chặn thất bại!');
                    }
                } catch (err) {
                    alert('Lỗi khi chặn người dùng!');
                }
            } else {
                // Gọi API bỏ chặn
                if (!confirm('Bạn có chắc muốn bỏ chặn người này?')) return;
                try {
                    const res2 = await fetch(`${API_CONFIG.BASE_URL}/friendships/unblock`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({ userId: currentUser.id, blockedUserId: userId })
                    });
                    const data2 = await res2.json();
                    if (data2.status && data2.status.success) {
                        isBlocked = false;
                        updateBlockBtnUI(btn, false);
                        alert('Đã bỏ chặn thành công!');
                    } else {
                        alert(data2.status?.displayMessage || 'Bỏ chặn thất bại!');
                    }
                } catch (err) {
                    alert('Lỗi khi bỏ chặn người dùng!');
                }
            }
        };
    } catch (err) {
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-person-x-fill"></i><br>Lỗi';
    }
}
function updateBlockBtnUI(btn, isBlocked) {
    if (isBlocked) {
        btn.innerHTML = '<i class="bi bi-person-check-fill"></i><br>Bỏ chặn';
        btn.style.background = '#f3f4f6';
        btn.style.color = '#105085';
    } else {
        btn.innerHTML = '<i class="bi bi-person-x-fill"></i><br>Chặn';
        btn.style.background = '';
        btn.style.color = '';
    }
}

// Hàm render nút trạng thái bạn bè
async function renderFriendActionButton(container, userData, currentUserId, targetUserId) {
    let isFriend = false;
    let isSentRequest = false;
    let isReceivedRequest = false;
    try {
        const friendsRes = await FriendshipService.getFriendships(currentUserId);
        if (friendsRes.status && friendsRes.status.code === '00' && Array.isArray(friendsRes.data)) {
            isFriend = friendsRes.data.some(u => String(u.id) === String(targetUserId));
        }
        const sentRes = await FriendshipService.getSentRequests(currentUserId);
        if (sentRes.status && sentRes.status.code === '00' && Array.isArray(sentRes.data)) {
            isSentRequest = sentRes.data.some(r => {
                const receiverId = r.receiverId || r.receiver?.id;
                return String(receiverId) === String(targetUserId);
            });
        }
        const receivedRes = await FriendshipService.getPendingRequests(currentUserId);
        if (receivedRes.status && receivedRes.status.code === '00' && Array.isArray(receivedRes.data)) {
            isReceivedRequest = receivedRes.data.some(r => {
                const senderId = r.senderId || r.sender?.id;
                return String(senderId) === String(targetUserId);
            });
        }
    } catch (err) {}
    let friendBtnHtml = '';
    if (isFriend) {
        friendBtnHtml = `<button id="friend-status-btn" style="background:#e0f2fe;color:#0284c7;border:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;cursor:default;display:flex;align-items:center;gap:8px;" disabled><i class="bi bi-people-fill"></i> Bạn bè</button>`;
    } else if (isSentRequest) {
        friendBtnHtml = `<button id="cancel-request-btn" style="background:#fef3c7;color:#92400e;border:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px;"><i class="bi bi-clock"></i> Hủy lời mời</button>`;
    } else if (isReceivedRequest) {
        friendBtnHtml = `<button id="accept-request-btn" style="background:#d1fae5;color:#059669;border:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px;"><i class="bi bi-person-check"></i> Chấp nhận</button>`;
    } else {
        friendBtnHtml = `<button id="add-friend-btn" style="background:#f3f4f6;color:#105085;border:1.5px solid #d1d5db;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px;"><i class="bi bi-person-plus"></i> Kết bạn</button>`;
    }
    container.innerHTML = friendBtnHtml;
    // Gắn lại sự kiện cho nút
    const addFriendBtn = container.querySelector('#add-friend-btn');
    if (addFriendBtn) {
        addFriendBtn.onclick = async () => {
            await FriendshipService.sendFriendRequest(currentUserId, targetUserId);
            await renderFriendActionButton(container, userData, currentUserId, targetUserId);
        };
    }
    const cancelRequestBtn = container.querySelector('#cancel-request-btn');
    if (cancelRequestBtn) {
        cancelRequestBtn.onclick = async () => {
            await FriendshipService.cancelFriendRequest(currentUserId, targetUserId);
            await renderFriendActionButton(container, userData, currentUserId, targetUserId);
        };
    }
    const acceptRequestBtn = container.querySelector('#accept-request-btn');
    if (acceptRequestBtn) {
        acceptRequestBtn.onclick = async () => {
            await FriendshipService.acceptFriendRequest(targetUserId, currentUserId);
            await renderFriendActionButton(container, userData, currentUserId, targetUserId);
        };
    }
}

function deleteGroup() {
    alert("Đã nhấn Xóa nhóm. Chức năng này cần được triển khai thêm!");
}

// Hàm ẩn khối chào mừng khi vào cuộc trò chuyện
function hideWelcomeEmptyChat() {
    const welcome = document.getElementById('welcome-empty-chat');
    if (welcome) welcome.style.display = 'none';
}
// Hàm hiện lại khối chào mừng khi không có chat nào
function showWelcomeEmptyChat() {
    const welcome = document.getElementById('welcome-empty-chat');
    if (welcome) welcome.style.display = 'flex';
}

// === HÀM XEM TẤT CẢ MEDIA ===
async function showAllMediaModal(conversationId) {
    try {
        const token = localStorage.getItem('token');
        
        // Hiển thị loading
        const overlay = createMediaModalOverlay();
        document.body.appendChild(overlay);
        
        // Lấy tất cả media từ conversation
        const allMedia = await getAllConversationMedia(conversationId, token);
        
        // Cập nhật nội dung modal
        updateMediaModalContent(overlay, allMedia, conversationId);
        
    } catch (error) {
        console.error('Lỗi khi tải media:', error);
        alert('Lỗi khi tải danh sách media!');
    }
}

async function getAllConversationMedia(conversationId, token) {
    const allMedia = [];
    
    try {
        // 1. Thử lấy từ API conversation attachments
        const res = await fetch(`${API_CONFIG.BASE_URL}/conversation/${conversationId}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        
        if (data.status?.success && Array.isArray(data.data) && data.data.length > 0) {
            data.data.forEach(att => {
                allMedia.push({
                    fileUrl: `https://cms-service.up.railway.app${att.url}`,
                    fileName: att.name || 'File đính kèm',
                    type: att.type || ''
                });
            });
        }
        
        // 2. Nếu không có, lấy từ messages
        if (allMedia.length === 0) {
            const msgRes = await fetch(`${API_CONFIG.BASE_URL}/messages/get-by-conversation?conversationId=${conversationId}&page=0&size=100`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                }
            });
            const msgData = await msgRes.json();
            
            if (msgData.status?.success && Array.isArray(msgData.data)) {
                msgData.data.forEach(msg => {
                    if (msg.attachments && Array.isArray(msg.attachments)) {
                        msg.attachments.forEach(att => {
                            allMedia.push({
                                fileUrl: `https://cms-service.up.railway.app${att.url}`,
                                fileName: att.name || 'File đính kèm',
                                type: att.type || ''
                            });
                        });
                    }
                });
            }
        }
        
    } catch (error) {
        console.error('Lỗi khi lấy media:', error);
    }
    
    return allMedia;
}

function createMediaModalOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'media-modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.8);
        z-index: 3000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    overlay.innerHTML = `
        <div class="media-modal-content">
            <div class="media-modal-header">
                <h3>Media của cuộc trò chuyện</h3>
                <button class="media-modal-close">&times;</button>
            </div>
            <div class="media-modal-body">
                <div style="text-align: center; padding: 40px; color: #888;">
                    <div class="loading"></div>
                    <p>Đang tải media...</p>
                </div>
            </div>
        </div>
    `;
    
    return overlay;
}

function updateMediaModalContent(overlay, allMedia, conversationId) {
    console.log('allMedia:', allMedia);
    
    // Phân loại media
    const images = allMedia.filter(item => {
        const type = item.type || '';
        const fileUrl = item.fileUrl || '';
        return type.startsWith('image') || fileUrl.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);
    });

    const videos = allMedia.filter(item => {
        const type = item.type || '';
        const fileUrl = item.fileUrl || '';
        return type.startsWith('video') || fileUrl.match(/\.(mp4|webm|ogg|avi|mov|mkv)$/i);
    });

    const files = allMedia.filter(item => {
        const type = item.type || '';
        const fileUrl = item.fileUrl || '';
        return !type.startsWith('image') && !type.startsWith('video') &&
               !fileUrl.match(/\.(jpg|jpeg|png|gif|bmp|webp|mp4|webm|ogg|avi|mov|mkv)$/i);
    });

    overlay.innerHTML = `
        <div class="media-modal-content">
            <div class="media-modal-header">
                <h3>Media của cuộc trò chuyện</h3>
                <button class="media-modal-close">&times;</button>
            </div>
            <div class="media-modal-tabs">
                <button class="media-tab active" data-tab="all">
                    <i class="bi bi-collection"></i> Tất cả (${allMedia.length})
                </button>
                <button class="media-tab" data-tab="images">
                    <i class="bi bi-image"></i> Ảnh (${images.length})
                </button>
                <button class="media-tab" data-tab="videos">
                    <i class="bi bi-camera-video"></i> Video (${videos.length})
                </button>
                <button class="media-tab" data-tab="files">
                    <i class="bi bi-file-earmark"></i> File (${files.length})
                </button>
            </div>
            <div class="media-modal-body">
                <div class="media-tab-content active" data-tab="all">
                    ${renderMediaGrid(allMedia)}
                </div>
                <div class="media-tab-content" data-tab="images">
                    ${renderMediaGrid(images)}
                </div>
                <div class="media-tab-content" data-tab="videos">
                    ${renderMediaGrid(videos)}
                </div>
                <div class="media-tab-content" data-tab="files">
                    ${renderMediaGrid(files)}
                </div>
            </div>
        </div>
    `;

    // Đóng modal
    overlay.querySelector('.media-modal-close').onclick = () => overlay.remove();
    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };

    // Chuyển tab
    overlay.querySelectorAll('.media-tab').forEach(tab => {
        tab.onclick = () => {
            const tabName = tab.dataset.tab;
            overlay.querySelectorAll('.media-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            overlay.querySelectorAll('.media-tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.dataset.tab === tabName) {
                    content.classList.add('active');
                }
            });
        };
    });

    // Đóng bằng phím ESC
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function renderMediaGrid(mediaItems) {
    if (mediaItems.length === 0) {
        return '<div class="no-media">Không có media nào</div>';
    }
    return `
        <div class="media-modal-grid">
            ${mediaItems.map(item => {
                const type = item.type || '';
                const fileUrl = item.fileUrl || '';
                const fileName = item.fileName;
                if (type.startsWith('image') || fileUrl.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
                    return `
                        <div class="media-item image-item" onclick="previewMedia('${fileUrl}', 'image')">
                            <img src="${fileUrl}" alt="${fileName}" />
                            <div class="media-item-overlay">
                                <i class="bi bi-eye"></i>
                            </div>
                        </div>
                    `;
                } else if (type.startsWith('video') || fileUrl.match(/\.(mp4|webm|ogg|avi|mov|mkv)$/i)) {
                    return `
                        <div class="media-item video-item" onclick="previewMedia('${fileUrl}', 'video')">
                            <video src="${fileUrl}" muted></video>
                            <div class="media-item-overlay">
                                <i class="bi bi-play-circle"></i>
                            </div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="media-item file-item" onclick="downloadFile('${fileUrl}', '${fileName}')">
                            <div class="file-icon">
                                <i class="bi bi-file-earmark-text"></i>
                            </div>
                            <div class="file-name">${fileName}</div>
                            <div class="media-item-overlay">
                                <i class="bi bi-download"></i>
                            </div>
                        </div>
                    `;
                }
            }).join('')}
        </div>
    `;
}

function previewMedia(fileUrl, type) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.9);
        z-index: 4000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    let content = '';
    if (type === 'image') {
        content = `<img src="${fileUrl}" style="max-width: 90vw; max-height: 90vh; object-fit: contain;" />`;
    } else if (type === 'video') {
        content = `<video src="${fileUrl}" controls style="max-width: 90vw; max-height: 90vh;" autoplay></video>`;
    }
    
    overlay.innerHTML = `
        <div style="position: relative;">
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="position: absolute; top: -40px; right: 0; background: none; border: none; color: white; font-size: 24px; cursor: pointer;">&times;</button>
            ${content}
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Đóng bằng phím ESC
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function downloadFile(fileUrl, fileName) {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Đảm bảo các hàm global
window.showAllMediaModal = showAllMediaModal;
window.previewMedia = previewMedia;
window.downloadFile = downloadFile;

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.innerText = message;
    toast.style.position = 'fixed';
    toast.style.top = '24px';
    toast.style.right = '24px';
    toast.style.zIndex = 9999;
    toast.style.background = type === 'success' ? 'linear-gradient(90deg,#059669,#10b981)' : 'linear-gradient(90deg,#dc2626,#f87171)';
    toast.style.color = '#fff';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '8px';
    toast.style.fontWeight = 'bold';
    toast.style.boxShadow = '0 2px 8px rgba(16,80,133,0.10)';
    toast.style.fontSize = '15px';
    toast.style.opacity = '0.95';
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = 'opacity 0.5s';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 2000);
}

