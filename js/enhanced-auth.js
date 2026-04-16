// Enhanced Supabase Auth with comprehensive user data storage
class UniRoomiEnhancedAuth {
  constructor() {
    this.supabase = this.createSupabaseClient();
    this.currentUser = null;
    this.isAuthenticated = false;
    this.init();
  }

  createSupabaseClient() {
    const supabaseUrl = 'https://viiomybpdszqgsqugpni.supabase.co';
    const supabaseAnonKey = 'sb_publishable_DzaPTRfkcpFsbRd9aLWrDQ_GcXQxdQK';
    
    return window.supabase.createClient(supabaseUrl, supabaseAnonKey);
  }

  async init() {
    await this.checkExistingSession();
    this.setupAuthListener();
    this.bindEvents();
  }

  async checkExistingSession() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (session && !error) {
        this.currentUser = session.user;
        this.isAuthenticated = true;
        this.updateUIForAuthenticatedUser();
        await this.loadUserProfile();
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  }

  setupAuthListener() {
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
        .select(`
          *,
          universities(name, short_name)
        `)
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

    // Profile form submission
    $(document).on('submit', '#profileForm', (e) => {
      e.preventDefault();
      this.handleProfileUpdate();
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
      }
    } catch (error) {
      this.showError($errorDiv, 'Login failed. Please try again.');
    } finally {
      $submitBtn.prop('disabled', false).text(originalText);
    }
  }

  async handleRegister() {
    const formData = this.getRegistrationFormData();
    const $submitBtn = $('#registerForm button[type="submit"]');
    const $errorDiv = $('#registerError');
    const $successDiv = $('#registerSuccess');

    $errorDiv.hide();
    $successDiv.hide();

    // Validation
    if (!this.validateRegistrationData(formData, $errorDiv)) {
      return;
    }

    const originalText = $submitBtn.text();
    $submitBtn.prop('disabled', true).text('Creating Account...');

    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            date_of_birth: formData.dateOfBirth,
            gender: formData.gender,
            university_id: formData.universityId,
            student_id: formData.studentId,
            graduation_year: formData.graduationYear,
            major: formData.major
          }
        }
      });

      if (authError) {
        this.showError($errorDiv, authError.message);
        return;
      }

      // Step 2: Create user profile
      if (authData.user) {
        const { error: profileError } = await this.supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            date_of_birth: formData.dateOfBirth,
            gender: formData.gender,
            university_id: formData.universityId,
            student_id: formData.studentId,
            graduation_year: formData.graduationYear,
            major: formData.major,
            bio: formData.bio,
            emergency_contact_name: formData.emergencyContactName,
            emergency_contact_phone: formData.emergencyContactPhone,
            preferences: {
              accommodation_type: formData.accommodationType,
              budget_range: formData.budgetRange,
              preferred_location: formData.preferredLocation
            }
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }

      $successDiv.text('Registration successful! Please check your email to verify your account.').show();
      setTimeout(() => {
        this.closeAllModals();
        this.showLoginModal();
      }, 3000);

    } catch (error) {
      this.showError($errorDiv, 'Registration failed. Please try again.');
    } finally {
      $submitBtn.prop('disabled', false).text(originalText);
    }
  }

  getRegistrationFormData() {
    return {
      firstName: $('#registerFirstName').val().trim(),
      lastName: $('#registerLastName').val().trim(),
      email: $('#registerEmail').val().trim(),
      password: $('#registerPassword').val(),
      confirmPassword: $('#registerConfirmPassword').val(),
      phone: $('#registerPhone').val().trim(),
      dateOfBirth: $('#registerDateOfBirth').val(),
      gender: $('#registerGender').val(),
      universityId: $('#registerUniversity').val(),
      studentId: $('#registerStudentId').val().trim(),
      graduationYear: parseInt($('#registerGraduationYear').val()) || null,
      major: $('#registerMajor').val().trim(),
      bio: $('#registerBio').val().trim(),
      emergencyContactName: $('#registerEmergencyContactName').val().trim(),
      emergencyContactPhone: $('#registerEmergencyContactPhone').val().trim(),
      accommodationType: $('#registerAccommodationType').val(),
      budgetRange: $('#registerBudgetRange').val(),
      preferredLocation: $('#registerPreferredLocation').val().trim()
    };
  }

  validateRegistrationData(formData, $errorDiv) {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      this.showError($errorDiv, 'Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      this.showError($errorDiv, 'Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      this.showError($errorDiv, 'Password must be at least 6 characters long');
      return false;
    }

    if (!formData.universityId) {
      this.showError($errorDiv, 'Please select your university');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      this.showError($errorDiv, 'Please enter a valid email address');
      return false;
    }

    return true;
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

  // Modal methods
  showLoginModal() {
    this.closeAllModals();
    const modalHtml = this.getLoginModalHtml();
    $('body').append(modalHtml);
    $('#loginModal').fadeIn(300);
  }

  showRegisterModal() {
    this.closeAllModals();
    const modalHtml = this.getEnhancedRegisterModalHtml();
    $('body').append(modalHtml);
    $('#registerModal').fadeIn(300);
    
    // Load universities for dropdown
    this.loadUniversitiesForRegistration();
  }

  async loadUniversitiesForRegistration() {
    try {
      const { data, error } = await this.supabase
        .from('universities')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading universities:', error);
        return;
      }

      const $select = $('#registerUniversity');
      $select.find('option:not(:first)').remove();

      data.forEach(university => {
        $select.append(`<option value="${university.id}">${university.name}</option>`);
      });

    } catch (error) {
      console.error('Error loading universities:', error);
    }
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

  // Modal HTML templates
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

  getEnhancedRegisterModalHtml() {
    return `
      <div class="modal-overlay" id="registerModal">
        <div class="modal-container enhanced-modal">
          <div class="modal-header">
            <h2>Create Your UniRoomi Account</h2>
            <button class="modal-close">&times;</button>
          </div>
          
          <form id="registerForm" class="auth-form enhanced-form">
            <div class="error-message" id="registerError" style="display: none;"></div>
            <div class="success-message" id="registerSuccess" style="display: none;"></div>
            
            <!-- Personal Information -->
            <div class="form-section">
              <h3>Personal Information</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="registerFirstName">First Name *</label>
                  <input type="text" id="registerFirstName" required placeholder="First name">
                </div>
                <div class="form-group">
                  <label for="registerLastName">Last Name *</label>
                  <input type="text" id="registerLastName" required placeholder="Last name">
                </div>
              </div>
              
              <div class="form-group">
                <label for="registerEmail">Email *</label>
                <input type="email" id="registerEmail" required placeholder="Enter your email">
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="registerPhone">Phone Number</label>
                  <input type="tel" id="registerPhone" placeholder="Enter your phone number">
                </div>
                <div class="form-group">
                  <label for="registerDateOfBirth">Date of Birth</label>
                  <input type="date" id="registerDateOfBirth">
                </div>
              </div>
              
              <div class="form-group">
                <label for="registerGender">Gender</label>
                <select id="registerGender">
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <!-- Account Security -->
            <div class="form-section">
              <h3>Account Security</h3>
              <div class="form-group">
                <label for="registerPassword">Password *</label>
                <input type="password" id="registerPassword" required placeholder="Create a password (min. 6 characters)">
              </div>
              
              <div class="form-group">
                <label for="registerConfirmPassword">Confirm Password *</label>
                <input type="password" id="registerConfirmPassword" required placeholder="Confirm your password">
              </div>
            </div>

            <!-- Academic Information -->
            <div class="form-section">
              <h3>Academic Information</h3>
              <div class="form-group">
                <label for="registerUniversity">University *</label>
                <select id="registerUniversity" required>
                  <option value="">Select your university</option>
                </select>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="registerStudentId">Student ID</label>
                  <input type="text" id="registerStudentId" placeholder="Your student ID number">
                </div>
                <div class="form-group">
                  <label for="registerGraduationYear">Graduation Year</label>
                  <input type="number" id="registerGraduationYear" placeholder="e.g., 2025" min="2024" max="2030">
                </div>
              </div>
              
              <div class="form-group">
                <label for="registerMajor">Major/Field of Study</label>
                <input type="text" id="registerMajor" placeholder="e.g., Computer Science">
              </div>
            </div>

            <!-- Preferences -->
            <div class="form-section">
              <h3>Accommodation Preferences</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="registerAccommodationType">Preferred Type</label>
                  <select id="registerAccommodationType">
                    <option value="">No preference</option>
                    <option value="residence">University Residence</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="shared">Shared Room</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="registerBudgetRange">Budget Range (ZAR/month)</label>
                  <select id="registerBudgetRange">
                    <option value="">No preference</option>
                    <option value="0-3000">Under R3,000</option>
                    <option value="3000-5000">R3,000 - R5,000</option>
                    <option value="5000-8000">R5,000 - R8,000</option>
                    <option value="8000+">Over R8,000</option>
                  </select>
                </div>
              </div>
              
              <div class="form-group">
                <label for="registerPreferredLocation">Preferred Location</label>
                <input type="text" id="registerPreferredLocation" placeholder="e.g., Near campus, City center">
              </div>
            </div>

            <!-- Emergency Contact -->
            <div class="form-section">
              <h3>Emergency Contact</h3>
              <div class="form-group">
                <label for="registerEmergencyContactName">Contact Name</label>
                <input type="text" id="registerEmergencyContactName" placeholder="Emergency contact name">
              </div>
              <div class="form-group">
                <label for="registerEmergencyContactPhone">Contact Phone</label>
                <input type="tel" id="registerEmergencyContactPhone" placeholder="Emergency contact phone">
              </div>
            </div>

            <!-- Bio -->
            <div class="form-section">
              <h3>About You</h3>
              <div class="form-group">
                <label for="registerBio">Bio</label>
                <textarea id="registerBio" rows="3" placeholder="Tell us a bit about yourself..."></textarea>
              </div>
            </div>
            
            <div class="auth-notice">
              <i class="fa fa-info-circle"></i>
              <p>You'll receive a confirmation email to verify your account. Your data is secure and will never be shared.</p>
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
  if (typeof window.supabase !== 'undefined') {
    window.uniroomiAuth = new UniRoomiEnhancedAuth();
  } else {
    console.error('Supabase client not loaded. Please include the Supabase JS SDK.');
  }
});
