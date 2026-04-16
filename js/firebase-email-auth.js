// Firebase Email Authentication for UniRoomi
// Replaces SMS verification with email verification

class FirebaseEmailAuth {
  constructor() {
    // Initialize Firebase with your config
    this.initializeFirebase();
    this.currentUser = null;
    this.isAuthenticated = false;
    this.init();
  }

  initializeFirebase() {
    // Firebase is already initialized in index.html
    // Initialize Firebase Auth
    this.auth = firebase.auth();
  }

  // Ensure a minimal localStorage user record exists for the authenticated user.
  // This is necessary because this project uses localStorage as the primary
  // store for user roles and metadata; localStorage is browser-scoped, so
  // signing-in from a different browser will not have that record.
  ensureLocalUserData(user) {
    try {
      const uid = user.uid;
      const email = user.email || '';
      const displayName = user.displayName || (email ? email.split('@')[0] : 'User');
      const now = new Date().toISOString();
      const fallback = {
        uid,
        email,
        displayName,
        role: 'guest',
        createdAt: now,
        // don't set suspended by default
        suspended: false
      };
      localStorage.setItem(`uniroomi_user_${uid}`, JSON.stringify(fallback));
      return fallback;
    } catch (err) {
      console.error('Error creating fallback local user data:', err);
      return null;
    }
  }

  init() {
    // Check for existing session
    this.checkExistingSession();
    // Bind events
    this.bindEvents();
    // Listen for auth state changes
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Ensure there's a local user record. If missing (other browser), create a minimal one.
        let userData = JSON.parse(localStorage.getItem(`uniroomi_user_${user.uid}`));
        if (!userData) {
          // Create a fallback local user record so the user can use the app from this browser.
          userData = this.ensureLocalUserData(user);
        }

        // Check if user is suspended
        if (userData && userData.suspended) {
          // User is suspended, sign them out immediately
          await this.auth.signOut();
          this.showError(null, 'Your account has been suspended. Please contact support.');
          return;
        }
        
        this.currentUser = {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: user.displayName,
          firstName: user.displayName ? user.displayName.split(' ')[0] : '',
          lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : ''
        };
        this.isAuthenticated = true;
        this.updateUIForAuthenticatedUser();
      } else {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.updateUIForLoggedOutUser();
      }
    });
  }

  checkExistingSession() {
    // Firebase Auth handles session persistence automatically
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
      this.logout();
    });

    // Become a Host button
    $(document).on('click', '.theme_btn_two:not(.logout-btn):not(.user-menu)', (e) => {
      e.preventDefault();
      this.showRegisterModal('host'); // Show register modal with host role pre-selected
    });

    // password visibility toggle
    $(document).on('click', '.password-toggle', function(e) {
      e.preventDefault();
      const targetId = $(this).attr('data-target');
      const $input = $('#' + targetId);
      const type = $input.attr('type');
      $input.attr('type', type === 'password' ? 'text' : 'password');
      // swap eye / eye-slash icon
      const $icon = $(this).find('i');
      if ($icon.hasClass('fa-eye')) {
        $icon.removeClass('fa-eye').addClass('fa-eye-slash');
      } else {
        $icon.removeClass('fa-eye-slash').addClass('fa-eye');
      }
    });

    // Resend verification email
    $(document).on('click', '.resend-verification', (e) => {
      e.preventDefault();
      this.resendVerificationEmail();
    });
  }

  showLoginModal(prefilledEmail = null, isHostUser = false) {
    this.closeAllModals();
    const modalHtml = this.getLoginModalHtml(prefilledEmail, isHostUser);
    $('body').append(modalHtml);
    $('#loginModal').fadeIn(300);
  }

  showRegisterModal(preselectedRole = null) {
    this.closeAllModals();
    const modalHtml = this.getRegisterModalHtml(preselectedRole);
    $('body').append(modalHtml);
    $('#registerModal').fadeIn(300);
  }

  showVerificationModal() {
    this.closeAllModals();
    const modalHtml = this.getVerificationModalHtml();
    $('body').append(modalHtml);
    $('#verificationModal').fadeIn(300);
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
    const $successDiv = $('#loginSuccess');

    // Reset messages
    $errorDiv.hide();
    $successDiv.hide();

    // Validation
    if (!email || !password) {
      this.showError($errorDiv, 'Please fill in all required fields');
      return;
    }

    // Block admin email from main site login
    if (email === "uniroomi@proton.me") {
      this.showError($errorDiv, 'This account is for admin access only. Please use the admin login page.');
      return;
    }

    const originalText = $submitBtn.text();
    $submitBtn.prop('disabled', true).text('Logging in...');

    try {
      // Sign in user
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      
      // Ensure local user data exists. If it was created in another browser, create a minimal record here.
      let userData = JSON.parse(localStorage.getItem(`uniroomi_user_${userCredential.user.uid}`));
      if (!userData) {
        userData = this.ensureLocalUserData(userCredential.user);
      }

      // Check if user is suspended
      if (userData.suspended) {
        await this.auth.signOut(); // Sign out the user
        this.showError($errorDiv, 'Your account has been suspended. Please contact support.');
        return;
      }

      // Update user profile with name if needed
      if (!userCredential.user.displayName && userData) {
        await userCredential.user.updateProfile({
          displayName: userData.displayName || userData.email.split('@')[0]
        });
      }

      this.closeAllModals();
      this.showSuccess($successDiv, 'Login successful!');
      
      // Redirect to appropriate dashboard based on user role
      setTimeout(() => {
        this.redirectToDashboard();
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      }
      
      this.showError($errorDiv, errorMessage);
    } finally {
      $submitBtn.prop('disabled', false).text(originalText);
    }
  }

  async getUserRole(uid) {
    try {
      const userData = localStorage.getItem(`uniroomi_user_${uid}`);
      if (userData) {
        const user = JSON.parse(userData);
        return user.role || 'guest';
      }
      return 'guest'; // Default role if not found
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'guest';
    }
  }

  async updateUserRole(uid, role) {
    try {
      const userData = localStorage.getItem(`uniroomi_user_${uid}`);
      if (userData) {
        const user = JSON.parse(userData);
        user.role = role;
        localStorage.setItem(`uniroomi_user_${uid}`, JSON.stringify(user));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  }

  async handleRegister() {
    const formData = {
      firstName: $('#registerFirstName').val().trim(),
      lastName: $('#registerLastName').val().trim(),
      email: $('#registerEmail').val().trim(),
      password: $('#registerPassword').val(),
      confirmPassword: $('#registerConfirmPassword').val(),
      role: $('#registerRole').val() || 'guest' // Default to guest role
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

    // Block admin email from main site registration
    if (formData.email === "uniroomi@proton.me") {
      this.showError($errorDiv, 'This email is reserved for admin access only.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      this.showError($errorDiv, 'Passwords do not match');
      return;
    }

    // password rule: at least 8 characters and at least one uppercase letter
    const strongPwdRegex = /^(?=.*[A-Z]).{8,}$/;
    if (!strongPwdRegex.test(formData.password)) {
      this.showError($errorDiv, 'Password must be at least 8 characters long and contain at least one uppercase letter');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      this.showError($errorDiv, 'Please enter a valid email address');
      return;
    }

    // Show loading
    const originalText = $submitBtn.text();
    $submitBtn.prop('disabled', true).text('Creating Account...');

    try {
      // Create user with email and password
      const userCredential = await this.auth.createUserWithEmailAndPassword(
        formData.email, 
        formData.password
      );

      // Update user profile with name
      await userCredential.user.updateProfile({
        displayName: `${formData.firstName} ${formData.lastName}`
      });

      // Store user role in localStorage (since we're not using a real database)
      const userData = {
        uid: userCredential.user.uid,
        email: formData.email,
        displayName: `${formData.firstName} ${formData.lastName}`,
        role: formData.role,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(`uniroomi_user_${userCredential.user.uid}`, JSON.stringify(userData));

      // Send verification email
      await userCredential.user.sendEmailVerification();

      // Sign out user until they verify email
      await this.auth.signOut();

      const roleText = formData.role === 'host' ? 'as a Host' : 'as a Guest';
      const successMessage = formData.role === 'host' 
        ? `<strong>Host Registration Successful!</strong><br>
           Please check your email (${formData.email}) for a verification link.<br>
           After verification, you'll be redirected to your Host Dashboard.`
        : `<strong>Registration successful!</strong><br>
           Please check your email (${formData.email}) for a verification link.<br>
           You must verify your email before logging in ${roleText}.`;
      
      $successDiv.html(successMessage).show();

      setTimeout(() => {
        this.closeAllModals();
        this.showLoginModal(formData.email, formData.role === 'host'); // Pass email and host flag
      }, 5000);

    } catch (error) {
      let errorMessage = 'Registration failed. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled.';
          break;
      }
      
      this.showError($errorDiv, errorMessage);
    } finally {
      $submitBtn.prop('disabled', false).text(originalText);
    }
  }

  async resendVerificationEmail() {
    try {
      const user = this.auth.currentUser;
      if (user && !user.emailVerified) {
        await user.sendEmailVerification();
        this.showSuccess('Verification email sent! Please check your inbox.');
      } else {
        this.showError(null, 'No unverified user found.');
      }
    } catch (error) {
      this.showError(null, 'Failed to resend verification email.');
    }
  }

  async logout() {
    // Update UI immediately for logged-out state so user sees change without reload
    try {
      this.updateUIForLoggedOutUser();
    } catch (err) {
      console.warn('Could not update UI for logged out user:', err);
    }

    // Try sign out but don't block UI; use a timeout to avoid hanging
    try {
      await Promise.race([
        this.auth.signOut(),
        new Promise((resolve) => setTimeout(resolve, 1500))
      ]);
      this.showSuccess(null, 'You have been logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Redirect to index - determine correct relative path
    const currentPath = window.location.pathname;
    let target = 'index.html';
    if (currentPath.includes('Campuses/')) {
      target = '../index.html';
    } else if (currentPath.includes('accommodations/')) {
      target = '../../index.html';
    }

    try {
      window.location.replace(target);
    } catch (err) {
      window.location.href = target;
    }

    // As a last resort ensure the page reloads to show logged-out UI
    setTimeout(() => {
      try { window.location.replace(target); } catch { window.location.href = target; }
    }, 500);
  }

  updateUIForAuthenticatedUser() {
    const $loginBtn = $('.login-btn');
    const $becomeHostBtn = $('.theme_btn_two').not('.logout-btn');
    
    // Get user role to determine if we should show "Become a Host" button
    let userRole = 'guest';
    const user = window.uniroomiAuth.currentUser;
    
    if (user && user.uid) {
      const userData = localStorage.getItem(`uniroomi_user_${user.uid}`);
      if (userData) {
        const userObj = JSON.parse(userData);
        userRole = userObj.role || 'guest';
      }
    }
    
    // Remove ALL existing "Become a Host" buttons to prevent duplicates
    $becomeHostBtn.parent().remove();
    // Also hide any static become-host anchors for robustness (desktop + mobile)
    $('.become-host').closest('.nav-item').hide();
    $('.theme_btn_two:contains("Become a Host")').closest('.nav-item').hide();
    
    // Only add "Become a Host" button back if user is a guest
    if (userRole !== 'host') {
      // We'll add it in mobile menu generation below
    }
    
    // Hide dashboard navigation from navbar on mobile only (visible on desktop for all users)
    function updateDashboardButtonVisibility() {
      if (window.innerWidth <= 991) {
        $('.dashboard-nav-item').hide();
        $('.desktop-dashboard-btn').hide();
      } else {
        $('.dashboard-nav-item').show();
        $('.desktop-dashboard-btn').show();
      }
    }
    
    // Initial check
    updateDashboardButtonVisibility();
    
    // Add window resize listener
    $(window).on('resize', function() {
      updateDashboardButtonVisibility();
    });
    
    // Get user initials and check for avatar
    let initials = 'U'; // Default to 'U' for User
    let avatarHtml = '';
    
    // Try to get user avatar from localStorage
    let userAvatar = '';
    if (user && user.uid) {
      const storageKey = `profileAdditionalData_${user.uid}`;
      const userData = localStorage.getItem(storageKey);
      if (userData) {
        const additionalData = JSON.parse(userData);
        userAvatar = additionalData.avatarUrl || '';
      }
    }
    
    if (user) {
      if (user.displayName) {
        // Use displayName if available (e.g., "John Doe")
        const nameParts = user.displayName.trim().split(' ');
        if (nameParts.length >= 2) {
          initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        } else if (nameParts.length === 1) {
          initials = nameParts[0][0].toUpperCase();
        }
      } else if (user.firstName && user.lastName) {
        // Use firstName and lastName if available
        initials = (user.firstName[0] + user.lastName[0]).toUpperCase();
      } else if (user.email) {
        // Use first two letters of email as fallback
        initials = user.email.substring(0, 2).toUpperCase();
      }
      
      // Create avatar HTML if user has one
      if (userAvatar && userAvatar.length > 0) {
        avatarHtml = `<img src="${userAvatar}" alt="Profile Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      }
    }
    
    // Hide "Become a Host" for all logged-in users (guest and host) in desktop and mobile menus
    let becomeHostButton = '';
    // The existing "Become a Host" button is already removed from nav via $becomeHostBtn.parent().remove(),
    // and no new button will be re-added here when authenticated.
    
    const $userMenu = `
      ${becomeHostButton}
      <li class="nav-item">
        <a href="#" class="nav-link notification-bell" title="Notifications">
          <div class="notification">
            <svg viewBox="0 0 166 197">
              <path d="M82.8652955,196.898522 C97.8853137,196.898522 110.154225,184.733014 110.154225,169.792619 L55.4909279,169.792619 C55.4909279,184.733014 67.8452774,196.898522 82.8652955,196.898522 L82.8652955,196.898522 Z" class="notification--bellClapper"></path>
              <path d="M146.189736,135.093562 L146.189736,82.040478 C146.189736,52.1121695 125.723173,27.9861651 97.4598237,21.2550099 L97.4598237,14.4635396 C97.4598237,6.74321823 90.6498186,0 82.8530327,0 C75.0440643,0 68.2462416,6.74321823 68.2462416,14.4635396 L68.2462416,21.2550099 C39.9707102,27.9861651 19.5163297,52.1121695 19.5163297,82.040478 L19.5163297,135.093562 L0,154.418491 L0,164.080956 L165.706065,164.080956 L165.706065,154.418491 L146.189736,135.093562 Z" class="notification--bell"></path>
            </svg>
            <span class="notification--num"></span>
          </div>
        </a>
      </li>
      <li class="nav-item desktop-dashboard-btn">
        <button class="button-75" role="button" onclick="navigateToDashboard(); return false;"><span class="text"><i class="fa fa-th-large"></i> Dashboard</span></button>
      </li>
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle profile-avatar" href="#" id="userProfileDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <div class="avatar-wrapper">
            ${avatarHtml || `<div class="avatar-initials">${initials}</div>`}
          </div>
        </a>
        <div class="dropdown-menu dropdown-menu-right" aria-labelledby="userProfileDropdown">
          <a class="dropdown-item" href="#" onclick="console.log('Profile clicked from dropdown'); navigateToDashboard(); return false;">
            <i class="fa fa-user"></i> My Profile
          </a>
          <a class="dropdown-item" href="#" onclick="console.log('Bookings clicked from dropdown'); navigateToDashboard(); return false;">
            <i class="fa fa-home"></i> My Bookings
          </a>
          <a class="dropdown-item" href="#" onclick="console.log('Saved clicked from dropdown'); navigateToDashboard(); return false;">
            <i class="fa fa-heart"></i> Saved Properties
          </a>
          <a class="dropdown-item" href="#" onclick="console.log('Messages clicked from dropdown'); navigateToDashboard(); return false;">
            <i class="fa fa-envelope"></i> Messages
          </a>
          <div class="dropdown-divider"></div>
          <a class="dropdown-item" href="#">
            <i class="fa fa-cog"></i> Settings
          </a>
          <a class="dropdown-item" href="#">
            <i class="fa fa-question-circle"></i> Help Center
          </a>
          <div class="dropdown-divider"></div>
          <a class="dropdown-item logout-btn" href="#">
            <i class="fa fa-sign-out"></i> Log Out
          </a>
        </div>
      </li>
    `;
    
    // Add mobile menu items
    const $mobileMenuItems = `
      <li class="nav-item mobile-profile-menu">
        <div class="mobile-profile-header">
          <div class="mobile-avatar">
            ${avatarHtml || `<div class="mobile-avatar-initials">${initials}</div>`}
          </div>
          <div class="mobile-user-info">
            <div class="mobile-user-name">${user.displayName || user.email}</div>
            <div class="mobile-user-email">${user.email}</div>
          </div>
        </div>
      </li>
      <li class="nav-item mobile-menu-item">
        <a class="nav-link" href="#" onclick="navigateToSection('profile'); return false;">
          <i class="fa fa-user"></i> My Profile
        </a>
      </li>
      <li class="nav-item mobile-menu-item">
        <a class="nav-link" href="#" onclick="navigateToSection('bookings'); return false;">
          <i class="fa fa-home"></i> My Bookings
        </a>
      </li>
      <li class="nav-item mobile-menu-item">
        <a class="nav-link" href="#" onclick="navigateToSection('saved'); return false;">
          <i class="fa fa-heart"></i> Saved Properties
        </a>
      </li>
      <li class="nav-item mobile-menu-item">
        <a class="nav-link" href="#" onclick="navigateToSection('messages'); return false;">
          <i class="fa fa-envelope"></i> Messages
        </a>
      </li>
      <li class="nav-item mobile-menu-item">
        <a class="nav-link" href="#">
          <i class="fa fa-cog"></i> Settings
        </a>
      </li>
      <li class="nav-item mobile-menu-item">
        <a class="nav-link" href="#">
          <i class="fa fa-question-circle"></i> Help Center
        </a>
      </li>
      <li class="nav-item mobile-menu-item">
        <a class="nav-link logout-btn mobile-logout" href="#">
          <i class="fa fa-sign-out"></i> Log Out
        </a>
      </li>
    `;
    
    $loginBtn.parent().replaceWith($userMenu);
    
    // Update message count after user menu is created
    setTimeout(() => {
      console.log('Attempting to update notification count...');
      
      // Try multiple approaches to update message count
      try {
        // Method 1: Check if uniroomiMessaging exists
        if (typeof uniroomiMessaging !== 'undefined' && uniroomiMessaging.updateMessageCount) {
          console.log('Using uniroomiMessaging.updateMessageCount');
          uniroomiMessaging.updateMessageCount();
        }
        // Method 2: Check if updateMessageCount exists globally
        else if (typeof updateMessageCount === 'function') {
          console.log('Using global updateMessageCount');
          updateMessageCount();
        }
        // Method 3: Manually update the notification count
        else {
          console.log('Using manual message count update');
          const notificationNum = document.querySelector('.notification--num');
          console.log('Notification element found:', !!notificationNum);
          
          if (notificationNum) {
            // Try to get messages from localStorage
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
              const user = firebase.auth().currentUser;
              const messagesKey = `uniroomi_messages_${user.uid}`;
              const messages = JSON.parse(localStorage.getItem(messagesKey) || '[]');
              const unreadCount = messages.filter(m => !m.isRead).length;
              
              console.log('Messages found:', messages.length);
              console.log('Unread count:', unreadCount);
              
              notificationNum.textContent = unreadCount > 0 ? unreadCount.toString() : '';
              notificationNum.style.display = unreadCount > 0 ? 'block' : 'none';
              
              console.log('Notification updated with count:', unreadCount);
            } else {
              console.log('Firebase user not available');
            }
          } else {
            console.log('Notification element not found');
          }
        }
      } catch (error) {
        console.log('Message count update failed:', error);
      }
    }, 200);
    
    // Add mobile menu items to the collapsible navbar
    const $navbarCollapse = $('#navbarSupportedContent .navbar-nav');
    if ($navbarCollapse.length > 0) {
      // Remove any existing mobile profile menu
      $navbarCollapse.find('.mobile-profile-menu, .mobile-menu-item').remove();
      // Add new mobile menu items at the beginning
      $navbarCollapse.prepend($mobileMenuItems);
    }
  }

  updateUIForLoggedOutUser() {
    const $userMenu = $('.user-menu').parent();
    
    // Hide dashboard link on mobile only (visible on desktop for all users)
    function updateDashboardButtonVisibility() {
      if (window.innerWidth <= 991) {
        $('.dashboard-nav-item').hide();
        $('.desktop-dashboard-btn').hide();
      } else {
        $('.dashboard-nav-item').show();
        $('.desktop-dashboard-btn').show();
      }
    }
    
    // Initial check
    updateDashboardButtonVisibility();
    
    // Add window resize listener
    $(window).on('resize', function() {
      updateDashboardButtonVisibility();
    });
    
    // Remove the empty dropdown that's interfering
    $('.submenu.dropdown').remove();

    // Ensure "Become a Host" is visible for logged-out state
    $('.become-host').closest('.nav-item').show();
    $('.theme_btn_two:contains("Become a Host")').closest('.nav-item').show();
    
    const $navItems = `
      <li class="nav-item become-host">
        <span class="nav-link theme_btn_two">Become a Host</span>
      </li>
      <li class="nav-item">
        <span class="nav-link theme_btn login-btn">Login</span>
      </li>
    `;
    $userMenu.replaceWith($navItems);
  }

  // Utility methods
  showError($element, message) {
    if ($element) {
      $element.text(message).show();
    } else {
      // Show error in a temporary alert if no element provided
      const errorAlert = $(`
        <div class="alert alert-danger" style="position: fixed; top: 20px; right: 20px; z-index: 9999; background: #dc3545; color: white; padding: 15px; border-radius: 5px; max-width: 300px;">
          ${message}
        </div>
      `);
      $('body').append(errorAlert);
      setTimeout(() => {
        errorAlert.fadeOut(500, function() {
          $(this).remove();
        });
      }, 5000);
    }
  }

  showSuccess($element, message) {
    if ($element) {
      $element.html(message).show();
    } else {
      // Show success in a temporary alert if no element provided
      const successAlert = $(`
        <div class="alert alert-success" style="position: fixed; top: 20px; right: 20px; z-index: 9999; background: #28a745; color: white; padding: 15px; border-radius: 5px; max-width: 300px;">
          ${message}
        </div>
      `);
      $('body').append(successAlert);
      setTimeout(() => {
        successAlert.fadeOut(500, function() {
          $(this).remove();
        });
      }, 3000);
    }
    // Create success notification
    const notification = `
      <div class="success-notification">
        <i class="fa fa-check-circle"></i>
        <span>${message}</span>
      </div>
    `;
    $('body').append(notification);
    
    setTimeout(() => {
      $('.success-notification').fadeOut(() => {
        $('.success-notification').remove();
      });
    }, 3000);
  }

  navigateToSection(section) {
    const userRole = localStorage.getItem('userRole');
    const currentPath = window.location.pathname;
    
    // Determine which dashboard to go to
    let targetDashboard = 'dashboard.html'; // default for guests
    
    if (userRole === 'host') {
      targetDashboard = 'dashboard-host.html';
    }
    
    // Build correct relative path based on current location
    let targetPath = targetDashboard;
    
    if (currentPath.includes('/Campuses/')) {
      // We're in a Campuses subdirectory, need to go up one level
      targetPath = '../' + targetDashboard;
    } else if (currentPath.includes('/accommodations/')) {
      // We're in accommodations subdirectory, need to go up two levels
      targetPath = '../../' + targetDashboard;
    } else if (currentPath.includes('/Uniroomi/') && !currentPath.includes('/Campuses/') && !currentPath.includes('/accommodations/')) {
      // We're in the main Uniroomi directory (but not in subdirectories)
      targetPath = targetDashboard;
    } else {
      // Default fallback - assume we're in main directory
      targetPath = targetDashboard;
    }
    
    // Check if we're already on the correct dashboard
    if (!currentPath.includes(targetDashboard)) {
      // Navigate to dashboard with section hash
      window.location.href = `${targetPath}#${section}`;
    } else {
      // Already on dashboard, just scroll to section
      this.scrollToSection(section);
    }
  }

  scrollToSection(section) {
    // Close mobile menu first
    const navbarCollapse = document.getElementById('navbarSupportedContent');
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
      $('.navbar-toggler').click(); // Close the menu
    }

    // Find and scroll to the section
    let targetElement;
    switch(section) {
      case 'profile':
        targetElement = document.querySelector('.dashboard-profile-section');
        if (!targetElement) {
          // Try to toggle profile section if it exists
          const profileToggle = document.querySelector('.profile-toggle');
          if (profileToggle && typeof toggleProfileSection === 'function') {
            toggleProfileSection();
            targetElement = document.querySelector('.dashboard-profile-section');
          }
        }
        break;
      case 'bookings':
        targetElement = document.querySelector('.booking-section');
        if (!targetElement) {
          const bookingToggle = document.querySelector('.booking-toggle');
          if (bookingToggle && typeof toggleBookingSection === 'function') {
            toggleBookingSection();
            targetElement = document.querySelector('.booking-section');
          }
        }
        break;
      case 'saved':
        targetElement = document.querySelector('.saved-properties-section');
        break;
      case 'messages':
        targetElement = document.querySelector('.dashboard-messages-container');
        break;
    }

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Highlight the section briefly
      targetElement.style.transition = 'background-color 0.3s';
      targetElement.style.backgroundColor = '#f0f8ff';
      setTimeout(() => {
        targetElement.style.backgroundColor = '';
      }, 1000);
    }
  }

  // Role-based navigation utility
  navigateToDashboard() {
    // Get user role from current user data in localStorage
    let userRole = 'guest'; // default
    
    console.log('navigateToDashboard called');
    console.log('currentUser:', this.currentUser);
    
    if (this.currentUser && this.currentUser.uid) {
      const userData = localStorage.getItem(`uniroomi_user_${this.currentUser.uid}`);
      console.log(`Looking for role in: uniroomi_user_${this.currentUser.uid}`);
      console.log('Raw userData from localStorage:', userData);
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          console.log('Parsed user data:', user);
          userRole = user.role || 'guest';
          console.log('User role:', userRole);
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      } else {
        console.log('No user data found in localStorage');
        // Try to get all localStorage keys to debug
        console.log('Available localStorage keys:', Object.keys(localStorage).filter(k => k.includes('uniroomi')));
      }
    } else {
      console.log('No currentUser or uid found');
    }
    
    const currentPath = window.location.pathname;
    
    // Determine which dashboard to go to
    let targetDashboard = 'dashboard.html'; // default for guests
    
    if (userRole === 'host') {
      targetDashboard = 'dashboard-host.html';
    }
    
    console.log('Navigating to:', targetDashboard);
    console.log('Current path:', currentPath);
    
    // Build correct relative path based on current location
    let targetPath = targetDashboard;
    
    if (currentPath.includes('/Campuses/')) {
      // We're in a Campuses subdirectory, need to go up one level
      targetPath = '../' + targetDashboard;
    } else if (currentPath.includes('/accommodations/')) {
      // We're in accommodations subdirectory, need to go up two levels
      targetPath = '../../' + targetDashboard;
    } else if (currentPath.includes('/Uniroomi/') && !currentPath.includes('/Campuses/') && !currentPath.includes('/accommodations/')) {
      // We're in the main Uniroomi directory (but not in subdirectories)
      targetPath = targetDashboard;
    } else {
      // Default fallback - assume we're in main directory
      targetPath = targetDashboard;
    }
    
    console.log('Final target path:', targetPath);
    
    // Check if we're already on the correct dashboard
    if (!currentPath.includes(targetDashboard)) {
      window.location.href = targetPath;
    }
  }

  // Make functions globally accessible
  makeGlobal() {
    window.navigateToSection = this.navigateToSection.bind(this);
    window.scrollToSection = this.scrollToSection.bind(this);
    window.navigateToDashboard = this.navigateToDashboard.bind(this);
  }

  // Get current user role
  getUserRole() {
    return localStorage.getItem('userRole') || 'guest';
  }

  // Check if user is host
  isHost() {
    return this.getUserRole() === 'host';
  }

  // Check if user is guest
  isGuest() {
    return this.getUserRole() === 'guest';
  }

  // Modal HTML templates
  getLoginModalHtml(prefilledEmail = null, isHostUser = false) {
    const modalTitle = isHostUser ? 'Login as Host' : 'Login to UniRoomi';
    const emailValue = prefilledEmail ? `value="${prefilledEmail}"` : '';
    const hostNotice = isHostUser ? `
      <div class="host-login-notice">
        <i class="fa fa-home"></i>
        <p>You're logging in as a Host to access your Host Dashboard</p>
      </div>
    ` : '';

    return `
      <div class="modal-overlay" id="loginModal">
        <div class="modal-container">
          <div class="modal-header">
            <h2>${modalTitle}</h2>
            <button class="modal-close">&times;</button>
          </div>
          
          <form id="loginForm" class="auth-form">
            <div class="error-message" id="loginError" style="display: none;"></div>
            
            ${hostNotice}
            
            <div class="form-group">
              <label for="loginEmail">Email</label>
              <input type="email" id="loginEmail" required placeholder="Enter your email" ${emailValue}>
            </div>
            
            <div class="form-group password-group">
              <label for="loginPassword">Password</label>
              <div class="password-field-wrapper">
                <input type="password" id="loginPassword" required placeholder="Enter your password">
                <span class="password-toggle" data-target="loginPassword" title="Show/Hide"><i class="fa fa-eye"></i></span>
              </div>
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

  getRegisterModalHtml(preselectedRole = null) {
    const isHostRegistration = preselectedRole === 'host';
    const roleField = isHostRegistration ? 
      `<input type="hidden" id="registerRole" value="host">` :
      `<div class="form-group">
        <label for="registerRole">I want to register as:</label>
        <select id="registerRole" required class="form-select">
          <option value="guest">Guest - Looking for accommodation</option>
          <option value="host">Host - Listing accommodation</option>
        </select>
      </div>`;

    const modalTitle = isHostRegistration ? 'Register as a Host' : 'Register for UniRoomi';
    const submitButtonText = isHostRegistration ? 'Create Host Account' : 'Create Account';

    return `
      <div class="modal-overlay" id="registerModal">
        <div class="modal-container">
          <div class="modal-header">
            <h2>${modalTitle}</h2>
            <button class="modal-close">&times;</button>
          </div>
          
          <form id="registerForm" class="auth-form">
            <div class="error-message" id="registerError" style="display: none;"></div>
            <div class="success-message" id="registerSuccess" style="display: none;"></div>
            
            ${roleField}
            
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
            
            <div class="form-group password-group">
              <label for="registerPassword">Password</label>
              <div class="password-field-wrapper">
                <input type="password" id="registerPassword" required placeholder="Create a password (min. 8 chars, 1 uppercase)">
                <span class="password-toggle" data-target="registerPassword" title="Show/Hide"><i class="fa fa-eye"></i></span>
              </div>
            </div>
            
            <div class="form-group password-group">
              <label for="registerConfirmPassword">Confirm Password</label>
              <div class="password-field-wrapper">
                <input type="password" id="registerConfirmPassword" required placeholder="Confirm your password">
                <span class="password-toggle" data-target="registerConfirmPassword" title="Show/Hide"><i class="fa fa-eye"></i></span>
              </div>
            </div>
            
            ${isHostRegistration ? `
            <div class="host-notice">
              <i class="fa fa-home"></i>
              <p>You're registering as a Host to list accommodation on UniRoomi</p>
            </div>
            ` : ''}
            
            <div class="email-verification-notice">
              <i class="fa fa-envelope"></i>
              <p>A verification email will be sent to your email address for security</p>
            </div>
            
            <button type="submit" class="auth-submit-btn">${submitButtonText}</button>
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

  getVerificationModalHtml() {
    return `
      <div class="modal-overlay" id="verificationModal">
        <div class="modal-container">
          <div class="modal-header">
            <h2>Email Verification Required</h2>
            <button class="modal-close">&times;</button>
          </div>
          
          <div class="verification-content">
            <div class="email-icon">
              <i class="fa fa-envelope"></i>
            </div>
            
            <p class="instruction-text">
              Please check your email and click the verification link to activate your account.
            </p>
            
            <div class="verification-actions">
              <button class="resend-verification theme_btn">Resend Verification Email</button>
              <a href="#" class="back-to-login">← Back to Login</a>
            </div>
            
            <div class="email-note">
              <p><strong>Note:</strong> Check your spam folder if you don't see the email.</p>
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
  window.auth = new FirebaseEmailAuth();
  window.uniroomiAuth = window.auth;
  
  // Make navigation functions globally accessible
  window.auth.makeGlobal();
});

// Global dashboard button visibility management
function manageDashboardButtonVisibility() {
  if (window.innerWidth <= 991) {
    $('.dashboard-nav-item').hide();
    $('.desktop-dashboard-btn').hide();
  } else {
    $('.dashboard-nav-item').show();
    $('.desktop-dashboard-btn').show();
  }
}

// Run on page load
$(document).ready(function() {
  manageDashboardButtonVisibility();
  
  // Update on window resize
  $(window).on('resize', function() {
    manageDashboardButtonVisibility();
  });
});

// Ensure dashboard nav link uses role-based navigation even if anchor is static
(function() {
  function attachDashboardNav() {
    const link = document.querySelector('.dashboard-nav-item a.nav-link');
    if (!link) return;

    // Prevent default and use the JS role-based navigation when available
    link.addEventListener('click', function(e) {
      e.preventDefault();
      if (typeof window.navigateToDashboard === 'function') {
        window.navigateToDashboard();
      } else {
        const href = link.getAttribute('href');
        if (href) window.location.href = href;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachDashboardNav);
  } else {
    attachDashboardNav();
  }
})();
