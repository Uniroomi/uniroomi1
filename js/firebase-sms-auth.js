// Firebase SMS Integration for UniRoomi
// Replace the sendSMSVerification function in auth.js with this Firebase implementation

class FirebaseSMSIntegration {
  constructor() {
    // Initialize Firebase with your config
    this.initializeFirebase();
    this.rateLimiter = new SMSRateLimiter();
  }

  initializeFirebase() {
    // Firebase is already initialized in index.html
    // Initialize Cloud Functions
    this.functions = firebase.functions();
  }

  async sendSMSVerification(phoneNumber, code) {
    try {
      // Rate limiting check
      if (!this.rateLimiter.canSendSMS(phoneNumber)) {
        return {
          success: false,
          error: 'Please wait 60 seconds before requesting another code'
        };
      }

      // Call Firebase Cloud Function for SMS
      const sendSMS = this.functions.httpsCallable('sendVerificationSMS');
      
      const result = await sendSMS({
        phoneNumber: phoneNumber,
        verificationCode: code,
        appName: 'UniRoomi'
      });

      console.log(`SMS Verification Code: ${code} sent to ${phoneNumber}`);
      
      return {
        success: true,
        message: 'Verification code sent to your cellphone',
        messageId: result.data.messageId
      };

    } catch (error) {
      console.error('Firebase SMS sending failed:', error);
      
      return {
        success: false,
        error: 'Failed to send SMS verification code. Please check your phone number and try again.'
      };
    }
  }

  async verifyPhoneNumber(phoneNumber) {
    try {
      // Use Firebase Phone Auth for verification (optional enhancement)
      const appVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container');
      const confirmationResult = await firebase.auth().signInWithPhoneNumber(phoneNumber, appVerifier);
      
      return {
        success: true,
        confirmationResult: confirmationResult
      };
    } catch (error) {
      console.error('Phone verification failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Rate limiting for SMS
class SMSRateLimiter {
  constructor() {
    this.attempts = {};
  }
  
  canSendSMS(phoneNumber) {
    const now = Date.now();
    const lastSent = this.attempts[phoneNumber] || 0;
    
    // Allow one SMS per 60 seconds per phone number
    if (now - lastSent < 60000) {
      return false;
    }
    
    this.attempts[phoneNumber] = now;
    return true;
  }
}

// Enhanced authentication system with Firebase SMS
class UniRoomiFirebaseAuth {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.requiresTwoFactor = false;
    this.tempUser = null;
    this.tempVerificationCode = null;
    this.smsIntegration = new FirebaseSMSIntegration();
    this.init();
  }

  init() {
    // Check for existing session
    this.checkExistingSession();
    // Bind events
    this.bindEvents();
  }

  checkExistingSession() {
    const token = this.getCookie('auth_token');
    const userData = localStorage.getItem('uniroomi_user');
    
    if (token && userData) {
      try {
        this.currentUser = JSON.parse(userData);
        this.isAuthenticated = true;
        this.updateUIForAuthenticatedUser();
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.logout();
      }
    }
  }

  bindEvents() {
    // Login button click
    $(document).on('click', '.login-btn', (e) => {
      e.preventDefault();
      this.showLoginModal();
    });

    // Register link click
    $(document).on('click', '.register-link', (e) => {
      e.preventDefault();
      this.showRegisterModal();
    });

    // Back to login link
    $(document).on('click', '.back-to-login', (e) => {
      e.preventDefault();
      this.showLoginModal();
    });

    // Modal close buttons
    $(document).on('click', '.modal-close', (e) => {
      e.preventDefault();
      this.closeAllModals();
    });

    // Modal backdrop click
    $(document).on('click', '.modal-overlay', (e) => {
      if ($(e.target).hasClass('modal-overlay')) {
        this.closeAllModals();
      }
    });

    // Login form submission
    $(document).on('submit', '#loginForm', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    // Register form submission
    $(document).on('submit', '#registerForm', (e) => {
      e.preventDefault();
      this.handleRegister();
    });

    // 2FA form submission
    $(document).on('submit', '#twoFactorForm', (e) => {
      e.preventDefault();
      this.handleTwoFactorVerification();
    });

    // Logout button
    $(document).on('click', '.logout-btn', (e) => {
      e.preventDefault();
      this.logout();
    });

    // Resend 2FA code
    $(document).on('click', '.resend-code', (e) => {
      e.preventDefault();
      this.resendTwoFactorCode();
    });

    // 2FA code input formatting
    $(document).on('input', '#verificationCode', (e) => {
      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
      $(e.target).val(value);
    });
  }

  showLoginModal() {
    this.closeAllModals();
    const modalHtml = this.getLoginModalHtml();
    $('body').append(modalHtml);
    $('#loginModal').fadeIn(300);
  }

  showRegisterModal() {
    this.closeAllModals();
    const modalHtml = this.getRegisterModalHtml();
    $('body').append(modalHtml);
    $('#registerModal').fadeIn(300);
  }

  async showTwoFactorModal() {
    this.closeAllModals();
    
    // Generate and send SMS verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    if (this.tempUser && this.tempUser.phone) {
      try {
        const result = await this.smsIntegration.sendSMSVerification(this.tempUser.phone, verificationCode);
        
        if (result.success) {
          // Store the code temporarily for verification (in production, this would be server-side)
          this.tempVerificationCode = {
            code: verificationCode,
            expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
            messageId: result.messageId
          };
          
          this.showSuccess(result.message);
        } else {
          this.showError(null, result.error);
          return;
        }
      } catch (error) {
        console.error('Failed to send SMS:', error);
        this.showError(null, 'Failed to send verification code. Please try again.');
        return;
      }
    }
    
    const modalHtml = this.getTwoFactorModalHtml();
    $('body').append(modalHtml);
    $('#twoFactorModal').fadeIn(300);
    $('#verificationCode').focus();
  }

  closeAllModals() {
    $('.modal-overlay').fadeOut(300, function() {
      $(this).remove();
    });
  }

  async handleLogin() {
    const email = $('#loginEmail').val().trim();
    const password = $('#loginPassword').val();
    const $submitBtn = $('#loginForm button[type="submit"]');
    const $errorDiv = $('#loginError');

    // Reset error
    $errorDiv.hide();

    // Validation
    if (!email || !password) {
      this.showError($errorDiv, 'Please enter both email and password');
      return;
    }

    // Show loading
    const originalText = $submitBtn.text();
    $submitBtn.prop('disabled', true).text('Logging in...');

    try {
      // Simulate API call
      await this.delay(1000);
      
      const result = await this.mockLogin(email, password);
      
      if (result.requiresTwoFactor) {
        this.tempUser = result.tempUser;
        this.requiresTwoFactor = true;
        this.closeAllModals();
        await this.showTwoFactorModal();
      } else if (result.success) {
        this.currentUser = result.user;
        this.isAuthenticated = true;
        this.setAuthData(result.token, result.user);
        this.closeAllModals();
        this.updateUIForAuthenticatedUser();
        this.showSuccess('Login successful!');
      } else {
        this.showError($errorDiv, result.error || 'Login failed');
      }
    } catch (error) {
      this.showError($errorDiv, 'Login failed. Please try again.');
    } finally {
      $submitBtn.prop('disabled', false).text(originalText);
    }
  }

  async handleRegister() {
    const formData = {
      firstName: $('#registerFirstName').val().trim(),
      lastName: $('#registerLastName').val().trim(),
      email: $('#registerEmail').val().trim(),
      password: $('#registerPassword').val(),
      confirmPassword: $('#registerConfirmPassword').val(),
      phone: $('#registerPhone').val().trim()
    };

    const $submitBtn = $('#registerForm button[type="submit"]');
    const $errorDiv = $('#registerError');
    const $successDiv = $('#registerSuccess');

    // Reset messages
    $errorDiv.hide();
    $successDiv.hide();

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      this.showError($errorDiv, 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      this.showError($errorDiv, 'Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      this.showError($errorDiv, 'Password must be at least 8 characters long');
      return;
    }

    // Phone validation
    if (!this.validatePhoneNumber(formData.phone)) {
      this.showError($errorDiv, 'Please enter a valid South African phone number (+27XXXXXXXXX)');
      return;
    }

    // Show loading
    const originalText = $submitBtn.text();
    $submitBtn.prop('disabled', true).text('Creating Account...');

    try {
      await this.delay(1000);
      
      const result = await this.mockRegister(formData);
      
      if (result.success) {
        $successDiv.text(result.message).show();
        setTimeout(() => {
          this.closeAllModals();
          this.showLoginModal();
        }, 3000);
      } else {
        this.showError($errorDiv, result.error || 'Registration failed');
      }
    } catch (error) {
      this.showError($errorDiv, 'Registration failed. Please try again.');
    } finally {
      $submitBtn.prop('disabled', false).text(originalText);
    }
  }

  async handleTwoFactorVerification() {
    const code = $('#verificationCode').val();
    const $submitBtn = $('#twoFactorForm button[type="submit"]');
    const $errorDiv = $('#twoFactorError');

    $errorDiv.hide();

    if (code.length !== 6) {
      this.showError($errorDiv, 'Please enter a 6-digit code');
      return;
    }

    const originalText = $submitBtn.text();
    $submitBtn.prop('disabled', true).text('Verifying...');

    try {
      await this.delay(1000);
      
      const result = await this.mockTwoFactorVerification(this.tempUser, code);
      
      if (result.success) {
        this.currentUser = result.user;
        this.isAuthenticated = true;
        this.requiresTwoFactor = false;
        this.tempUser = null;
        this.setAuthData(result.token, result.user);
        this.closeAllModals();
        this.updateUIForAuthenticatedUser();
        this.showSuccess('Login successful!');
      } else {
        this.showError($errorDiv, 'Invalid verification code');
      }
    } catch (error) {
      this.showError($errorDiv, 'Verification failed. Please try again.');
    } finally {
      $submitBtn.prop('disabled', false).text(originalText);
    }
  }

  logout() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.requiresTwoFactor = false;
    this.tempUser = null;
    this.tempVerificationCode = null;
    
    this.deleteCookie('auth_token');
    localStorage.removeItem('uniroomi_user');
    
    this.updateUIForLoggedOutUser();
    this.showSuccess('You have been logged out successfully');
  }

  validatePhoneNumber(phone) {
    // South African format: +27XXXXXXXXX
    const phoneRegex = /^\+27\d{9}$/;
    return phoneRegex.test(phone);
  }

  updateUIForAuthenticatedUser() {
    const $loginBtn = $('.login-btn');
    const $userMenu = `
      <div class="user-menu">
        <span class="user-welcome">Welcome, ${this.currentUser.firstName || this.currentUser.email}</span>
        <button class="logout-btn theme_btn">Logout</button>
      </div>
    `;
    $loginBtn.replaceWith($userMenu);
  }

  updateUIForLoggedOutUser() {
    const $userMenu = $('.user-menu');
    const $loginBtn = '<span class="nav-link theme_btn login-btn">Login</span>';
    $userMenu.replaceWith($loginBtn);
  }

  setAuthData(token, user) {
    this.setCookie('auth_token', token, 7);
    localStorage.setItem('uniroomi_user', JSON.stringify(user));
  }

  // Mock API methods (replace with real Firebase Auth)
  async mockLogin(email, password) {
    const users = JSON.parse(localStorage.getItem('uniroomi_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    if (user.phone) {
      return {
        requiresTwoFactor: true,
        tempUser: { ...user, password: undefined }
      };
    }
    
    return {
      success: true,
      user: { ...user, password: undefined },
      token: 'mock-jwt-token-' + Date.now()
    };
  }

  async mockRegister(userData) {
    const users = JSON.parse(localStorage.getItem('uniroomi_users') || '[]');
    
    if (users.find(u => u.email === userData.email)) {
      return { success: false, error: 'User already exists' };
    }
    
    const newUser = {
      id: Date.now(),
      ...userData,
      twoFactorEnabled: true,
      createdAt: new Date().toISOString()
    };
    
    delete newUser.confirmPassword;
    users.push(newUser);
    localStorage.setItem('uniroomi_users', JSON.stringify(users));
    
    return { 
      success: true, 
      message: 'Registration successful! Please check your cellphone for verification code.' 
    };
  }

  async mockTwoFactorVerification(tempUser, code) {
    // Verify against the SMS code that was sent
    if (this.tempVerificationCode && 
        this.tempVerificationCode.code === code &&
        Date.now() < this.tempVerificationCode.expiresAt) {
      
      // Clear the temporary code
      this.tempVerificationCode = null;
      
      return {
        success: true,
        user: tempUser,
        token: 'mock-jwt-token-' + Date.now()
      };
    }
    
    return { success: false, error: 'Invalid or expired verification code' };
  }

  async resendTwoFactorCode() {
    if (this.tempUser && this.tempUser.phone) {
      try {
        // Generate new code and send SMS
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const result = await this.smsIntegration.sendSMSVerification(this.tempUser.phone, verificationCode);
        
        if (result.success) {
          this.tempVerificationCode = {
            code: verificationCode,
            expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
            messageId: result.messageId
          };
          
          this.showSuccess('New verification code sent to your cellphone!');
        } else {
          this.showError(null, result.error);
        }
      } catch (error) {
        this.showError(null, 'Failed to resend verification code. Please try again.');
      }
    } else {
      this.showError(null, 'No phone number available for verification.');
    }
  }

  // Utility methods
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  showError($element, message) {
    if ($element) {
      $element.text(message).show();
    } else {
      alert(message);
    }
  }

  showSuccess(message) {
    // Create success notification
    const notification = `
      <div class="success-notification">
        <i class="fa fa-check-circle"></i>
        <span>${message}</span>
      </div>
    `;
    $('body').append(notification);
    
    setTimeout(() => {
      $('.success-notification').fadeOut(300, function() {
        $(this).remove();
      });
    }, 3000);
  }

  setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }

  getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  // Modal HTML templates (same as before)
  getLoginModalHtml() {
    return `
      <div class="modal-overlay" id="loginModal">
        <div class="modal-container">
          <div class="modal-header">
            <h2>Login to UniRoomi</h2>
            <button class="modal-close">&times;</button>
          </div>
          
          <form id="loginForm" class="auth-form">
            <div class="error-message" id="loginError" style="display: none;"></div>
            
            <div class="form-group">
              <label for="loginEmail">Email</label>
              <input type="email" id="loginEmail" required placeholder="Enter your email">
            </div>
            
            <div class="form-group">
              <label for="loginPassword">Password</label>
              <input type="password" id="loginPassword" required placeholder="Enter your password">
            </div>
            
            <button type="submit" class="auth-submit-btn">Login</button>
          </form>
          
          <div class="modal-footer">
            <p>
              Don't have an account? 
              <a href="#" class="register-link">Register here</a>
            </p>
            <p>
              <a href="#" class="forgot-password">Forgot password?</a>
            </p>
          </div>
        </div>
      </div>
    `;
  }

  getRegisterModalHtml() {
    return `
      <div class="modal-overlay" id="registerModal">
        <div class="modal-container">
          <div class="modal-header">
            <h2>Register for UniRoomi</h2>
            <button class="modal-close">&times;</button>
          </div>
          
          <form id="registerForm" class="auth-form">
            <div class="error-message" id="registerError" style="display: none;"></div>
            <div class="success-message" id="registerSuccess" style="display: none;"></div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="registerFirstName">First Name</label>
                <input type="text" id="registerFirstName" required placeholder="First name">
              </div>
              <div class="form-group">
                <label for="registerLastName">Last Name</label>
                <input type="text" id="registerLastName" required placeholder="Last name">
              </div>
            </div>
            
            <div class="form-group">
              <label for="registerEmail">Email</label>
              <input type="email" id="registerEmail" required placeholder="Enter your email">
            </div>
            
            <div class="form-group">
              <label for="registerPhone">Phone Number *</label>
              <input type="tel" id="registerPhone" required placeholder="+27123456789" pattern="\\+27\\d{9}">
              <small>Format: +27XXXXXXXXX (South African numbers only)</small>
            </div>
            
            <div class="form-group">
              <label for="registerPassword">Password</label>
              <input type="password" id="registerPassword" required placeholder="Create a password (min. 8 characters)">
            </div>
            
            <div class="form-group">
              <label for="registerConfirmPassword">Confirm Password</label>
              <input type="password" id="registerConfirmPassword" required placeholder="Confirm your password">
            </div>
            
            <div class="two-factor-notice">
              <i class="fa fa-info-circle"></i>
              <p>A verification code will be sent to your cellphone for security</p>
            </div>
            
            <button type="submit" class="auth-submit-btn">Create Account</button>
          </form>
          
          <div class="modal-footer">
            <p>
              Already have an account? 
              <a href="#" class="back-to-login">Login here</a>
            </p>
          </div>
        </div>
      </div>
    `;
  }

  getTwoFactorModalHtml() {
    const maskedPhone = this.tempUser && this.tempUser.phone 
      ? this.tempUser.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
      : 'your cellphone';
    
    return `
      <div class="modal-overlay" id="twoFactorModal">
        <div class="modal-container">
          <div class="modal-header">
            <h2>Cellphone Verification</h2>
            <button class="modal-close">&times;</button>
          </div>
          
          <div class="two-factor-content">
            <div class="security-icon">
              <i class="fa fa-mobile"></i>
            </div>
            
            <p class="instruction-text">
              Enter the 6-digit verification code sent to your cellphone
            </p>
            
            ${this.tempUser ? `
              <p class="user-info">
                Code sent to: <strong>${maskedPhone}</strong>
              </p>
            ` : ''}
            
            <form id="twoFactorForm" class="auth-form">
              <div class="error-message" id="twoFactorError" style="display: none;"></div>
              
              <div class="form-group">
                <label for="verificationCode">Verification Code</label>
                <input type="text" id="verificationCode" maxlength="6" placeholder="000000" required>
              </div>
              
              <button type="submit" class="auth-submit-btn">Verify Code</button>
            </form>
            
            <div class="two-factor-footer">
              <a href="#" class="back-to-login">← Back to Login</a>
              <a href="#" class="resend-code">Resend Code</a>
            </div>
            
            <div class="sms-note">
              <p><strong>Firebase SMS Integration:</strong> Real SMS will be sent to your phone</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Initialize authentication system when DOM is ready
$(document).ready(function() {
  // Firebase SDK is already loaded in index.html
  window.uniroomiAuth = new UniRoomiFirebaseAuth();
});
