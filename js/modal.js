// Modal and authentication system

class ModalManager {
    constructor() {
        this.currentModal = null;
        this.authService = new AuthService();
        this.init();
    }

    init() {
        this.setupModalEventListeners();
        this.setupFormHandlers();
        this.setupClickOutsideToClose();
    }

    // Setup modal event listeners
    setupModalEventListeners() {
        // Close button handlers
        document.querySelectorAll('.modal-close').forEach(button => {
            button.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // ESC key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.closeModal(this.currentModal);
            }
        });
    }

    // Setup click outside to close
    setupClickOutsideToClose() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    // Setup form handlers
    setupFormHandlers() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(loginForm);
            });
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister(registerForm);
            });
        }

        // User type change handler
        const userTypeSelect = document.getElementById('userType');
        if (userTypeSelect) {
            userTypeSelect.addEventListener('change', this.updateRegistrationForm);
        }
    }

    // Open modal
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            // Close any currently open modal
            if (this.currentModal) {
                this.closeModal(this.currentModal);
            }

            modal.classList.add('active');
            this.currentModal = modalId;
            document.body.style.overflow = 'hidden'; // Prevent body scroll

            // Focus first input
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    // Close modal
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            this.currentModal = null;
            document.body.style.overflow = ''; // Restore body scroll

            // Clear form data
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
                this.clearFormErrors(form);
            }
        }
    }

    // Switch between modals
    switchModal(fromModalId, toModalId) {
        this.closeModal(fromModalId);
        setTimeout(() => this.openModal(toModalId), 200);
    }

    // Handle login
    async handleLogin(form) {
        const formData = new FormData(form);
        const email = formData.get('email') || form.querySelector('input[type="email"]').value;
        const password = formData.get('password') || form.querySelector('input[type="password"]').value;

        // Clear previous errors
        this.clearFormErrors(form);

        // Basic validation
        if (!email || !password) {
            this.showFormError(form, 'Пожалуйста, заполните все поля');
            return;
        }

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Вход...';
        submitBtn.disabled = true;

        try {
            const user = await this.authService.login(email, password);
            
            if (user) {
                this.handleSuccessfulLogin(user);
                this.closeModal('loginModal');
                this.showNotification('Добро пожаловать!', 'success');
            } else {
                this.showFormError(form, 'Неверный email или пароль');
            }
        } catch (error) {
            this.showFormError(form, 'Ошибка при входе в систему');
            console.error('Login error:', error);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    // Handle registration
    async handleRegister(form) {
        const formData = new FormData(form);
        const data = {
            full_name: formData.get('full_name') || form.querySelector('input[type="text"]').value,
            email: formData.get('email') || form.querySelector('input[type="email"]').value,
            password: formData.get('password') || form.querySelector('input[type="password"]').value,
            user_type: document.getElementById('userType').value,
            specializations: [],
            bio: ''
        };

        // Get specializations if artist
        if (data.user_type === 'artist') {
            const checkedSpecs = form.querySelectorAll('input[name="reg_specialization"]:checked');
            data.specializations = Array.from(checkedSpecs).map(cb => cb.value);
            
            const bioTextarea = form.querySelector('textarea');
            if (bioTextarea) {
                data.bio = bioTextarea.value;
            }
        }

        // Clear previous errors
        this.clearFormErrors(form);

        // Validation
        const validationErrors = this.validateRegistrationData(data);
        if (validationErrors.length > 0) {
            this.showFormError(form, validationErrors[0]);
            return;
        }

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Регистрация...';
        submitBtn.disabled = true;

        try {
            const user = await this.authService.register(data);
            
            if (user) {
                this.handleSuccessfulLogin(user);
                this.closeModal('registerModal');
                this.showNotification('Регистрация успешна! Добро пожаловать!', 'success');
            } else {
                this.showFormError(form, 'Ошибка при регистрации');
            }
        } catch (error) {
            if (error.message.includes('email')) {
                this.showFormError(form, 'Пользователь с таким email уже существует');
            } else {
                this.showFormError(form, 'Ошибка при регистрации');
            }
            console.error('Registration error:', error);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    // Validate registration data
    validateRegistrationData(data) {
        const errors = [];

        if (!data.full_name || data.full_name.length < 2) {
            errors.push('Имя должно содержать минимум 2 символа');
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push('Введите корректный email');
        }

        if (!data.password || data.password.length < 6) {
            errors.push('Пароль должен содержать минимум 6 символов');
        }

        if (data.user_type === 'artist') {
            if (data.specializations.length === 0) {
                errors.push('Выберите хотя бы одну специализацию');
            }

            if (!data.bio || data.bio.length < 10) {
                errors.push('Описание должно содержать минимум 10 символов');
            }
        }

        return errors;
    }

    // Email validation
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Handle successful login
    handleSuccessfulLogin(user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.updateUIForLoggedInUser(user);
    }

    // Update UI for logged in user
    updateUIForLoggedInUser(user) {
        // Update navigation
        const nav = document.querySelector('.nav');
        if (nav) {
            // Hide login/register buttons
            const loginBtn = nav.querySelector('.btn-outline');
            const registerBtn = nav.querySelector('.btn-primary');
            
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';

            // Add user menu
            const userMenu = document.createElement('div');
            userMenu.className = 'user-menu';
            userMenu.innerHTML = `
                <button class="user-menu-btn" onclick="modalManager.toggleUserMenu()">
                    <i class="fas fa-user"></i>
                    ${user.full_name}
                </button>
                <div class="user-dropdown" style="display: none;">
                    ${user.user_type === 'artist' ? '<a href="#" onclick="modalManager.openProfileModal()">Мой профиль</a>' : ''}
                    <a href="#" onclick="modalManager.logout()">Выйти</a>
                </div>
            `;
            nav.appendChild(userMenu);
        }

        // Show additional features for logged in users
        if (user.user_type === 'editor') {
            this.enableEditorFeatures();
        }
    }

    // Toggle user menu dropdown
    toggleUserMenu() {
        const dropdown = document.querySelector('.user-dropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
    }

    // Enable editor features
    enableEditorFeatures() {
        // Show contact information in artist cards
        document.querySelectorAll('.artist-card').forEach(card => {
            const contactBtn = document.createElement('button');
            contactBtn.className = 'btn btn-outline btn-sm';
            contactBtn.innerHTML = '<i class="fas fa-envelope"></i> Связаться';
            contactBtn.style.position = 'absolute';
            contactBtn.style.top = '8px';
            contactBtn.style.right = '8px';
            contactBtn.onclick = (e) => {
                e.stopPropagation();
                // Contact functionality
            };
            
            card.style.position = 'relative';
            card.appendChild(contactBtn);
        });
        
        // Add editor-specific navigation
        const nav = document.querySelector('.nav');
        const editorLink = document.createElement('a');
        editorLink.href = '#';
        editorLink.className = 'nav-link';
        editorLink.textContent = 'Мои проекты';
        nav.insertBefore(editorLink, nav.querySelector('.btn-outline'));
        
        // Show extended artist information
        document.body.classList.add('editor-access');
    }

    // Logout
    logout() {
        currentUser = null;
        localStorage.removeItem('currentUser');
        location.reload(); // Simple approach - reload page
    }

    // Update registration form based on user type
    updateRegistrationForm() {
        const userType = document.getElementById('userType').value;
        const artistFields = document.getElementById('artistFields');
        
        if (artistFields) {
            artistFields.style.display = userType === 'artist' ? 'block' : 'none';
        }
    }

    // Show form error
    showFormError(form, message) {
        // Remove existing error
        const existingError = form.querySelector('.form-error');
        if (existingError) {
            existingError.remove();
        }

        // Add new error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.style.cssText = `
            color: #dc3545;
            background: #f8d7da;
            padding: 8px 12px;
            border-radius: 4px;
            margin-bottom: 16px;
            font-size: 14px;
            border: 1px solid #f5c6cb;
        `;
        errorDiv.textContent = message;
        
        form.insertBefore(errorDiv, form.firstChild);
    }

    // Clear form errors
    clearFormErrors(form) {
        const errors = form.querySelectorAll('.form-error');
        errors.forEach(error => error.remove());
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 10000;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Authentication service
class AuthService {
    constructor() {
        this.apiBase = 'tables';
    }

    // Login user
    async login(email, password) {
        try {
            // In a real app, this would hash the password and validate against database
            // For demo, we'll use simple validation
            
            const response = await fetch(`${this.apiBase}/users?search=${encodeURIComponent(email)}&limit=1`);
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                const user = data.data[0];
                if (user.email === email) {
                    // In real app, verify password hash
                    return user;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Register user
    async register(userData) {
        try {
            // Check if email already exists
            const existingResponse = await fetch(`${this.apiBase}/users?search=${encodeURIComponent(userData.email)}&limit=1`);
            const existingData = await existingResponse.json();
            
            if (existingData.data && existingData.data.length > 0) {
                throw new Error('User with this email already exists');
            }

            // Create new user
            const newUser = {
                email: userData.email,
                password_hash: this.hashPassword(userData.password), // Simple hash for demo
                full_name: userData.full_name,
                user_type: userData.user_type,
                bio: userData.bio || '',
                specializations: userData.specializations || [],
                genres: [],
                styles: [],
                experience_level: userData.user_type === 'artist' ? 'newcomer' : null,
                availability_status: userData.user_type === 'artist' ? 'available' : null,
                rating: 0,
                reviews_count: 0,
                completed_projects: 0,
                is_verified: false,
                is_active: true,
                last_active: new Date().toISOString()
            };

            const response = await fetch(`${this.apiBase}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newUser)
            });

            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Registration failed');
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    // Simple password hashing (for demo only)
    hashPassword(password) {
        // In production, use proper password hashing like bcrypt
        return btoa(password + 'salt');
    }
}

// Initialize modal manager
const modalManager = new ModalManager();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .user-menu {
        position: relative;
    }
    
    .user-menu-btn {
        background: none;
        border: 1px solid #e1e1e1;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        color: #333;
    }
    
    .user-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border: 1px solid #e1e1e1;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        min-width: 150px;
        z-index: 100;
    }
    
    .user-dropdown a {
        display: block;
        padding: 8px 12px;
        color: #333;
        text-decoration: none;
        font-size: 14px;
    }
    
    .user-dropdown a:hover {
        background: #f8f9fa;
    }
`;
document.head.appendChild(style);

// Export global functions
window.openModal = (modalId) => modalManager.openModal(modalId);
window.closeModal = (modalId) => modalManager.closeModal(modalId);
window.switchModal = (from, to) => modalManager.switchModal(from, to);
window.updateRegistrationForm = () => modalManager.updateRegistrationForm();
window.modalManager = modalManager;