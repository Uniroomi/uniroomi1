// Supabase Integration for UniRoomi
// Replace your current auth.js with this Supabase-powered version

class UniRoomiSupabaseAuth {
  constructor() {
    // Initialize Supabase client
    this.supabase = this.createSupabaseClient();
    this.currentUser = null;
    this.isAuthenticated = false;
    this.init();
  }

  createSupabaseClient() {
    // Your Supabase configuration
    const supabaseUrl = 'https://viiomybpdszqgsqugpni.supabase.co';
    const supabaseAnonKey = 'sb_publishable_DzaPTRfkcpFsbRd9aLWrDQ_GcXQxdQK';
    
    return window.supabase.createClient(supabaseUrl, supabaseAnonKey);
  }

  async init() {
    // Check for existing session
    await this.checkExistingSession();
    // Setup auth state listener
    this.setupAuthListener();
    // Bind events
    this.bindEvents();
  }

  async checkExistingSession() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (session && !error) {
        this.currentUser = session.user;
        this.isAuthenticated = true;
        this.updateUIForAuthenticatedUser();
        
        // Get user profile data
        await this.loadUserProfile();
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  }

  setupAuthListener() {
    // Listen for auth changes
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (event === 'SIGNED_IN' && session) {
        this.currentUser = session.user;
        this.isAuthenticated = true;
        this.updateUIForAuthenticatedUser();
        await this.loadUserProfile();
        this.showSuccess('Login successful!');
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.updateUIForLoggedOutUser();
        this.showSuccess('You have been logged out successfully');
      }
    });
  }

  async loadUserProfile() {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', this.currentUser.id)
        .single();

      if (data && !error) {
        this.currentUser.profile = data;
        this.updateUIWithProfileData();
      } else if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create one
        await this.createUserProfile();
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  async createUserProfile() {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .insert({
          id: this.currentUser.id,
          email: this.currentUser.email,
          first_name: this.currentUser.user_metadata?.first_name || '',
          last_name: this.currentUser.user_metadata?.last_name || '',
          phone: this.currentUser.user_metadata?.phone || '',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (data && !error) {
        this.currentUser.profile = data;
        this.updateUIWithProfileData();
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
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

    // Logout button
    $(document).on('click', '.logout-btn', (e) => {
      e.preventDefault();
      this.handleLogout();
    });

    // Forgot password
    $(document).on('click', '.forgot-password', (e) => {
      e.preventDefault();
      this.handleForgotPassword();
    });
  }

  async handleLogin() {
    const email = $('#loginEmail').val().trim();
    const password = $('#loginPassword').val();
    const $submitBtn = $('#loginForm button[type="submit"]');
    const $errorDiv = $('#loginError');

    $errorDiv.hide();

    if (!email || !password) {
      this.showError($errorDiv, 'Please enter both email and password');
      return;
    }

    const originalText = $submitBtn.text();
    $submitBtn.prop('disabled', true).text('Logging in...');

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        this.showError($errorDiv, error.message);
      } else {
        this.closeAllModals();
        // Auth state listener will handle UI updates
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

    $errorDiv.hide();
    $successDiv.hide();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      this.showError($errorDiv, 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      this.showError($errorDiv, 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      this.showError($errorDiv, 'Password must be at least 6 characters long');
      return;
    }

    const originalText = $submitBtn.text();
    $submitBtn.prop('disabled', true).text('Creating Account...');

    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone
          }
        }
      });

      if (error) {
        this.showError($errorDiv, error.message);
      } else {
        $successDiv.text('Registration successful! Please check your email to verify your account.').show();
        setTimeout(() => {
          this.closeAllModals();
          this.showLoginModal();
        }, 3000);
      }
    } catch (error) {
      this.showError($errorDiv, 'Registration failed. Please try again.');
    } finally {
      $submitBtn.prop('disabled', false).text(originalText);
    }
  }

  async handleLogout() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async handleForgotPassword() {
    const email = prompt('Please enter your email address:');
    
    if (!email) return;

    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        this.showError(null, error.message);
      } else {
        this.showSuccess('Password reset email sent! Please check your inbox.');
      }
    } catch (error) {
      this.showError(null, 'Failed to send reset email. Please try again.');
    }
  }

  // Modal methods (same as before)
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

  closeAllModals() {
    $('.modal-overlay').fadeOut(300, function() {
      $(this).remove();
    });
  }

  updateUIForAuthenticatedUser() {
    const displayName = this.currentUser.user_metadata?.first_name || 
                       this.currentUser.email?.split('@')[0] || 
                       'User';
    
    const $loginBtn = $('.login-btn');
    const $userMenu = `
      <div class="user-menu">
        <span class="user-welcome">Welcome, ${displayName}</span>
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

  updateUIWithProfileData() {
    if (this.currentUser.profile) {
      const profile = this.currentUser.profile;
      $('.user-welcome').text(`Welcome, ${profile.first_name} ${profile.last_name}`);
    }
  }

  showError($element, message) {
    if ($element) {
      $element.text(message).show();
    } else {
      alert(message);
    }
  }

  showSuccess(message) {
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

  // Modal HTML templates (same as before, but without 2FA)
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
              <label for="registerPhone">Phone Number</label>
              <input type="tel" id="registerPhone" placeholder="Enter your phone number">
            </div>
            
            <div class="form-group">
              <label for="registerPassword">Password</label>
              <input type="password" id="registerPassword" required placeholder="Create a password (min. 6 characters)">
            </div>
            
            <div class="form-group">
              <label for="registerConfirmPassword">Confirm Password</label>
              <input type="password" id="registerConfirmPassword" required placeholder="Confirm your password">
            </div>
            
            <div class="auth-notice">
              <i class="fa fa-info-circle"></i>
              <p>You'll receive a confirmation email to verify your account</p>
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
}

// Initialize when DOM is ready and Supabase is loaded
$(document).ready(function() {
  // Check if Supabase is available
  if (typeof window.supabase !== 'undefined') {
    window.uniroomiAuth = new UniRoomiSupabaseAuth();
  } else {
    console.error('Supabase client not loaded. Please include the Supabase JS SDK.');
  }
});
