// Application State Management
let currentUser = null;
let selectedUser = null;
let isLoginMode = true;
let users = [];
let messages = {};
let messageId = 0;

// Mock Backend Database
const mockUsers = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', password: 'password123', online: true },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', password: 'password123', online: true },
    { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', password: 'password123', online: false },
    { id: 4, name: 'Diana Prince', email: 'diana@example.com', password: 'password123', online: true },
    { id: 5, name: 'Ethan Hunt', email: 'ethan@example.com', password: 'password123', online: true }
];

// Initialize mock database
let mockUserDatabase = [...mockUsers];

// DOM Elements Cache
const Elements = {
    authSection: document.getElementById('authSection'),
    chatSection: document.getElementById('chatSection'),
    authForm: document.getElementById('authForm'),
    authTitle: document.getElementById('authTitle'),
    authSubtitle: document.getElementById('authSubtitle'),
    authSubmit: document.getElementById('authSubmit'),
    authSwitchText: document.getElementById('authSwitchText'),
    authSwitchBtn: document.getElementById('authSwitchBtn'),
    nameGroup: document.getElementById('nameGroup'),
    authError: document.getElementById('authError'),
    currentUserSpan: document.getElementById('currentUser'),
    logoutBtn: document.getElementById('logoutBtn'),
    usersList: document.getElementById('usersList'),
    messagesContainer: document.getElementById('messagesContainer'),
    messageInputContainer: document.getElementById('messageInputContainer'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    nameInput: document.getElementById('name'),
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password')
};

// Authentication Functions
class AuthManager {
    static toggleAuthMode() {
        isLoginMode = !isLoginMode;
        
        if (isLoginMode) {
            Elements.authTitle.textContent = 'Welcome Back';
            Elements.authSubtitle.textContent = 'Sign in to start chatting with your friends';
            Elements.authSubmit.textContent = 'Sign In';
            Elements.authSwitchText.textContent = "Don't have an account?";
            Elements.authSwitchBtn.textContent = 'Sign Up';
            Elements.nameGroup.style.display = 'none';
        } else {
            Elements.authTitle.textContent = 'Create Account';
            Elements.authSubtitle.textContent = 'Join ChatConnect and start messaging';
            Elements.authSubmit.textContent = 'Sign Up';
            Elements.authSwitchText.textContent = 'Already have an account?';
            Elements.authSwitchBtn.textContent = 'Sign In';
            Elements.nameGroup.style.display = 'block';
        }
        
        this.clearError();
    }

    static clearError() {
        Elements.authError.textContent = '';
    }

    static showError(message) {
        Elements.authError.textContent = message;
    }

    static authenticateUser(email, password) {
        return mockUserDatabase.find(user => 
            user.email === email && user.password === password
        );
    }

    static registerUser(name, email, password) {
        // Check if user already exists
        if (mockUserDatabase.find(user => user.email === email)) {
            return null;
        }

        const newUser = {
            id: mockUserDatabase.length + 1,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            online: true
        };

        mockUserDatabase.push(newUser);
        return newUser;
    }

    static validateForm(email, password, name = '') {
        if (!email.trim()) {
            this.showError('Please enter your email');
            return false;
        }

        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return false;
        }

        if (!password.trim()) {
            this.showError('Please enter your password');
            return false;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long');
            return false;
        }

        if (!isLoginMode && !name.trim()) {
            this.showError('Please enter your name');
            return false;
        }

        return true;
    }

    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static handleAuth(e) {
        e.preventDefault();
        this.clearError();

        const email = Elements.emailInput.value;
        const password = Elements.passwordInput.value;
        const name = Elements.nameInput.value;

        if (!this.validateForm(email, password, name)) {
            return;
        }

        if (isLoginMode) {
            const user = this.authenticateUser(email, password);
            if (user) {
                currentUser = user;
                user.online = true;
                ChatManager.showChatInterface();
            } else {
                this.showError('Invalid email or password');
            }
        } else {
            const user = this.registerUser(name, email, password);
            if (user) {
                currentUser = user;
                ChatManager.showChatInterface();
            } else {
                this.showError('User with this email already exists');
            }
        }
    }

    static logout() {
        if (currentUser) {
            currentUser.online = false;
        }
        currentUser = null;
        selectedUser = null;
        Elements.authSection.style.display = 'flex';
        Elements.chatSection.style.display = 'none';
        Elements.authForm.reset();
        this.clearError();
    }
}

// Chat Management Functions
class ChatManager {
    static showChatInterface() {
        Elements.authSection.style.display = 'none';
        Elements.chatSection.style.display = 'flex';
        Elements.currentUserSpan.textContent = currentUser.name;
        this.loadUsers();
        this.simulateRealTimeUpdates();
    }

    static loadUsers() {
        users = mockUserDatabase.filter(user => user.id !== currentUser.id);
        this.renderUsers();
    }

    static renderUsers() {
        Elements.usersList.innerHTML = '';
        
        users.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = `user-item ${selectedUser && selectedUser.id === user.id ? 'active' : ''}`;
            userElement.onclick = () => this.selectUser(user);
            
            userElement.innerHTML = `
                <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                <div>
                    <div style="font-weight: 500;">${user.name}</div>
                    <div style="font-size: 0.8rem; color: ${user.online ? '#28a745' : '#6c757d'};">
                        ${user.online ? 'Online' : 'Offline'}
                    </div>
                </div>
            `;
            
            Elements.usersList.appendChild(userElement);
        });
    }

    static selectUser(user) {
        selectedUser = user;
        this.renderUsers();
        this.loadMessages();
        Elements.messageInputContainer.classList.remove('hidden');
        
        // Clear and reload messages container
        Elements.messagesContainer.innerHTML = '';
        const chatKey = MessageManager.getChatKey(currentUser.id, user.id);
        if (messages[chatKey]) {
            messages[chatKey].forEach(message => {
                MessageManager.renderMessage(message);
            });
        }
        
        MessageManager.scrollToBottom();
    }

    static loadMessages() {
        // Messages are stored in memory for this demo
        // In a real application, this would fetch messages from the server
    }

    static simulateRealTimeUpdates() {
        // Simulate users going online/offline
        setInterval(() => {
            if (users.length > 0) {
                const randomUser = users[Math.floor(Math.random() * users.length)];
                randomUser.online = Math.random() > 0.3; // 70% chance of being online
                this.renderUsers();
            }
        }, 10000); // Update every 10 seconds
    }
}

// Message Management Functions
class MessageManager {
    static getChatKey(userId1, userId2) {
        return [userId1, userId2].sort().join('-');
    }

    static sendMessage() {
        const messageText = Elements.messageInput.value.trim();
        if (!messageText || !selectedUser) return;

        const message = {
            id: ++messageId,
            senderId: currentUser.id,
            receiverId: selectedUser.id,
            senderName: currentUser.name,
            text: messageText,
            timestamp: new Date()
        };

        const chatKey = this.getChatKey(currentUser.id, selectedUser.id);
        if (!messages[chatKey]) {
            messages[chatKey] = [];
        }
        messages[chatKey].push(message);

        this.renderMessage(message);
        Elements.messageInput.value = '';
        this.scrollToBottom();

        // Simulate receiving a response after a short delay
        setTimeout(() => this.simulateResponse(), 1000 + Math.random() * 2000);
    }

    static renderMessage(message) {
        const messageElement = document.createElement('div');
        const isSent = message.senderId === currentUser.id;
        messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
        
        const time = message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageElement.innerHTML = `
            <div class="message-content">${this.escapeHtml(message.text)}</div>
            <div class="message-info">${time}</div>
        `;
        
        Elements.messagesContainer.appendChild(messageElement);
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static scrollToBottom() {
        Elements.messagesContainer.scrollTop = Elements.messagesContainer.scrollHeight;
    }

    static simulateResponse() {
        if (!selectedUser) return;

        const responses = [
            "That's interesting!",
            "I see what you mean",
            "Absolutely agree with you",
            "Let me think about that",
            "Thanks for sharing!",
            "That makes sense",
            "I had a similar experience",
            "Really? Tell me more!",
            "Great point!",
            "I'm curious about your thoughts on this",
            "How was your day?",
            "That sounds exciting!",
            "I understand completely",
            "What do you think about that?",
            "That's a good question"
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const message = {
            id: ++messageId,
            senderId: selectedUser.id,
            receiverId: currentUser.id,
            senderName: selectedUser.name,
            text: randomResponse,
            timestamp: new Date()
        };

        const chatKey = this.getChatKey(currentUser.id, selectedUser.id);
        if (!messages[chatKey]) {
            messages[chatKey] = [];
        }
        messages[chatKey].push(message);

        this.renderMessage(message);
        this.scrollToBottom();
    }
}

// Event Listeners Setup
class EventManager {
    static init() {
        // Authentication events
        Elements.authForm.addEventListener('submit', (e) => AuthManager.handleAuth(e));
        Elements.authSwitchBtn.addEventListener('click', () => AuthManager.toggleAuthMode());
        Elements.logoutBtn.addEventListener('click', () => AuthManager.logout());

        // Chat events
        Elements.sendBtn.addEventListener('click', () => MessageManager.sendMessage());
        
        // Keyboard events
        Elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                MessageManager.sendMessage();
            }
        });

        // Input validation events
        Elements.emailInput.addEventListener('input', () => AuthManager.clearError());
        Elements.passwordInput.addEventListener('input', () => AuthManager.clearError());
        Elements.nameInput.addEventListener('input', () => AuthManager.clearError());
    }
}

// Application Initialization
class App {
    static init() {
        console.log('ChatConnect initialized!');
        console.log('Try logging in with:');
        console.log('Email: alice@example.com, Password: password123');
        console.log('Email: bob@example.com, Password: password123');
        console.log('Or create a new account!');
        
        EventManager.init();
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});