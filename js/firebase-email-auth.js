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
    this.bindEvents();
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDocRef = this.db.collection('users').doc(user.uid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
          await this.auth.signOut();
          this.showError(null, 'Your user profile could not be found. Please contact support.');
          return;
        }

        const firestoreData = userDoc.data();

        this.currentUserProfile = {
            uid: firestoreData.uid,
            email: firestoreData.email,
            displayName: firestoreData.fullName,
            role: firestoreData.role || 'guest',
            createdAt: firestoreData.createdAt && firestoreData.createdAt.toDate
                ? firestoreData.createdAt.toDate().toISOString()
                : new Date().toISOString(),
            suspended: firestoreData.suspended || false,
            ...firestoreData
        };

        if (this.currentUserProfile.suspended) {
          await this.auth.signOut();
          this.showError(null, 'Your account has been suspended. Please contact support.');
          return;
        }
        
        this.currentUser = {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: user.displayName
        };
        this.isAuthenticated = true;
        this.updateUIForAuthenticatedUser();
      } else {
        this.currentUser = null;
        this.currentUserProfile = null;
        this.isAuthenticated = false;
        this.updateUIForLoggedOutUser();
      }
    });
  }

  bindEvents() {
    $(document).on('click', '.login-btn', (e) => {
      e.preventDefault();
      this.showLoginModal();
    });

    $(document).on('click', '.register-link', (e) => {
      e.preventDefault();
      this.showRegisterModal();
    });

    $(document).on('click', '.back-to-login', (e) => {
      e.preventDefault();
      this.showLoginModal();
    });

    $(document).on('click', '.modal-close', (e) => {
      e.preventDefault();
      this.closeAllModals();
    });

    $(document).on('click', '.modal-overlay', (e) => {
      if ($(e.target).hasClass('modal-overlay')) {
        this.closeAllModals();
      }
    });

    $(document).on('submit', '#loginForm', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    $(document).on('submit', '#registerForm', (e) => {
      e.preventDefault();
this.handleRegister();
    });

    $(document).on('click', '.logout-btn', (e) => {
      e.preventDefault();
      this.logout();
    });

    $(document).on('click', '.theme_btn_two:not(.logout-btn)', (e) => {
       if(!this.isAuthenticated){
            e.preventDefault();
            this.showRegisterModal('host');
       }
    });

    $(document).on('click', '.password-toggle', function(e) {
      e.preventDefault();
      const targetId = $(this).attr('data-target');
      const $input = $('#' + targetId);
      const type = $input.attr('type');
      $input.attr('type', type === 'password' ? 'text' : 'password');
      const $icon = $(this).find('i');
      $icon.toggleClass('fa-eye fa-eye-slash');
    });

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

    $errorDiv.hide();

    if (!email || !password) {
      this.showError($errorDiv, 'Please fill in all required fields');
      return;
    }

    if (email === "uniroomi@proton.me") {
      this.showError($errorDiv, 'This account is for admin access only. Please use the admin login page.');
      return;
    }

    const originalText = $submitBtn.text();
    $submitBtn.prop('disabled', true).text('Logging in...');

    try {
      await this.auth.signInWithEmailAndPassword(email, password);
      this.closeAllModals();
      this.showSuccess(null, 'Login successful!');
      setTimeout(() => this.redirectToDashboard(), 1000);
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';
      if (error.code) {
          switch (error.code) {
              case 'auth/user-not-found':
                  errorMessage = 'No account found with this email address.';
                  break;
              case 'auth/wrong-password':
                  errorMessage = 'Incorrect password. Please try again.';
                  break;
              case 'auth/user-disabled':
                  errorMessage = 'This account has been disabled.';
                  break;
          }
      }
      this.showError($errorDiv, errorMessage);
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
      role: $('#registerRole').val() || 'guest'
    };
    const $submitBtn = $('#registerForm button[type="submit"]');
    const $errorDiv = $('#registerError');

    $errorDiv.hide();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      this.showError($errorDiv, 'Please fill in all required fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      this.showError($errorDiv, 'Passwords do not match');
      return;
    }

    const originalText = $submitBtn.text();
    $submitBtn.prop('disabled', true).text('Creating Account...');

    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(formData.email, formData.password);
      await userCredential.user.updateProfile({ displayName: `${formData.firstName} ${formData.lastName}` });

      await this.db.collection('users').doc(userCredential.user.uid).set({
        uid: userCredential.user.uid,
        email: formData.email,
        fullName: `${formData.firstName} ${formData.lastName}`,
        role: formData.role,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await userCredential.user.sendEmailVerification();
      await this.auth.signOut();

      this.showSuccess($('#registerSuccess'), `<strong>Registration successful!</strong><br>Please check your email (${formData.email}) for a verification link.`);
      setTimeout(() => {
        this.closeAllModals();
        this.showLoginModal(formData.email);
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

  async logout() {
    await this.auth.signOut();
    window.location.href = 'index.html';
  }

  updateUIForAuthenticatedUser() {
    const userRole = this.getUserRole();
    let initials = 'U';
    if (this.currentUser && this.currentUser.displayName) {
        const nameParts = this.currentUser.displayName.trim().split(' ');
        initials = nameParts.length > 1 ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase() : (nameParts[0][0] || 'U').toUpperCase();
    }

    const avatarHtml = (this.currentUserProfile && this.currentUserProfile.avatarUrl) ? 
        `<img src="${this.currentUserProfile.avatarUrl}" alt="Profile Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : 
        `<div class="avatar-initials">${initials}</div>`;

    let becomeHostButton = '';
    if (userRole !== 'host') {
      becomeHostButton = `<li class="nav-item"><a href="dashboard-host.html" class="nav-link theme_btn_two">Become a Host</a></li>`;
    }

    const $userMenu = `
      ${becomeHostButton}
      <li class="nav-item desktop-dashboard-btn">
        <button class="button-75" role="button" onclick="window.uniroomiAuth.redirectToDashboard(); return false;"><span class="text"><i class="fa fa-th-large"></i> Dashboard</span></button>
      </li>
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle profile-avatar" href="#" id="userProfileDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <div class="avatar-wrapper">${avatarHtml}</div>
        </a>
        <div class="dropdown-menu dropdown-menu-right" aria-labelledby="userProfileDropdown">
          <a class="dropdown-item" href="#" onclick="window.uniroomiAuth.redirectToDashboard(); return false;"><i class="fa fa-user"></i> My Profile</a>
          <a class="dropdown-item logout-btn" href="#"><i class="fa fa-sign-out"></i> Log Out</a>
        </div>
      </li>
    `;

    // Remove login/host buttons and add the user menu.
    $('.login-btn').parent().remove();
    $('a.theme_btn_two').parent().remove(); // Remove any existing "Become a Host" button
    $('.navbar-nav.ml-auto').append($userMenu);
  }

  updateUIForLoggedOutUser() {
    // Remove any authenticated user menus/buttons
    $('.desktop-dashboard-btn').remove();
    $('.nav-item.dropdown').has('#userProfileDropdown').remove();
    $('a.theme_btn_two[href="dashboard-host.html"]').parent().remove(); // remove logged-in "Become a Host" button

    // Ensure the logged-out buttons exist. If not, add them.
    if ($('.login-btn').length === 0) {
        const $loggedOutButtons = `
            <li class="nav-item">
                <a href="#" class="nav-link theme_btn_two">Become a Host</a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link theme_btn login-btn">Login</a>
            </li>
        `;
        $('.navbar-nav.ml-auto').append($loggedOutButtons);
    }
  }


  redirectToDashboard() {
    const userRole = this.getUserRole();
    const targetDashboard = (userRole === 'host') ? 'dashboard-host.html' : 'dashboard.html';
    window.location.href = targetDashboard;
  }

  getUserRole() {
    return (this.currentUserProfile && this.currentUserProfile.role) || 'guest';
  }

  showError($element, message) {
    if ($element) $element.text(message).show();
    else console.error('Auth Error:', message);
  }
  showSuccess($element, message) {
    if ($element) $element.html(message).show();
    else console.log('Auth Success:', message);
  }

  // Modal HTML templates
  getLoginModalHtml(prefilledEmail = '', isHostUser = false) {
    return `
    <div class="modal-overlay" id="loginModal">
      <div class="modal-content">
        <a href="#" class="modal-close"><i class="fa fa-times"></i></a>
        <h2>Welcome Back</h2>
        <p>Login to continue with UniRoomi</p>
        <form id="loginForm">
          <div id="loginError" class="alert alert-danger" style="display:none;"></div>
          <div class="input-group-modal">
            <label for="loginEmail">Email</label>
            <input type="email" id="loginEmail" placeholder="e.g. name@example.com" value="${prefilledEmail}" required>
          </div>
          <div class="input-group-modal">
            <label for="loginPassword">Password</label>
            <div class="password-wrapper">
              <input type="password" id="loginPassword" placeholder="Enter your password" required>
              <a href="#" class="password-toggle" data-target="loginPassword"><i class="fa fa-eye"></i></a>
            </div>
          </div>
          <div class="form-options">
            <label><input type="checkbox" name="remember"> Remember me</label>
            <a href="#" class="forgot-password">Forgot password?</a>
          </div>
          <button type="submit" class="btn-submit">Login</button>
        </form>
        <div class="social-login">
          <span>or</span>
          <div class="social-buttons">
            <button class="btn-google"><i class="fab fa-google"></i> Google</button>
            <button class="btn-facebook"><i class="fab fa-facebook-f"></i> Facebook</button>
          </div>
        </div>
        <p class="register-link-text">Don't have an account? <a href="#" class="register-link">Register</a></p>
      </div>
    </div>
    `;
  }

  getRegisterModalHtml(preselectedRole = null) {
    const isHost = preselectedRole === 'host';
    return `
    <div class="modal-overlay" id="registerModal">
      <div class="modal-content">
        <a href="#" class="modal-close"><i class="fa fa-times"></i></a>
        <h2>Create Account</h2>
        <p>Join UniRoomi to find your perfect student accommodation.</p>
        <form id="registerForm">
          <div id="registerError" class="alert alert-danger" style="display:none;"></div>
          <div id="registerSuccess" class="alert alert-success" style="display:none;"></div>
          <div class="input-group-modal">
            <label for="registerFirstName">First Name</label>
            <input type="text" id="registerFirstName" placeholder="Enter your first name" required>
          </div>
          <div class="input-group-modal">
            <label for="registerLastName">Last Name</label>
            <input type="text" id="registerLastName" placeholder="Enter your last name" required>
          </div>
          <div class="input-group-modal">
            <label for="registerEmail">Email</label>
            <input type="email" id="registerEmail" placeholder="e.g. name@example.com" required>
          </div>
          <div class="input-group-modal">
            <label for="registerPassword">Password</label>
            <div class="password-wrapper">
              <input type="password" id="registerPassword" placeholder="Create a password" required>
              <a href="#" class="password-toggle" data-target="registerPassword"><i class="fa fa-eye"></i></a>
            </div>
          </div>
          <div class="input-group-modal">
            <label for="registerConfirmPassword">Confirm Password</label>
            <div class="password-wrapper">
              <input type="password" id="registerConfirmPassword" placeholder="Confirm your password" required>
              <a href="#" class="password-toggle" data-target="registerConfirmPassword"><i class="fa fa-eye"></i></a>
            </div>
          </div>
          <div class="input-group-modal">
            <label for="registerRole">I am a...</label>
            <select id="registerRole" required>
              <option value="guest" ${!isHost ? 'selected' : ''}>Student</option>
              <option value="host" ${isHost ? 'selected' : ''}>Host</option>
            </select>
          </div>
          <button type="submit" class="btn-submit">Register</button>
        </form>
        <div class="social-login">
          <span>or</span>
          <div class="social-buttons">
            <button class="btn-google"><i class="fab fa-google"></i> Google</button>
            <button class="btn-facebook"><i class="fab fa-facebook-f"></i> Facebook</button>
          </div>
        </div>
        <p class="login-link-text">Already have an account? <a href="#" class="back-to-login">Login</a></p>
      </div>
    </div>
    `;
  }
}

$(document).ready(function() {
  if (typeof firebase === 'undefined') {
      console.error("Firebase SDK not loaded!");
      alert("Firebase is not loaded. The application cannot start.");
      return;
  }
  window.uniroomiAuth = new FirebaseEmailAuth();
});
