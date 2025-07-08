// Application State Management
class AppState {
    constructor() {
        this.state = {
            user: null,
            currentChat: null,
            conversations: [],
            theme: 'light',
            isLoading: false,
            error: null,
            notifications: [],
            unreadCount: 0,
            onlineUsers: new Set(),
            typingUsers: new Map()
        };
        
        this.listeners = new Map();
        this.middleware = [];
        
        // Initialize from localStorage
        this.loadFromStorage();
        
        // Auto-save to localStorage on changes
        this.subscribe('*', () => {
            this.saveToStorage();
        });
    }
    
    // Get state
    get(path = null) {
        if (!path) return { ...this.state };
        
        return path.split('.').reduce((obj, key) => obj?.[key], this.state);
    }
    
    // Set state
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, this.state);
        
        const oldValue = target[lastKey];
        target[lastKey] = value;
        
        // Notify listeners
        this.notify(path, value, oldValue);
        this.notify('*', this.state, null);
        
        return this;
    }
    
    // Subscribe to state changes
    subscribe(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Set());
        }
        this.listeners.get(path).add(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(path);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    this.listeners.delete(path);
                }
            }
        };
    }
    
    // Notify listeners
    notify(path, newValue, oldValue) {
        // Notify specific path listeners
        if (this.listeners.has(path)) {
            this.listeners.get(path).forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error('State listener error:', error);
                }
            });
        }
        
        // Run middleware
        this.middleware.forEach(middleware => {
            try {
                middleware(path, newValue, oldValue, this.state);
            } catch (error) {
                console.error('State middleware error:', error);
            }
        });
    }
    
    // Add middleware
    use(middleware) {
        this.middleware.push(middleware);
        return this;
    }
    
    // User management
    setUser(user) {
        this.set('user', user);
        if (user) {
            localStorage.setItem('userId', user.id);
        } else {
            localStorage.removeItem('userId');
        }
    }
    
    getUser() {
        return this.get('user');
    }
    
    // Chat management
    setCurrentChat(chat) {
        this.set('currentChat', chat);
        if (chat) {
            window.currentChatId = chat.id;
        } else {
            delete window.currentChatId;
        }
    }
    
    getCurrentChat() {
        return this.get('currentChat');
    }
    
    // Conversation management
    setConversations(conversations) {
        this.set('conversations', conversations);
    }
    
    addConversation(conversation) {
        const conversations = this.get('conversations');
        const existingIndex = conversations.findIndex(c => c.id === conversation.id);
        
        if (existingIndex >= 0) {
            conversations[existingIndex] = conversation;
        } else {
            conversations.unshift(conversation);
        }
        
        this.set('conversations', conversations);
    }
    
    updateConversation(conversationId, updates) {
        const conversations = this.get('conversations');
        const index = conversations.findIndex(c => c.id === conversationId);
        
        if (index >= 0) {
            conversations[index] = { ...conversations[index], ...updates };
            this.set('conversations', conversations);
        }
    }
    
    // Theme management
    setTheme(theme) {
        this.set('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }
    
    getTheme() {
        return this.get('theme');
    }
    
    toggleTheme() {
        const currentTheme = this.getTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
    
    // Loading state
    setLoading(loading) {
        this.set('isLoading', loading);
    }
    
    // Error management
    setError(error) {
        this.set('error', error);
        if (error) {
            console.error('App error:', error);
        }
    }
    
    clearError() {
        this.set('error', null);
    }
    
    // Notification management
    addNotification(notification) {
        const notifications = this.get('notifications');
        const id = Date.now() + Math.random();
        const newNotification = {
            id,
            timestamp: Date.now(),
            ...notification
        };
        
        notifications.push(newNotification);
        this.set('notifications', notifications);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            this.removeNotification(id);
        }, 5000);
        
        return id;
    }
    
    removeNotification(id) {
        const notifications = this.get('notifications');
        const filtered = notifications.filter(n => n.id !== id);
        this.set('notifications', filtered);
    }
    
    // Unread count management
    setUnreadCount(count) {
        this.set('unreadCount', count);
        this.updateTitle();
    }
    
    incrementUnreadCount() {
        const current = this.get('unreadCount');
        this.setUnreadCount(current + 1);
    }
    
    decrementUnreadCount() {
        const current = this.get('unreadCount');
        this.setUnreadCount(Math.max(0, current - 1));
    }
    
    // Online users management
    setUserOnline(userId) {
        const onlineUsers = this.get('onlineUsers');
        onlineUsers.add(userId);
        this.set('onlineUsers', onlineUsers);
    }
    
    setUserOffline(userId) {
        const onlineUsers = this.get('onlineUsers');
        onlineUsers.delete(userId);
        this.set('onlineUsers', onlineUsers);
    }
    
    isUserOnline(userId) {
        return this.get('onlineUsers').has(userId);
    }
    
    // Typing indicators
    setUserTyping(userId, chatId) {
        const typingUsers = this.get('typingUsers');
        typingUsers.set(userId, { chatId, timestamp: Date.now() });
        this.set('typingUsers', typingUsers);
        
        // Auto-clear after 3 seconds
        setTimeout(() => {
            this.clearUserTyping(userId);
        }, 3000);
    }
    
    clearUserTyping(userId) {
        const typingUsers = this.get('typingUsers');
        typingUsers.delete(userId);
        this.set('typingUsers', typingUsers);
    }
    
    getTypingUsers(chatId) {
        const typingUsers = this.get('typingUsers');
        const now = Date.now();
        const users = [];
        
        for (const [userId, data] of typingUsers.entries()) {
            if (data.chatId === chatId && now - data.timestamp < 3000) {
                users.push(userId);
            }
        }
        
        return users;
    }
    
    // Persistence
    saveToStorage() {
        try {
            const dataToSave = {
                theme: this.get('theme'),
                user: this.get('user'),
                conversations: this.get('conversations').slice(0, 50) // Limit to last 50
            };
            localStorage.setItem('appState', JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Failed to save state to storage:', error);
        }
    }
    
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('appState');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.theme) this.setTheme(data.theme);
                if (data.user) this.setUser(data.user);
                if (data.conversations) this.setConversations(data.conversations);
            }
        } catch (error) {
            console.error('Failed to load state from storage:', error);
        }
    }
    
    // Clear all data
    clear() {
        this.state = {
            user: null,
            currentChat: null,
            conversations: [],
            theme: 'light',
            isLoading: false,
            error: null,
            notifications: [],
            unreadCount: 0,
            onlineUsers: new Set(),
            typingUsers: new Map()
        };
        
        localStorage.removeItem('appState');
        this.notify('*', this.state, null);
    }
    
    // Update document title with unread count
    updateTitle() {
        const unreadCount = this.get('unreadCount');
        const baseTitle = 'TomoTalk';
        
        if (unreadCount > 0) {
            document.title = `(${unreadCount}) ${baseTitle}`;
        } else {
            document.title = baseTitle;
        }
    }
    
    // Debug
    debug() {
        console.log('Current App State:', this.state);
        console.log('Active Listeners:', this.listeners);
    }
}

// Create global app state instance
window.appState = new AppState();

// Add some useful middleware
appState.use((path, newValue, oldValue, state) => {
    // Log state changes in development
    if (window.location.hostname === 'localhost') {
        console.log(`State change: ${path}`, { old: oldValue, new: newValue });
    }
    
    // Auto-update UI elements based on state changes
    if (path === 'theme') {
        document.documentElement.setAttribute('data-theme', newValue);
    }
    
    if (path === 'isLoading') {
        const loadingElements = document.querySelectorAll('.loading-spinner');
        loadingElements.forEach(el => {
            el.style.display = newValue ? 'inline-block' : 'none';
        });
    }
    
    if (path === 'error' && newValue) {
        showNotification(newValue.message || 'Có lỗi xảy ra', 'error');
    }
});

// Export for use in other modules
window.AppState = AppState; 