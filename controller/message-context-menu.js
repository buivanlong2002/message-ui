/**
 * Forward Message Controller
 * Xử lý tính năng chuyển tiếp tin nhắn
 */

class ForwardMessageController {
    constructor() {
        this.selectedItems = new Set();
        this.currentMessageId = null;
        this.currentMessageData = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Close modal events
        document.getElementById('forward-modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('forward-cancel-btn').addEventListener('click', () => {
            this.closeModal();
        });

        // Tab switching
        document.querySelectorAll('.forward-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.getAttribute('data-tab'));
            });
        });

        // Search functionality
        const searchInput = document.getElementById('forward-search-input');
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Send button
        document.getElementById('forward-send-btn').addEventListener('click', () => {
            this.forwardMessage();
        });

        // Close modal when clicking outside
        document.getElementById('forward-message-modal').addEventListener('click', (e) => {
            if (e.target.id === 'forward-message-modal') {
                this.closeModal();
            }
        });
    }

    /**
     * Mở modal chuyển tiếp tin nhắn
     */
    openModal(messageId) {
        this.currentMessageId = messageId;
        this.selectedItems.clear();
        this.updateSelectedCount();
        this.updateSendButton();
        
        // Hiển thị modal
        document.getElementById('forward-message-modal').style.display = 'flex';
        
        // Load dữ liệu
        this.loadConversations();
        this.loadFriends();
        
        // Focus vào ô tìm kiếm
        setTimeout(() => {
            document.getElementById('forward-search-input').focus();
        }, 100);
    }

    /**
     * Đóng modal
     */
    closeModal() {
        document.getElementById('forward-message-modal').style.display = 'none';
        this.selectedItems.clear();
        this.currentMessageId = null;
        this.currentMessageData = null;
        
        // Reset search
        document.getElementById('forward-search-input').value = '';
        
        // Reset tabs
        this.switchTab('conversations');
    }

    /**
     * Chuyển đổi tab
     */
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.forward-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab panels
        document.querySelectorAll('.forward-tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`forward-${tabName}-tab`).classList.add('active');
    }

    /**
     * Tải danh sách cuộc trò chuyện
     */
    async loadConversations() {
        const container = document.getElementById('forward-conversations-list');
        container.innerHTML = '<div class="loading">Đang tải danh sách cuộc trò chuyện...</div>';

        try {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');
            
            if (!token || !userId) {
                container.innerHTML = '<div class="error-message">Vui lòng đăng nhập lại</div>';
                return;
            }

            // Sử dụng ConversationService để lấy danh sách cuộc trò chuyện
            const response = await ConversationService.getConversations(token);
            
            if (response.status?.code === "00" && response.status.success) {
                const conversations = response.data || [];
                
                if (conversations.length === 0) {
                    container.innerHTML = '<div class="no-data">Chưa có cuộc trò chuyện nào</div>';
                    return;
                }

                container.innerHTML = conversations.map(conv => {
                    const isGroup = conv.type === 'GROUP';
                    const avatarUrl = isGroup ? conv.avatarUrl : (conv.members?.find(m => m.userId !== userId)?.avatarUrl || 'images/default_avatar.jpg');
                    const name = isGroup ? conv.name : (conv.members?.find(m => m.userId !== userId)?.displayName || 'Unknown');
                    const subtitle = isGroup ? `${conv.members?.length || 0} thành viên` : 'Cuộc trò chuyện riêng tư';
                    
                    return `
                        <div class="forward-item" data-id="${conv.id}" data-type="conversation">
                            <img src="${getAvatarUrl(avatarUrl)}" alt="Avatar" class="forward-item-avatar" 
                                 onerror="this.src='images/default_avatar.jpg';"/>
                            <div class="forward-item-info">
                                <div class="forward-item-name">${escapeHtml(name)}</div>
                                <div class="forward-item-subtitle">${subtitle}</div>
                            </div>
                            <div class="forward-item-checkbox"></div>
                        </div>
                    `;
                }).join('');

                // Bind click events
                container.querySelectorAll('.forward-item').forEach(item => {
                    item.addEventListener('click', () => {
                        this.toggleItemSelection(item);
                    });
                });

            } else {
                container.innerHTML = '<div class="error-message">Không thể tải danh sách cuộc trò chuyện</div>';
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách cuộc trò chuyện:', error);
            container.innerHTML = '<div class="error-message">Có lỗi xảy ra khi tải dữ liệu</div>';
        }
    }

    /**
     * Tải danh sách bạn bè
     */
    async loadFriends() {
        const container = document.getElementById('forward-friends-list');
        container.innerHTML = '<div class="loading">Đang tải danh sách bạn bè...</div>';

        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                container.innerHTML = '<div class="error-message">Vui lòng đăng nhập lại</div>';
                return;
            }

            // Sử dụng FriendshipService để lấy danh sách bạn bè
            const response = await FriendshipService.getFriends(token);
            
            if (response.status?.code === "00" && response.status.success) {
                const friends = response.data || [];
                
                if (friends.length === 0) {
                    container.innerHTML = '<div class="no-data">Chưa có bạn bè nào</div>';
                    return;
                }

                container.innerHTML = friends.map(friend => {
                    const avatarUrl = friend.avatarUrl || 'images/default_avatar.jpg';
                    const name = friend.displayName || friend.username || 'Unknown';
                    const subtitle = friend.status === 'ONLINE' ? 'Đang hoạt động' : 'Không hoạt động';
                    
                    return `
                        <div class="forward-item" data-id="${friend.userId}" data-type="friend">
                            <img src="${getAvatarUrl(avatarUrl)}" alt="Avatar" class="forward-item-avatar" 
                                 onerror="this.src='images/default_avatar.jpg';"/>
                            <div class="forward-item-info">
                                <div class="forward-item-name">${escapeHtml(name)}</div>
                                <div class="forward-item-subtitle">${subtitle}</div>
                            </div>
                            <div class="forward-item-checkbox"></div>
                        </div>
                    `;
                }).join('');

                // Bind click events
                container.querySelectorAll('.forward-item').forEach(item => {
                    item.addEventListener('click', () => {
                        this.toggleItemSelection(item);
                    });
                });

            } else {
                container.innerHTML = '<div class="error-message">Không thể tải danh sách bạn bè</div>';
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách bạn bè:', error);
            container.innerHTML = '<div class="error-message">Có lỗi xảy ra khi tải dữ liệu</div>';
        }
    }

    /**
     * Chuyển đổi trạng thái chọn item
     */
    toggleItemSelection(item) {
        const itemId = item.getAttribute('data-id');
        const itemType = item.getAttribute('data-type');
        const key = `${itemType}:${itemId}`;

        if (this.selectedItems.has(key)) {
            this.selectedItems.delete(key);
            item.classList.remove('selected');
        } else {
            this.selectedItems.add(key);
            item.classList.add('selected');
        }

        this.updateSelectedCount();
        this.updateSendButton();
    }

    /**
     * Cập nhật số lượng item được chọn
     */
    updateSelectedCount() {
        const count = this.selectedItems.size;
        document.getElementById('forward-selected-count').textContent = count;
    }

    /**
     * Cập nhật trạng thái nút gửi
     */
    updateSendButton() {
        const sendBtn = document.getElementById('forward-send-btn');
        const hasSelection = this.selectedItems.size > 0;
        
        sendBtn.disabled = !hasSelection;
        if (hasSelection) {
            sendBtn.innerHTML = `<i class="bi bi-send-fill"></i> Gửi (${this.selectedItems.size})`;
        } else {
            sendBtn.innerHTML = `<i class="bi bi-send-fill"></i> Gửi`;
        }
    }

    /**
     * Xử lý tìm kiếm
     */
    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        document.querySelectorAll('.forward-item').forEach(item => {
            const name = item.querySelector('.forward-item-name').textContent.toLowerCase();
            const subtitle = item.querySelector('.forward-item-subtitle').textContent.toLowerCase();
            
            if (name.includes(searchTerm) || subtitle.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    /**
     * Chuyển tiếp tin nhắn
     */
    async forwardMessage() {
        if (this.selectedItems.size === 0) {
            alert('Vui lòng chọn ít nhất một cuộc trò chuyện hoặc bạn bè');
            return;
        }

        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (!token || !userId) {
            alert('Vui lòng đăng nhập lại');
            return;
        }

        try {
            // Disable send button
            const sendBtn = document.getElementById('forward-send-btn');
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Đang gửi...';

            let successCount = 0;
            let errorCount = 0;

            // Lấy thông tin tin nhắn cần chuyển tiếp
            const messageElement = document.querySelector(`.message-wrapper[data-message-id="${this.currentMessageId}"]`);
            if (!messageElement) {
                alert('Không tìm thấy tin nhắn cần chuyển tiếp');
                return;
            }

            // Xử lý từng item được chọn
            for (const key of this.selectedItems) {
                const [type, id] = key.split(':');
                
                try {
                    if (type === 'conversation') {
                        // Chuyển tiếp đến cuộc trò chuyện
                        await this.forwardToConversation(id, token);
                        successCount++;
                    } else if (type === 'friend') {
                        // Tạo cuộc trò chuyện mới với bạn bè
                        await this.forwardToFriend(id, token);
                        successCount++;
                    }
                } catch (error) {
                    console.error(`Lỗi khi chuyển tiếp đến ${type}:${id}:`, error);
                    errorCount++;
                    
                    // Hiển thị thông báo lỗi chi tiết hơn
                    const itemName = document.querySelector(`[data-id="${id}"][data-type="${type}"] .forward-item-name`)?.textContent || 'Unknown';
                    console.warn(`Không thể chuyển tiếp tin nhắn đến ${itemName} (${type}:${id})`);
                }
            }

            // Hiển thị kết quả
            if (errorCount === 0) {
                alert(`Đã chuyển tiếp tin nhắn thành công đến ${successCount} cuộc trò chuyện!`);
            } else {
                alert(`Đã chuyển tiếp thành công ${successCount} tin nhắn, ${errorCount} tin nhắn thất bại.`);
            }

            // Đóng modal
            this.closeModal();

        } catch (error) {
            console.error('Lỗi khi chuyển tiếp tin nhắn:', error);
            alert('Có lỗi xảy ra khi chuyển tiếp tin nhắn');
        } finally {
            // Reset send button
            const sendBtn = document.getElementById('forward-send-btn');
            sendBtn.disabled = false;
            this.updateSendButton();
        }
    }

    /**
     * Chuyển tiếp đến cuộc trò chuyện
     */
    async forwardToConversation(conversationId, token) {
        // Lấy nội dung tin nhắn gốc
        const messageElement = document.querySelector(`.message-wrapper[data-message-id="${this.currentMessageId}"]`);
        const messageContent = messageElement.querySelector('.message-content');
        
        if (!messageContent) {
            throw new Error('Không tìm thấy nội dung tin nhắn');
        }

        // Tạo nội dung chuyển tiếp
        let forwardContent = '';
        let messageType = "TEXT";
        
        // Kiểm tra xem có phải tin nhắn đã được thu hồi không
        if (messageElement.querySelector('.message-content.text-muted')) {
            forwardContent = '[Tin nhắn đã được thu hồi]';
        } else {
            // Kiểm tra loại tin nhắn
            const messageText = messageContent.querySelector('.message-text');
            if (messageText) {
                forwardContent = messageText.textContent;
            }
            // Kiểm tra xem có file đính kèm không
            const hasImages = messageContent.querySelector('.message-images');
            const hasVideos = messageContent.querySelector('.message-videos');
            const hasFiles = messageContent.querySelector('.message-files');
            if (hasImages) {
                messageType = "IMAGE";
                if (!forwardContent) forwardContent = "[Hình ảnh]";
            } else if (hasVideos) {
                messageType = "VIDEO";
                if (!forwardContent) forwardContent = "[Video]";
            } else if (hasFiles) {
                messageType = "FILE";
                if (!forwardContent) forwardContent = "[Tệp đính kèm]";
            }
        }
        // Nếu không có nội dung, tạo nội dung mặc định
        if (!forwardContent) {
            forwardContent = "[Tin nhắn]";
        }

        // Tạo FormData để gửi tin nhắn
        const formData = new FormData();
        formData.append("conversationId", conversationId);
        formData.append("senderId", localStorage.getItem('userId'));
        formData.append("content", forwardContent);
        formData.append("messageType", messageType);

        // Gửi tin nhắn
        const response = await MessageService.sendMessage(formData, token);
        
        if (!response.status?.success) {
            throw new Error(response.status?.message || 'Gửi tin nhắn thất bại');
        }
    }

    /**
     * Chuyển tiếp đến bạn bè (tạo cuộc trò chuyện mới)
     */
    async forwardToFriend(friendId, token) {
        const userId = localStorage.getItem('userId');
        // Sử dụng method có sẵn để tạo hoặc lấy cuộc trò chuyện 1-1
        const convResponse = await ConversationService.getOrCreateOneToOneConversation(userId, friendId, token);
        if (!convResponse.status?.success) {
            throw new Error('Không thể tạo cuộc trò chuyện mới');
        }
        const conversationId = convResponse.data.id;
        // Lấy nội dung tin nhắn gốc
        const messageElement = document.querySelector(`.message-wrapper[data-message-id="${this.currentMessageId}"]`);
        const messageContent = messageElement.querySelector('.message-content');
        if (!messageContent) {
            throw new Error('Không tìm thấy nội dung tin nhắn');
        }
        // Tạo nội dung chuyển tiếp
        let forwardContent = '';
        let messageType = "TEXT";
        // Kiểm tra xem có phải tin nhắn đã được thu hồi không
        if (messageElement.querySelector('.message-content.text-muted')) {
            forwardContent = '[Tin nhắn đã được thu hồi]';
        } else {
            // Kiểm tra loại tin nhắn
            const messageText = messageContent.querySelector('.message-text');
            if (messageText) {
                forwardContent = messageText.textContent;
            }
            // Kiểm tra xem có file đính kèm không
            const hasImages = messageContent.querySelector('.message-images');
            const hasVideos = messageContent.querySelector('.message-videos');
            const hasFiles = messageContent.querySelector('.message-files');
            if (hasImages) {
                messageType = "IMAGE";
                if (!forwardContent) forwardContent = "[Hình ảnh]";
            } else if (hasVideos) {
                messageType = "VIDEO";
                if (!forwardContent) forwardContent = "[Video]";
            } else if (hasFiles) {
                messageType = "FILE";
                if (!forwardContent) forwardContent = "[Tệp đính kèm]";
            }
        }
        // Nếu không có nội dung, tạo nội dung mặc định
        if (!forwardContent) {
            forwardContent = "[Tin nhắn]";
        }
        // Tạo FormData để gửi tin nhắn
        const formData = new FormData();
        formData.append("conversationId", conversationId);
        formData.append("senderId", localStorage.getItem('userId'));
        formData.append("content", forwardContent);
        formData.append("messageType", messageType);
        // Gửi tin nhắn
        const response = await MessageService.sendMessage(formData, token);
        if (!response.status?.success) {
            throw new Error(response.status?.message || 'Gửi tin nhắn thất bại');
        }
    }
}

// Khởi tạo controller
const forwardMessageController = new ForwardMessageController();

/**
 * Hàm chuyển tiếp tin nhắn (được gọi từ context menu)
 */
function forwardMessage(messageId) {
    forwardMessageController.openModal(messageId);
}
