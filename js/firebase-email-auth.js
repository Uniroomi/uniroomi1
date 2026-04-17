// Firebase Email Authentication for UniRoomi
// Replaces SMS verification with email verification

class FirebaseEmailAuth {
  constructor() {
    // Initialize Firebase with your config
    this.initializeFirebase();
    this.currentUser = null;
    this.currentUserProfile = null; // This will hold the shaped data from Firestore
    this.isAuthenticated = false;
    this.init();
  }

  initializeFirebase() {
    // Firebase is already initialized in index.html
    // Initialize Firebase Auth & Firestore
    this.auth = firebase.auth();
    this.db = firebase.firestore();
  }

  init() {
    // Check for existing session
    this.checkExistingSession();
    // Bind events
    this.bindEvents();
    // Listen for auth state changes
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in, fetch their profile from Firestore.
        const userDocRef = this.db.collection('users').doc(user.uid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
          // If the user document doesn't exist, it's an error.
          // The profile should have been created at registration.
          await this.auth.signOut();
          this.showError(null, 'Your user profile could not be found. Please contact support.');
          return;
        }

        const firestoreData = userDoc.data();

        // ** NEW: Shape the data to match the old localStorage structure **
        // This ensures compatibility with UI components that expect a certain object shape.
        this.currentUserProfile = {
            uid: firestoreData.uid,
            email: firestoreData.email,
            displayName: firestoreData.fullName, // Map Firestore's 'fullName' to 'displayName'
            role: firestoreData.role || 'guest',
            createdAt: firestoreData.createdAt && firestoreData.createdAt.toDate
                ? firestoreData.createdAt.toDate().toISOString()
                : new Date().toISOString(),
            suspended: firestoreData.suspended || false,
            ...firestoreData // Include any other fields from the Firestore document
        };

        const userData = this.currentUserProfile;

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
        this.currentUserProfile = null; // Clear profile on logout
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
      // Sign in user. onAuthStateChanged will handle the rest (fetching profile, etc.).
      await this.auth.signInWithEmailAndPassword(email, password);
      
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

  async getUserProfile(uid) {
      if (!uid) return null;
      try {
          const userDoc = await this.db.collection('users').doc(uid).get();
          if (userDoc.exists) {
              return userDoc.data();
          }
          return null;
      } catch (error) {
          console.error("Error fetching user profile from Firestore:", error);
          return null;
      }
  }

  async updateUserRole(uid, role) {
    if (!uid) return false;
    try {
      await this.db.collection('users').doc(uid).update({ role });
      // Also update the cached profile if it's the current user
      if (this.currentUserProfile && this.currentUserProfile.uid === uid) {
          this.currentUserProfile.role = role;
      }
      return true;
    } catch (error) {
      console.error('Error updating user role in Firestore:', error);
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

    if (formData.email === "uniroomi@proton.me") {
      this.showError($errorDiv, 'This email is reserved for admin access only.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      this.showError($errorDiv, 'Passwords do not match');
      return;
    }

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

    const originalText = $submitBtn.text();
    $submitBtn.prop('disabled', true).text('Creating Account...');

    try {
      // Create user with email and password
      const userCredential = await this.auth.createUserWithEmailAndPassword(
        formData.email, 
        formData.password
      );

      // Update user profile with name in Firebase Auth
      await userCredential.user.updateProfile({
        displayName: `${'''${formData.firstName} ${formData.lastName}'''}`
      });

      // Store additional user data in Firestore
      await this.db.collection('users').doc(userCredential.user.uid).set({
        uid: userCredential.user.uid,
        email: formData.email,
        fullName: `${'''${formData.firstName} ${formData.lastName}'''}`,
        role: formData.role,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await userCredential.user.sendEmailVerification();
      await this.auth.signOut();

      const successMessage = `<strong>Registration successful!</strong><br>
           Please check your email (${formData.email}) for a verification link.`;
      
      $successDiv.html(successMessage).show();

      setTimeout(() => {
        this.closeAllModals();
        this.showLoginModal(formData.email, formData.role === 'host');
      }, 5000);

    } catch (error) {
      let errorMessage = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'An account with this email already exists.';
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
    try {
      this.updateUIForLoggedOutUser();
    } catch (err) {
      console.warn('Could not update UI for logged out user:', err);
    }

    try {
      await this.auth.signOut();
      this.showSuccess(null, 'You have been logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }

    const currentPath = window.location.pathname;
    let target = 'index.html';
    if (currentPath.includes('Campuses/')) {
      target = '../index.html';
    } else if (currentPath.includes('accommodations/')) {
      target = '../../index.html';
    }
    window.location.href = target;
  }

  updateUIForAuthenticatedUser() {
    const $loginBtn = $('.login-btn');
    const $becomeHostBtn = $('.theme_btn_two').not('.logout-btn');
    
    const userRole = this.getUserRole();
    
    $becomeHostBtn.parent().remove();
    $('.become-host').closest('.nav-item').hide();
    
    function updateDashboardButtonVisibility() {
      if (window.innerWidth <= 991) {
        $('.dashboard-nav-item, .desktop-dashboard-btn').hide();
      } else {
        $('.dashboard-nav-item, .desktop-dashboard-btn').show();
      }
    }
    
    updateDashboardButtonVisibility();
    $(window).on('resize', updateDashboardButtonVisibility);
    
    let initials = 'U';
    let avatarHtml = '';
    const user = this.currentUser;
    const userAvatar = (this.currentUserProfile && this.currentUserProfile.avatarUrl) || '';
    
    if (user) {
      if (user.displayName) {
        const nameParts = user.displayName.trim().split(' ');
        if (nameParts.length >= 2) {
          initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        } else if (nameParts.length === 1 && nameParts[0].length > 0) {
          initials = nameParts[0][0].toUpperCase();
        }
      } else if (user.email) {
        initials = user.email.substring(0, 2).toUpperCase();
      }
      
      if (userAvatar) {
        avatarHtml = `<img src="${userAvatar}" alt="Profile Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      }
    }
    
    let becomeHostButton = '';
    if (userRole !== 'host') {
      becomeHostButton = `<li class="nav-item become-host"><span class="nav-link theme_btn_two">Become a Host</span></li>`;
    }
    
    const $userMenu = `
      ${becomeHostButton}
      <li class="nav-item">
        <a href="#" class="nav-link notification-bell" title="Notifications">
          <div class="notification"><svg viewBox="0 0 166 197"><path d="M82.8...Z" class="notification--bellClapper"></path><path d="M146.1...Z" class="notification--bell"></path></svg><span class="notification--num"></span></div>
        </a>
      </li>
      <li class="nav-item desktop-dashboard-btn">
        <button class="button-75" role="button" onclick="navigateToDashboard(); return false;"><span class="text"><i class="fa fa-th-large"></i> Dashboard</span></button>
      </li>
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle profile-avatar" href="#" id="userProfileDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <div class="avatar-wrapper">${avatarHtml || `<div class="avatar-initials">${initials}</div>`}</div>
        </a>
        <div class="dropdown-menu dropdown-menu-right" aria-labelledby="userProfileDropdown">
          <a class="dropdown-item" href="#" onclick="navigateToDashboard(); return false;"><i class="fa fa-user"></i> My Profile</a>
          <div class="dropdown-divider"></div>
          <a class="dropdown-item logout-btn" href="#"><i class="fa fa-sign-out"></i> Log Out</a>
        </div>
      </li>
    `;
    
    $loginBtn.parent().replaceWith($userMenu);
  }

  updateUIForLoggedOutUser() {
    $('.user-menu').parent().remove(); // Clean up old menus
    
    function updateDashboardButtonVisibility() {
      if (window.innerWidth <= 991) {
        $('.dashboard-nav-item, .desktop-dashboard-btn').hide();
      } else {
        $('.dashboard-nav-item, .desktop-dashboard-btn').show();
      }
    }
    updateDashboardButtonVisibility();
    $(window).on('resize', updateDashboardButtonVisibility);
    
    const $navItems = `
      <li class="nav-item become-host"><span class="nav-link theme_btn_two">Become a Host</span></li>
      <li class="nav-item"><span class="nav-link theme_btn login-btn">Login</span></li>
    `;
    // Find a stable element to append to, like the main nav container
    $('.navbar-nav.ml-auto').append($navItems);
  }

  showError($element, message) {
    if ($element) {
      $element.text(message).show();
    } else {
      const errorAlert = $(`<div class="alert alert-danger" style="position: fixed; top: 20px; right: 20px; z-index: 9999;">${message}</div>`);
      $('body').append(errorAlert);
      setTimeout(() => errorAlert.fadeOut(500, () => errorAlert.remove()), 5000);
    }
  }

  showSuccess($element, message) {
     if ($element) {
      $element.html(message).show();
    } else {
      const successAlert = $(`<div class="alert alert-success" style="position: fixed; top: 20px; right: 20px; z-index: 9999;">${message}</div>`);
      $('body').append(successAlert);
      setTimeout(() => successAlert.fadeOut(500, () => successAlert.remove()), 3000);
    }
  }

  navigateToSection(section) {
    const userRole = this.getUserRole();
    let targetDashboard = (userRole === 'host') ? 'dashboard-host.html' : 'dashboard.html';
    let targetPath = targetDashboard;
    
    const currentPath = window.location.pathname;
    if (currentPath.includes('/Campuses/')) {
      targetPath = '../' + targetDashboard;
    } else if (currentPath.includes('/accommodations/')) {
      targetPath = '../../' + targetDashboard;
    }
    
    if (!currentPath.includes(targetDashboard)) {
      window.location.href = `${'''${targetPath}#${section}'''}`;
    } else {
      this.scrollToSection(section);
    }
  }

  scrollToSection(section) {
    // Logic to scroll to a section on a page
  }

  navigateToDashboard() {
    const userRole = this.getUserRole();
    let targetDashboard = (userRole === 'host') ? 'dashboard-host.html' : 'dashboard.html';
    
    const currentPath = window.location.pathname;
    let targetPath = targetDashboard;
    if (currentPath.includes('/Campuses/')) {
      targetPath = '../' + targetDashboard;
    } else if (currentPath.includes('/accommodations/')) {
      targetPath = '../../' + targetDashboard;
    }
    
    if (!currentPath.includes(targetDashboard)) {
      window.location.href = targetPath;
    }
  }

  makeGlobal() {
    window.navigateToSection = this.navigateToSection.bind(this);
    window.scrollToSection = this.scrollToSection.bind(this);
    window.navigateToDashboard = this.navigateToDashboard.bind(this);
  }

  getUserRole() {
    return (this.currentUserProfile && this.currentUserProfile.role) || 'guest';
  }

  isHost() {
    return this.getUserRole() === 'host';
  }

  isGuest() {
    return this.getUserRole() === 'guest';
  }

  // Modal HTML templates...
  getLoginModalHtml(prefilledEmail = null, isHostUser = false) { /* ... */ }
  getRegisterModalHtml(preselectedRole = null) { /* ... */ }
  getVerificationModalHtml() { /* ... */ }
}

$(document).ready(function() {
  window.uniroomiAuth = new FirebaseEmailAuth();
  window.uniroomiAuth.makeGlobal();
});
