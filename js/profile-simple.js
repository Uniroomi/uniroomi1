function getInitials() {
    const name = profileData.name || 'User';
    const nameParts = name.trim().split(' ');
    if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    } else if (nameParts.length === 1) {
        return nameParts[0][0].toUpperCase();
    }
    return 'U';
}

function updateWelcomeMessage(userName) {
    const welcomeElement = document.getElementById('welcomeMessage');
    if (welcomeElement) {
        const hour = new Date().getHours();
        let greeting = 'Welcome';
        
        if (hour < 12) {
            greeting = 'Good morning';
        } else if (hour < 17) {
            greeting = 'Good afternoon';
        } else {
            greeting = 'Good evening';
        }
        
        welcomeElement.textContent = `${greeting}, ${userName}!`;
    }
}

function updateNavbarAvatar() {
    // Update navbar avatar if it exists
    const navbarAvatar = document.querySelector('.profile-avatar img, .mobile-avatar img');
    if (navbarAvatar && profileData.avatarUrl) {
        navbarAvatar.src = profileData.avatarUrl;
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.background = '#28a745';
            break;
        case 'error':
            notification.style.background = '#dc3545';
            break;
        case 'info':
            notification.style.background = '#17a2b8';
            break;
        default:
            notification.style.background = '#6c757d';
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Mobile menu toggle functions
function toggleProfileSection() {
    const profileSection = document.querySelector('.dashboard-profile-section');
    if (profileSection) {
        profileSection.classList.toggle('hidden');
        // Close other sections
        const bookingSection = document.querySelector('.booking-section');
        if (bookingSection) bookingSection.classList.add('hidden');
    }
}

function toggleBookingSection() {
    const bookingSection = document.querySelector('.dashboard-booking-section');
    if (bookingSection) {
        bookingSection.classList.toggle('hidden');
        // Close other sections
        const profileSection = document.querySelector('.dashboard-profile-section');
        if (profileSection) profileSection.classList.add('hidden');
    }
}

function toggleSavedSection() {
    const savedSection = document.querySelector('.dashboard-saved-section');
    if (savedSection) {
        savedSection.classList.toggle('hidden');
        // Close other sections
        const profileSection = document.querySelector('.dashboard-profile-section');
        const bookingSection = document.querySelector('.dashboard-booking-section');
        if (profileSection) profileSection.classList.add('hidden');
        if (bookingSection) bookingSection.classList.add('hidden');
    }
}

function toggleMessageSection() {
    const messageSection = document.querySelector('.dashboard-message-section');
    if (messageSection) {
        messageSection.classList.toggle('hidden');
        // Close other sections
        const profileSection = document.querySelector('.dashboard-profile-section');
        const bookingSection = document.querySelector('.dashboard-booking-section');
        const savedSection = document.querySelector('.dashboard-saved-section');
        if (profileSection) profileSection.classList.add('hidden');
        if (bookingSection) bookingSection.classList.add('hidden');
        if (savedSection) savedSection.classList.add('hidden');
    }
}

// Simple Profile Loader - Direct HTML Injection
let isEditMode = false;
let profileData = {
    name: 'User',
    email: 'user@example.com',
    university: '',
    cellphone: '',
    studentNumber: '',
    gender: '',
    avatarUrl: ''
};

// Function to migrate old shared data to user-specific (DISABLED - Security Issue)
function migrateSharedData() {
    // DISABLED: This function was causing data leakage between users
    // Each user should have their own isolated data
    console.log('Data migration disabled for security - each user has isolated data');
    return;
    
    /* OLD CODE - DISABLED FOR SECURITY
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user) {
            const userSpecificKey = `profileAdditionalData_${user.uid}`;
            const sharedData = localStorage.getItem('profileAdditionalData');
            const userData = localStorage.getItem(userSpecificKey);
            
            // If there's shared data but no user-specific data, migrate it
            if (sharedData && !userData) {
                localStorage.setItem(userSpecificKey, sharedData);
                localStorage.removeItem('profileAdditionalData'); // Clean up shared data
            }
        }
    }
    */
}

function loadProfileDirectly() {
    console.log('Loading profile directly...');
    console.log('Firebase available:', typeof firebase !== 'undefined');
    console.log('Firebase auth available:', typeof firebase !== 'undefined' && firebase.auth);
    
    // SECURITY: Clear any shared data that might cause leakage
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user) {
            console.log('Clearing shared data for user security...');
            localStorage.removeItem('profileAdditionalData');
            localStorage.removeItem('dashboardSavedProperties');
            localStorage.removeItem('accommodationFavorites');
            localStorage.removeItem('bookingFavorites');
            console.log('Shared data cleared for security');
        }
    }
    
    const profileSection = document.querySelector('.dashboard-profile-section');
    if (!profileSection) {
        console.error('Profile section not found');
        return;
    }
    
    // Get actual user data from Firebase or use fallback
    let userName = 'User';
    let userEmail = 'user@example.com';
    let initials = 'U';
    
    console.log('=== DEBUG: User Data Extraction ===');
    
    // Try to get Firebase user data
    if (typeof firebase !== 'undefined' && firebase.auth) {
        console.log('Firebase is available, checking current user...');
        const user = firebase.auth().currentUser;
        console.log('Current user:', user);
        console.log('User email:', user ? user.email : 'No user');
        console.log('User displayName:', user ? user.displayName : 'No display name');
        
        if (user) {
            console.log('Found Firebase user:', user.email);
            userEmail = user.email || userEmail;
            
            // Migrate old shared data if needed
            migrateSharedData();
            
            if (user.displayName) {
                userName = user.displayName;
                console.log('Using displayName:', userName);
                // Generate initials from display name
                const nameParts = user.displayName.trim().split(' ');
                if (nameParts.length >= 2) {
                    initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
                } else if (nameParts.length === 1) {
                    initials = nameParts[0][0].toUpperCase();
                }
            } else {
                // Use email to generate name and initials if no display name
                const emailName = userEmail.split('@')[0];
                userName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
                initials = userEmail.substring(0, 2).toUpperCase();
                console.log('Using email for userName:', userName);
                console.log('Email used:', userEmail);
            }
        } else {
            console.log('No Firebase user found, using fallback data');
        }
    } else {
        console.log('Firebase not available, using fallback data');
    }
    
    console.log('Final userName:', userName);
    console.log('Final userEmail:', userEmail);
    console.log('Final initials:', initials);
    
    // Update profile data
    profileData.name = userName;
    profileData.email = userEmail;
    
    console.log('Using profile data:', { userName, userEmail, initials });
    
    // Load saved additional data from localStorage (user-specific)
    let storageKey = 'profileAdditionalData';
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user) {
            storageKey = `profileAdditionalData_${user.uid}`;
            console.log('Using user-specific storage key:', storageKey);
        }
    }
    
    const savedData = localStorage.getItem(storageKey);
    console.log('Found saved data:', !!savedData);
    
    if (savedData) {
        const additionalData = JSON.parse(savedData);
        console.log('Loading additional data:', additionalData);
        profileData.university = additionalData.university || '';
        profileData.cellphone = additionalData.cellphone || '';
        profileData.studentNumber = additionalData.studentNumber || '';
        profileData.gender = additionalData.gender || '';
        profileData.avatarUrl = additionalData.avatarUrl || '';
        console.log('Avatar URL loaded:', profileData.avatarUrl ? 'Yes' : 'No');
    }
    
    // Render profile based on edit mode
    if (isEditMode) {
        renderEditProfile();
    } else {
        renderViewProfile(initials);
    }
}

function renderViewProfile(initials) {
    // Determine which profile section to target based on screen size and page type
    let profileSection;
    const isHostPage = window.location.pathname.includes('dashboard-host.html');
    
    if (window.innerWidth > 768) {
        // Desktop: Target the desktop grid profile section
        profileSection = document.querySelector('.dashboard-grid .dashboard-profile-section');
        console.log('Desktop mode: targeting desktop profile section');
    } else {
        // Mobile: Target the mobile quick grid profile section
        // First try to find the mobile profile section in quick grid
        profileSection = document.querySelector('.dashboard-quick-grid .dashboard-profile-section');
        
        // If not found, try alternative selectors for host dashboard
        if (!profileSection && isHostPage) {
            profileSection = document.querySelector('.dashboard-quick-grid .dashboard-card.dashboard-profile-section');
        }
        
        // Fallback to any profile section if still not found
        if (!profileSection) {
            profileSection = document.querySelector('.dashboard-profile-section');
        }
        
        console.log('Mobile mode: targeting mobile profile section, found:', !!profileSection);
    }
    
    if (!profileSection) {
        console.error('Profile section not found for current view mode');
        return;
    }
    
    console.log('=== RENDERING PROFILE ===');
    console.log('Profile data:', profileData);
    console.log('Avatar URL exists:', !!profileData.avatarUrl);
    console.log('Avatar URL length:', profileData.avatarUrl ? profileData.avatarUrl.length : 0);
    console.log('Avatar URL starts with data:', profileData.avatarUrl ? profileData.avatarUrl.startsWith('data:') : 'No URL');
    
    // Force image display if avatar URL exists
    let avatarHTML;
    if (profileData.avatarUrl && profileData.avatarUrl.length > 0 && profileData.avatarUrl.startsWith('data:')) {
        const timestamp = Date.now();
        avatarHTML = `<img src="${profileData.avatarUrl}" alt="Profile Avatar" style="width: 100%; height: 100%; object-fit: cover; display: block;" onload="console.log('Avatar image loaded successfully')" onerror="console.error('Avatar image failed to load')">`;
        console.log('Using IMAGE HTML with data URL');
    } else {
        avatarHTML = `<div class="avatar-initials-large">${initials}</div>`;
        console.log('Using INITIALS HTML - no valid avatar URL');
    }
    
    console.log('Final avatar HTML:', avatarHTML.substring(0, 100) + '...');
    
    const profileHTML = `
        <div class="profile-view">
            <div class="profile-header">
                <div class="profile-avatar-section">
                    <div class="profile-avatar-large">
                        ${avatarHTML}
                    </div>
                    <div class="profile-basic-info">
                        <h2>${profileData.name}</h2>
                        <p class="profile-email">${profileData.email}</p>
                        <p class="profile-university">${profileData.university || 'Student • UniRoomi Member'}</p>
                    </div>
                </div>
                <div class="profile-actions">
                    <button class="dashboard-btn" onclick="toggleEditMode()">Edit Profile</button>
                    <button class="dashboard-btn-outline" onclick="changeAvatar()">Change Avatar</button>
                    ${profileData.avatarUrl ? `<button class="dashboard-btn-outline" onclick="removeAvatar()" style="background: #dc3545; color: white; border-color: #dc3545;">Remove Avatar</button>` : ''}
                </div>
            </div>

            <div class="profile-content">
                <div class="profile-section">
                    <h3>Personal Information</h3>
                    <div class="profile-grid">
                        <div class="profile-item">
                            <label>Full Name</label>
                            <p>${profileData.name}</p>
                        </div>
                        <div class="profile-item">
                            <label>Email Address</label>
                            <p>${profileData.email}</p>
                        </div>
                        <div class="profile-item">
                            <label>Gender</label>
                            <p>${profileData.gender || 'Not specified'}</p>
                        </div>
                        <div class="profile-item">
                            <label>University</label>
                            <p>${profileData.university || 'Not specified'}</p>
                        </div>
                        <div class="profile-item">
                            <label>Cellphone Number</label>
                            <p>${profileData.cellphone || 'Not specified'}</p>
                        </div>
                        <div class="profile-item">
                            <label>Student Number</label>
                            <p>${profileData.studentNumber || 'Not specified'}</p>
                        </div>
                        <div class="profile-item">
                            <label>Account Status</label>
                            <p>Active</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    profileSection.innerHTML = profileHTML;
    console.log('Profile view rendered successfully');
    console.log('Avatar URL being used:', profileData.avatarUrl ? 'Yes' : 'No');
    
    // Double-check what was actually rendered and fix if needed
    setTimeout(() => {
        const avatarElement = document.querySelector('.profile-avatar-large img');
        if (avatarElement) {
            console.log('✅ Image element found in DOM');
            console.log('Image src:', avatarElement.src.substring(0, 50) + '...');
            
            // Force image to be visible
            avatarElement.style.display = 'block';
            avatarElement.style.visibility = 'visible';
            
            // Check if image actually loaded
            if (avatarElement.complete && avatarElement.naturalHeight !== 0) {
                console.log('✅ Image loaded successfully');
            } else {
                console.log('⏳ Image still loading...');
                avatarElement.onload = () => console.log('✅ Image loaded after delay');
                avatarElement.onerror = () => console.error('❌ Image failed to load');
            }
        } else {
            console.log('❌ No image element found, checking for initials...');
            const initialsElement = document.querySelector('.avatar-initials-large');
            if (initialsElement) {
                console.log('❌ Initials element found instead of image - this is the problem!');
                console.log('Attempting to fix by forcing image update...');
                
                // Force update by re-rendering
                if (profileData.avatarUrl && profileData.avatarUrl.startsWith('data:')) {
                    const fixedAvatarHTML = `<img src="${profileData.avatarUrl}" alt="Profile Avatar" style="width: 100%; height: 100%; object-fit: cover; display: block;">`;
                    const avatarContainer = document.querySelector('.profile-avatar-large');
                    if (avatarContainer) {
                        avatarContainer.innerHTML = fixedAvatarHTML;
                        console.log('✅ Forced image update applied');
                    }
                }
            } else {
                console.log('❌ Neither image nor initials found');
            }
        }
    }, 100);
    
    // Update the profile completion in the quick card
    updateProfileCompletion();
    
    // Update welcome message based on login history
    console.log('=== About to call updateWelcomeMessage with userName ===');
    console.log('userName being passed:', profileData.name);
    updateWelcomeMessage(profileData.name);
}

// Debug function to check localStorage
function debugLocalStorage() {
    console.log('=== LOCALSTORAGE DEBUG ===');
    let storageKey = 'profileAdditionalData';
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user) {
            storageKey = `profileAdditionalData_${user.uid}`;
        }
    }
    
    const sharedData = localStorage.getItem('profileAdditionalData');
    const userData = localStorage.getItem(storageKey);
    
    console.log('Shared data exists:', !!sharedData);
    console.log('User data exists:', !!userData);
    console.log('Using key:', storageKey);
    
    if (userData) {
        const parsed = JSON.parse(userData);
        console.log('User data avatar URL exists:', !!parsed.avatarUrl);
        console.log('User data avatar URL length:', parsed.avatarUrl ? parsed.avatarUrl.length : 0);
    }
}

function renderEditProfile() {
    // Determine which profile section to target based on screen size and page type
    let profileSection;
    const isHostPage = window.location.pathname.includes('dashboard-host.html');
    
    if (window.innerWidth > 768) {
        // Desktop: Target desktop grid profile section
        profileSection = document.querySelector('.dashboard-grid .dashboard-profile-section');
        console.log('Desktop edit mode: targeting desktop profile section');
    } else {
        // Mobile: Target mobile quick grid profile section
        // First try to find mobile profile section in quick grid
        profileSection = document.querySelector('.dashboard-quick-grid .dashboard-profile-section');
        
        // If not found, try alternative selectors for host dashboard
        if (!profileSection && isHostPage) {
            profileSection = document.querySelector('.dashboard-quick-grid .dashboard-card.dashboard-profile-section');
        }
        
        // Fallback to any profile section if still not found
        if (!profileSection) {
            profileSection = document.querySelector('.dashboard-profile-section');
        }
        
        console.log('Mobile edit mode: targeting mobile profile section, found:', !!profileSection);
    }
    
    if (!profileSection) {
        console.error('Profile section not found for edit mode');
        return;
    }
    
    const profileHTML = `
        <div class="profile-edit">
            <div class="profile-header">
                <h2>Edit Profile</h2>
                <div class="profile-actions">
                    <button class="dashboard-btn-outline" onclick="cancelEdit()">Cancel</button>
                    <button class="dashboard-btn" onclick="saveProfile()">Save Changes</button>
                </div>
            </div>

            <form class="profile-form" onsubmit="saveProfile(event)">
                <div class="profile-section">
                    <h3>Personal Information</h3>
                    <div class="profile-grid">
                        <div class="form-group">
                            <label for="profileName">Full Name</label>
                            <input type="text" id="profileName" name="profileName" value="${profileData.name}" required>
                        </div>
                        <div class="form-group">
                            <label for="profileEmail">Email Address</label>
                            <input type="email" id="profileEmail" name="profileEmail" value="${profileData.email}" disabled>
                        </div>
                        <div class="form-group">
                            <label for="profileGender">Gender</label>
                            <select id="profileGender" name="profileGender" class="form-control">
                                <option value="">Select Gender</option>
                                <option value="Male" ${profileData.gender === 'Male' ? 'selected' : ''}>Male</option>
                                <option value="Female" ${profileData.gender === 'Female' ? 'selected' : ''}>Female</option>
                                <option value="Other" ${profileData.gender === 'Other' ? 'selected' : ''}>Other</option>
                                <option value="Prefer not to say" ${profileData.gender === 'Prefer not to say' ? 'selected' : ''}>Prefer not to say</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="profileUniversity">University</label>
                            <input type="text" id="profileUniversity" name="profileUniversity" value="${profileData.university}" placeholder="Enter your university">
                        </div>
                        <div class="form-group">
                            <label for="profileCellphone">Cellphone Number</label>
                            <input type="tel" id="profileCellphone" name="profileCellphone" value="${profileData.cellphone}" placeholder="Enter your cellphone number">
                        </div>
                        <div class="form-group">
                            <label for="profileStudentNumber">Student Number</label>
                            <input type="text" id="profileStudentNumber" name="profileStudentNumber" value="${profileData.studentNumber}" placeholder="Enter your student number">
                        </div>
                    </div>
                </div>
            </form>
        </div>
    `;
    
    profileSection.innerHTML = profileHTML;
    console.log('Profile edit mode rendered successfully');
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    loadProfileDirectly();
}

function cancelEdit() {
    isEditMode = false;
    loadProfileDirectly();
    showNotification('Changes cancelled', 'info');
}

function saveProfile(event) {
    if (event) {
        event.preventDefault();
    }
    
    // Get form data
    const name = document.getElementById('profileName').value;
    const gender = document.getElementById('profileGender').value;
    const university = document.getElementById('profileUniversity').value;
    const cellphone = document.getElementById('profileCellphone').value;
    const studentNumber = document.getElementById('profileStudentNumber').value;
    
    // Update profile data
    profileData.name = name;
    profileData.gender = gender;
    profileData.university = university;
    profileData.cellphone = cellphone;
    profileData.studentNumber = studentNumber;
    
    // Save to localStorage (user-specific)
    const additionalData = {
        university: university,
        cellphone: cellphone,
        studentNumber: studentNumber,
        gender: gender,
        avatarUrl: profileData.avatarUrl
    };
    
    // Use user-specific key if Firebase user is available
    let storageKey = 'profileAdditionalData';
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user) {
            storageKey = `profileAdditionalData_${user.uid}`;
        }
    }
    
    localStorage.setItem(storageKey, JSON.stringify(additionalData));
    console.log('Profile saved with key:', storageKey);
    
    // Exit edit mode and reload
    isEditMode = false;
    loadProfileDirectly();
    
    showNotification('Profile updated successfully', 'success');
}

function updateProfileCompletion() {
    const profileCard = document.querySelector('.dashboard-quick-card');
    if (profileCard) {
        const strong = profileCard.querySelector('strong');
        if (strong) {
            // Calculate completion based on filled fields
            let filledFields = 2; // Name and email are always filled
            if (profileData.university) filledFields++;
            if (profileData.cellphone) filledFields++;
            if (profileData.studentNumber) filledFields++;
            if (profileData.avatarUrl) filledFields++;
            
            const completion = Math.round((filledFields / 6) * 100);
            strong.textContent = `${completion}% Complete`;
        }
    }
}

function changeAvatar() {
    // Create file input for avatar upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type and size
            if (!file.type.startsWith('image/')) {
                showNotification('Please select an image file', 'error');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showNotification('Image size should be less than 5MB', 'error');
                return;
            }
            
            // Show loading indicator for mobile
            showNotification('Processing image...', 'info');
            
            try {
                // Open cropper and get cropped image
                console.log('Opening cropper with file:', file.name);
                const croppedImage = await avatarCropper.openCropper(file);
                console.log('Cropped image received, length:', croppedImage.length);
                
                // Update profile data immediately
                profileData.avatarUrl = croppedImage;
                console.log('Profile data updated with new avatar');
                
                // Save to localStorage (user-specific)
                let storageKey = 'profileAdditionalData';
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    const user = firebase.auth().currentUser;
                    if (user) {
                        storageKey = `profileAdditionalData_${user.uid}`;
                    }
                }
                
                const additionalData = {
                    university: profileData.university,
                    cellphone: profileData.cellphone,
                    studentNumber: profileData.studentNumber,
                    avatarUrl: croppedImage
                };
                
                localStorage.setItem(storageKey, JSON.stringify(additionalData));
                console.log('Avatar saved to localStorage with key:', storageKey);
                
                // Force immediate profile refresh
                console.log('Forcing immediate profile refresh...');
                renderViewProfile(getInitials());
                
                // Also update navbar avatar
                updateNavbarAvatar();
                
                // Also update profile completion
                updateProfileCompletion();
                
                showNotification('Avatar updated successfully', 'success');
            } catch (error) {
                console.error('Error in avatar cropping:', error);
                
                // Fallback: try to use the original image without cropping
                console.log('Attempting fallback - using original image without cropping...');
                try {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const originalImage = e.target.result;
                        profileData.avatarUrl = originalImage;
                        
                        // Save to localStorage
                        let storageKey = 'profileAdditionalData';
                        if (typeof firebase !== 'undefined' && firebase.auth) {
                            const user = firebase.auth().currentUser;
                            if (user) {
                                storageKey = `profileAdditionalData_${user.uid}`;
                            }
                        }
                        
                        const additionalData = {
                            university: profileData.university,
                            cellphone: profileData.cellphone,
                            studentNumber: profileData.studentNumber,
                            avatarUrl: originalImage
                        };
                        
                        localStorage.setItem(storageKey, JSON.stringify(additionalData));
                        console.log('Fallback: Original avatar saved');
                        
                        renderViewProfile(getInitials());
                        updateProfileCompletion();
                        updateNavbarAvatar();
                        
                        showNotification('Avatar updated (without cropping)', 'success');
                    };
                    
                    reader.onerror = () => {
                        showNotification('Failed to process image', 'error');
                    };
                    
                    reader.readAsDataURL(file);
                } catch (fallbackError) {
                    console.error('Fallback also failed:', fallbackError);
                    showNotification('Failed to process image', 'error');
                }
            }
        }
    };
    
    // Trigger file selection with better mobile support
    document.body.appendChild(input);
    
    // Handle both click and touch events for mobile compatibility
    const triggerFileSelect = () => {
        input.click();
    };
    
    // For mobile devices, ensure the input is properly triggered
    if ('ontouchstart' in window) {
        // Touch device
        input.addEventListener('touchend', triggerFileSelect);
        setTimeout(triggerFileSelect, 100); // Small delay for touch devices
    } else {
        // Desktop
        triggerFileSelect();
    }
    
    // Clean up after selection
    setTimeout(() => {
        if (document.body.contains(input)) {
            document.body.removeChild(input);
        }
    }, 1000);
}

function removeAvatar() {
    showRemoveAvatarModal();
}

function showRemoveAvatarModal() {
    // Create modal HTML
    const modalHTML = `
        <div id="removeAvatarModal" class="dashboard-modal-overlay" style="display: flex;">
            <div class="dashboard-modal-content remove-avatar-modal">
                <div class="dashboard-modal-header">
                    <h3>Remove Avatar</h3>
                    <button class="dashboard-close-btn" onclick="closeRemoveAvatarModal()">&times;</button>
                </div>
                <div class="dashboard-modal-body">
                    <div class="remove-avatar-content">
                        <div class="remove-avatar-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="8" y1="12" x2="16" y2="12"></line>
                                <line x1="12" y1="8" x2="12" y2="16"></line>
                            </svg>
                        </div>
                        <div class="remove-avatar-text">
                            <h4>Are you sure you want to remove your avatar?</h4>
                            <p>This will remove your profile picture and show your initials instead. You can always upload a new avatar later.</p>
                        </div>
                    </div>
                </div>
                <div class="dashboard-modal-footer">
                    <button class="dashboard-btn-outline" onclick="closeRemoveAvatarModal()">Cancel</button>
                    <button class="dashboard-btn" onclick="confirmRemoveAvatar()" style="background: #dc3545; border-color: #dc3545;">Remove Avatar</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add modal styles if not already present
    if (!document.getElementById('removeAvatarStyles')) {
        const styles = `
            <style id="removeAvatarStyles">
                .remove-avatar-modal {
                    max-width: 400px;
                }
                
                .remove-avatar-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 20px;
                    padding: 20px 0;
                }
                
                .remove-avatar-icon {
                    width: 64px;
                    height: 64px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #fef2f2;
                    border-radius: 50%;
                    margin-bottom: 10px;
                }
                
                .remove-avatar-text h4 {
                    margin: 0 0 10px 0;
                    color: var(--text);
                    font-size: 18px;
                    font-weight: 600;
                }
                
                .remove-avatar-text p {
                    margin: 0;
                    color: var(--muted);
                    font-size: 14px;
                    line-height: 1.5;
                }
                
                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-30px) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                .remove-avatar-modal {
                    animation: modalSlideIn 0.3s ease-out;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

function closeRemoveAvatarModal() {
    const modal = document.getElementById('removeAvatarModal');
    if (modal) {
        modal.remove();
    }
}

function confirmRemoveAvatar() {
    // Clear avatar from profile data
    profileData.avatarUrl = '';
    console.log('Avatar removed from profile data');
    
    // Save to localStorage (user-specific)
    let storageKey = 'profileAdditionalData';
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user) {
            storageKey = `profileAdditionalData_${user.uid}`;
        }
    }
    
    const additionalData = {
        university: profileData.university,
        cellphone: profileData.cellphone,
        studentNumber: profileData.studentNumber,
        avatarUrl: '' // Clear avatar
    };
    
    localStorage.setItem(storageKey, JSON.stringify(additionalData));
    console.log('Avatar removed from localStorage with key:', storageKey);
    
    // Close modal first
    closeRemoveAvatarModal();
    
    // Force immediate profile refresh
    renderViewProfile(getInitials());
    updateProfileCompletion();
    updateNavbarAvatar();
    
    showNotification('Avatar removed successfully', 'success');
}

function updateNavbarAvatar() {
    // Update navbar avatar if user is logged in
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user) {
            const storageKey = `profileAdditionalData_${user.uid}`;
            const userData = localStorage.getItem(storageKey);
            
            if (userData) {
                const additionalData = JSON.parse(userData);
                const userAvatar = additionalData.avatarUrl || '';
                
                // Update the navbar avatar
                const avatarWrapper = document.querySelector('.avatar-wrapper');
                if (avatarWrapper) {
                    if (userAvatar && userAvatar.length > 0) {
                        avatarWrapper.innerHTML = `<img src="${userAvatar}" alt="Profile Avatar" style="width: 100%; height: 100%; object-fit: cover;">`;
                    } else {
                        // Show initials if no avatar
                        let initials = 'U';
                        if (user.displayName) {
                            const nameParts = user.displayName.trim().split(' ');
                            if (nameParts.length >= 2) {
                                initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
                            } else if (nameParts.length === 1) {
                                initials = nameParts[0][0].toUpperCase();
                            }
                        } else if (user.email) {
                            initials = user.email.substring(0, 2).toUpperCase();
                        }
                        avatarWrapper.innerHTML = `<div class="avatar-initials">${initials}</div>`;
                    }
                }
            }
        }
    }
}

function getInitials() {
    if (profileData.name) {
        const nameParts = profileData.name.trim().split(' ');
        if (nameParts.length >= 2) {
            return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        } else if (nameParts.length === 1) {
            return nameParts[0][0].toUpperCase();
        }
    }
    return profileData.email.substring(0, 2).toUpperCase();
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `dashboard-notification dashboard-notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Wait for Firebase and user to be ready
function waitForUserAndLoadProfile() {
    console.log('Waiting for Firebase user...');
    
    // Check if Firebase is ready
    if (typeof firebase !== 'undefined' && firebase.auth) {
        console.log('Firebase is ready');
        
        // Set up auth state listener
        firebase.auth().onAuthStateChanged((user) => {
            console.log('Auth state changed, user:', user ? user.email : 'No user');
            if (user) {
                // User is logged in, load profile
                setTimeout(() => {
                    loadProfileDirectly();
                }, 500);
            } else {
                console.log('User not logged in');
            }
        });
    } else {
        console.log('Firebase not ready, retrying in 1 second...');
        setTimeout(() => {
            waitForUserAndLoadProfile();
        }, 1000);
    }
}

// Simple initialization - wait for DOM and load
function initSimpleProfile() {
    console.log('Initializing simple profile...');
    
    // Wait a bit for everything to load
    setTimeout(() => {
        loadProfileDirectly();
    }, 500);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForUserAndLoadProfile);
} else {
    waitForUserAndLoadProfile();
}

// Also try as fallback
window.addEventListener('load', () => {
    setTimeout(() => {
        const profileSection = document.querySelector('.dashboard-profile-section');
        if (profileSection && profileSection.innerHTML.includes('Loading profile')) {
            console.log('Fallback: Profile still loading, forcing load');
            loadProfileDirectly();
        }
    }, 2000);
});

// ==================== MESSAGING SYSTEM ====================

// Messaging functionality
class UniRoomiMessaging {
    constructor() {
        this.messagesKey = 'uniroomi_messages';
        this.welcomeMessageSentKey = 'uniroomi_welcome_sent';
        this.isInitialized = false;
        this.initializationAttempts = 0;
        this.maxInitializationAttempts = 3;
    }

    // Initialize messaging system for current user
    initialize() {
        // Prevent multiple initializations
        if (this.isInitialized) {
            console.log('Messaging already initialized, skipping...');
            return;
        }

        this.initializationAttempts++;
        if (this.initializationAttempts > this.maxInitializationAttempts) {
            console.log('Max initialization attempts reached, stopping...');
            return;
        }

        console.log(`Initializing messaging system (attempt ${this.initializationAttempts})...`);

        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (user) {
                this.userMessagesKey = `${this.messagesKey}_${user.uid}`;
                this.userWelcomeKey = `${this.welcomeMessageSentKey}_${user.uid}`;
                this.checkAndSendWelcomeMessage(user);
                this.isInitialized = true;
                console.log('Messaging system initialized successfully');
            } else {
                console.log('User not logged in, will retry...');
                setTimeout(() => this.initialize(), 1000);
            }
        } else {
            console.log('Firebase not ready, will retry...');
            setTimeout(() => this.initialize(), 1000);
        }
    }

    // Check if welcome message should be sent
    checkAndSendWelcomeMessage(user) {
        const welcomeSent = localStorage.getItem(this.userWelcomeKey);
        
        // Clean up any duplicate welcome messages first
        this.cleanupDuplicateWelcomeMessages();
        
        if (!welcomeSent) {
            // First time user - send welcome message
            console.log('First time user detected, sending welcome message');
            this.sendWelcomeMessage(user);
            localStorage.setItem(this.userWelcomeKey, 'true');
            console.log('Welcome message sent and marked as sent');
        } else {
            // Existing user - load messages
            console.log('Returning user, loading existing messages');
            this.loadMessages();
        }
    }

    // Clean up duplicate welcome messages
    cleanupDuplicateWelcomeMessages() {
        const messages = this.getMessages();
        const welcomeMessages = messages.filter(m => m.type === 'welcome');
        
        if (welcomeMessages.length > 1) {
            console.log(`Found ${welcomeMessages.length} duplicate welcome messages, cleaning up...`);
            
            // Keep only the first (oldest) welcome message
            const uniqueMessages = messages.filter(m => m.type !== 'welcome');
            const oldestWelcome = welcomeMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0];
            
            if (oldestWelcome) {
                uniqueMessages.unshift(oldestWelcome);
            }
            
            localStorage.setItem(this.userMessagesKey, JSON.stringify(uniqueMessages));
            console.log('Duplicate welcome messages cleaned up');
        }
    }

    // Send welcome message
    sendWelcomeMessage(user) {
        // Check if welcome message already exists to prevent duplicates
        const existingMessages = this.getMessages();
        const existingWelcome = existingMessages.find(m => m.type === 'welcome');
        
        if (existingWelcome) {
            console.log('Welcome message already exists, not sending duplicate');
            return;
        }

        const welcomeMessage = {
            id: Date.now(),
            sender: 'UniRoomi Team',
            senderAvatar: '🏫',
            subject: 'Welcome to UniRoomi!',
            message: `Hi ${user.displayName || user.email.split('@')[0]}! 👋\n\nWelcome to UniRoomi - your gateway to the perfect university accommodation experience!\n\nWe're excited to have you join our community of students finding their ideal living spaces. Whether you're looking for a cozy room near campus or a modern apartment with all amenities, we're here to help you find your perfect match.\n\n🎓 What you can do:\n• Browse verified accommodations\n• Connect with property managers\n• Book your dream student housing\n• Manage your bookings seamlessly\n\n📚 Need help? Our support team is always here to assist you.\n\nHappy house hunting!\n\nBest regards,\nThe UniRoomi Team`,
            timestamp: new Date().toISOString(),
            isRead: false,
            type: 'welcome',
            priority: 'high'
        };

        this.saveMessage(welcomeMessage);
        this.displayMessage(welcomeMessage);
        this.updateMessageCount();
        console.log('Welcome message created and displayed');
    }

    // Save message to localStorage
    saveMessage(message) {
        const messages = this.getMessages();
        messages.unshift(message); // Add to beginning
        localStorage.setItem(this.userMessagesKey, JSON.stringify(messages));
    }

    // Get all messages for current user
    getMessages() {
        const messages = localStorage.getItem(this.userMessagesKey);
        return messages ? JSON.parse(messages) : [];
    }

    // Load and display all messages
    loadMessages() {
        const messages = this.getMessages();
        
        // Determine which messages container to target based on screen size
        let messageContainer;
        if (window.innerWidth > 768) {
            // Desktop: Target the desktop grid messages container
            messageContainer = document.querySelector('.dashboard-grid .dashboard-messages-container');
        } else {
            // Mobile: Target the mobile quick grid messages container
            messageContainer = document.querySelector('.dashboard-quick-grid .dashboard-messages-container');
        }
        
        console.log('Loading messages into container:', messageContainer ? 'Found' : 'Not found');
        
        if (messageContainer) {
            messageContainer.innerHTML = '';
            messages.forEach(message => {
                this.displayMessage(message);
            });
            this.updateMessageCount();
        }
    }

    // Display a single message
    displayMessage(message) {
        // Determine which messages container to target based on screen size
        let messageContainer;
        if (window.innerWidth > 768) {
            // Desktop: Target the desktop grid messages container
            messageContainer = document.querySelector('.dashboard-grid .dashboard-messages-container');
        } else {
            // Mobile: Target the mobile quick grid messages container
            messageContainer = document.querySelector('.dashboard-quick-grid .dashboard-messages-container');
        }
        
        if (!messageContainer) {
            console.log('Message container not found');
            return;
        }

        // Remove loading message if it exists
        const loadingMessage = messageContainer.querySelector('.loading-messages');
        if (loadingMessage) {
            loadingMessage.remove();
        }

        const messageElement = document.createElement('div');
        messageElement.className = `dashboard-message ${message.isRead ? 'read' : 'unread'} ${message.type}`;
        messageElement.innerHTML = `
            <div class="message-header">
                <div class="message-sender">
                    <span class="sender-avatar">${message.senderAvatar || '📧'}</span>
                    <strong>${message.sender}</strong>
                    ${message.priority === 'high' ? '<span class="priority-badge">Important</span>' : ''}
                </div>
                <div class="message-time">${this.formatTime(message.timestamp)}</div>
            </div>
            <div class="message-subject">${message.subject}</div>
            <div class="message-content">${message.message.replace(/\n/g, '<br>')}</div>
            <div class="message-actions">
                <button class="message-action-btn" onclick="uniroomiMessaging.markAsRead(${message.id})">
                    ${message.isRead ? '✓ Read' : 'Mark as Read'}
                </button>
                <button class="message-action-btn" onclick="uniroomiMessaging.deleteMessage(${message.id})">
                    Delete
                </button>
            </div>
        `;

        messageContainer.appendChild(messageElement);
    }

    // Create message container if it doesn't exist
    createMessageContainer() {
        const dashboardMessages = document.querySelector('.dashboard-card:has(h2:contains("Messages"))');
        if (dashboardMessages) {
            // Remove any existing static messages
            const existingMessages = dashboardMessages.querySelectorAll('.dashboard-message');
            existingMessages.forEach(msg => msg.remove());
            
            // Create and add the container
            const container = document.createElement('div');
            container.className = 'dashboard-messages-container';
            dashboardMessages.appendChild(container);
        }
    }

    // Format timestamp
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    // Mark message as read
    markAsRead(messageId) {
        const messages = this.getMessages();
        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
            messages[messageIndex].isRead = true;
            localStorage.setItem(this.userMessagesKey, JSON.stringify(messages));
            this.loadMessages(); // Reload to update display
        }
    }

    // Delete message
    deleteMessage(messageId) {
        const messages = this.getMessages();
        const filteredMessages = messages.filter(m => m.id !== messageId);
        localStorage.setItem(this.userMessagesKey, JSON.stringify(filteredMessages));
        this.loadMessages(); // Reload to update display
    }

    // Update message count in dashboard
    updateMessageCount() {
        const messages = this.getMessages();
        const unreadCount = messages.filter(m => !m.isRead).length;
        
        // Update dashboard quick card with specific ID
        const messageCountElement = document.getElementById('message-count');
        if (messageCountElement) {
            messageCountElement.textContent = unreadCount > 0 ? `${unreadCount} New` : '0 New';
        }

        // Update mobile menu notification
        const notificationNum = document.querySelector('.notification--num');
        if (notificationNum) {
            notificationNum.textContent = unreadCount > 0 ? unreadCount.toString() : '';
            notificationNum.style.display = unreadCount > 0 ? 'block' : 'none';
        }

        console.log(`Message count updated: ${unreadCount} unread messages`);
    }
}

// Initialize messaging system
const uniroomiMessaging = new UniRoomiMessaging();

// Single messaging initialization - only call once
function initializeMessaging() {
    console.log('Initializing UniRoomi messaging system...');
    uniroomiMessaging.initialize();
}

// Initialize messaging when user is logged in - use single listener
if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // Wait a bit for everything to load, then initialize once
            setTimeout(initializeMessaging, 1500);
            setTimeout(initializeBookings, 2000);
        }
    });
}

// ==================== BOOKING SYSTEM ====================

// Booking functionality
class UniRoomiBookings {
    constructor() {
        this.bookingsKey = 'uniroomi_bookings';
        this.isInitialized = false;
    }

    // Initialize booking system for current user
    initialize() {
        if (this.isInitialized) {
            console.log('Bookings already initialized, skipping...');
            return;
        }

        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (user) {
                this.userBookingsKey = `${this.bookingsKey}_${user.uid}`;
                this.loadBookings();
                this.isInitialized = true;
                console.log('Booking system initialized successfully');
            }
        }
    }

    // Create a new booking request
    createBookingRequest(propertyData) {
        const booking = {
            id: Date.now(),
            propertyTitle: propertyData.title,
            propertyLocation: propertyData.location,
            roomType: propertyData.roomType,
            price: propertyData.price,
            hostName: propertyData.hostName,
            hostAvatar: propertyData.hostAvatar,
            status: 'pending',
            requestedAt: new Date().toISOString(),
            checkInDate: this.calculateCheckInDate(),
            description: propertyData.description,
            amenities: propertyData.amenities,
            guestCapacity: propertyData.guestCapacity,
            universityDistance: propertyData.universityDistance
        };

        this.saveBooking(booking);
        this.displayBooking(booking);
        this.updateBookingCount();
        this.showBookingConfirmation(booking);

        console.log('Booking request created:', booking);
        return booking;
    }

    // Calculate check-in date (typically 1-2 weeks from now)
    calculateCheckInDate() {
        try {
            const today = new Date();
            console.log('Today is:', today.toDateString());
            
            // Calculate check-in date as 14 days from today
            const checkIn = new Date(today);
            checkIn.setDate(today.getDate() + 14);
            
            const dateString = checkIn.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            console.log('Calculated check-in date (14 days from today):', dateString);
            console.log('Check-in date will be:', checkIn.toDateString());
            
            return dateString;
        } catch (error) {
            console.error('Error calculating check-in date:', error);
            // Return a fallback date (14 days from today)
            const fallbackDate = new Date();
            fallbackDate.setDate(fallbackDate.getDate() + 14);
            return fallbackDate.toISOString().split('T')[0];
        }
    }

    // Save booking to localStorage
    saveBooking(booking) {
        const bookings = this.getBookings();
        bookings.unshift(booking); // Add to beginning
        localStorage.setItem(this.userBookingsKey, JSON.stringify(bookings));
    }

    // Get all bookings for current user
    getBookings() {
        const bookings = localStorage.getItem(this.userBookingsKey);
        if (!bookings) return [];
        
        try {
            const parsedBookings = JSON.parse(bookings);
            console.log('Loaded bookings:', parsedBookings.length, 'bookings found');
            
            // Fix any bookings with undefined or old check-in dates
            return parsedBookings.map(booking => {
                const needsUpdate = !booking.checkInDate || 
                                  booking.checkInDate === 'undefined' || 
                                  booking.checkInDate === undefined ||
                                  this.isDateOld(booking.checkInDate);
                
                if (needsUpdate) {
                    const oldDate = booking.checkInDate;
                    booking.checkInDate = this.calculateCheckInDate();
                    console.log(`Fixed check-in date for booking ${booking.id}: ${oldDate} → ${booking.checkInDate}`);
                }
                return booking;
            });
        } catch (error) {
            console.error('Error parsing bookings:', error);
            return [];
        }
    }

    // Check if a date is old (more than 10 days from creation or in the past)
    isDateOld(dateString) {
        try {
            if (!dateString) return true;
            
            const checkInDate = new Date(dateString);
            const today = new Date();
            const daysDifference = Math.floor((checkInDate - today) / (1000 * 60 * 60 * 24));
            
            // If date is in the past or more than 20 days in future, consider it old
            return daysDifference < 0 || daysDifference > 20;
        } catch (error) {
            console.error('Error checking date age:', error);
            return true; // Consider old if there's an error
        }
    }

    // Load and display all bookings
    loadBookings() {
        const bookings = this.getBookings();
        
        // Save corrected bookings back to localStorage
        localStorage.setItem(this.userBookingsKey, JSON.stringify(bookings));
        
        // Determine which booking container to target based on screen size
        let bookingContainer;
        if (window.innerWidth > 768) {
            // Desktop: Target the desktop grid booking container
            bookingContainer = document.querySelector('.dashboard-grid .dashboard-bookings-container');
        } else {
            // Mobile: Target the mobile quick grid booking container
            bookingContainer = document.querySelector('.dashboard-quick-grid .dashboard-bookings-container');
        }
        
        console.log('Loading bookings into container:', bookingContainer ? 'Found' : 'Not found');
        
        if (bookingContainer) {
            bookingContainer.innerHTML = '';
            
            if (bookings.length === 0) {
                bookingContainer.innerHTML = '<div class="no-bookings">No bookings yet. Start exploring properties!</div>';
            } else {
                bookings.forEach(booking => {
                    this.displayBooking(booking);
                });
            }
            
            this.updateBookingCount();
        }

        // Also load saved properties
        this.loadSavedProperties();
    }

    // Load and display saved properties
    loadSavedProperties() {
        // Use user-specific storage key
        let savedPropertiesKey = 'dashboardSavedProperties';
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (user) {
                savedPropertiesKey = `dashboardSavedProperties_${user.uid}`;
            }
        }
        
        const savedProperties = JSON.parse(localStorage.getItem(savedPropertiesKey) || '[]');
        
        // Determine which saved properties container to target based on screen size
        let savedContainer;
        if (window.innerWidth > 768) {
            // Desktop: Target the desktop grid saved container
            savedContainer = document.querySelector('.dashboard-grid .dashboard-saved-grid');
        } else {
            // Mobile: Target the mobile quick grid saved container
            savedContainer = document.querySelector('.dashboard-quick-grid .dashboard-saved-grid');
        }
        
        console.log('Loading saved properties into container:', savedContainer ? 'Found' : 'Not found');
        
        if (savedContainer) {
            savedContainer.innerHTML = '';
            
            if (savedProperties.length === 0) {
                savedContainer.innerHTML = '<div class="no-saved-properties">No saved properties yet. Click the heart icon on listings to save them!</div>';
            } else {
                savedProperties.forEach(property => {
                    this.displaySavedProperty(property);
                });
            }
            
            // Update saved properties count
            this.updateSavedPropertiesCount(savedProperties.length);
        }
    }

    // Display a single saved property
    displaySavedProperty(property) {
        // Determine which saved properties container to target based on screen size
        let savedContainer;
        if (window.innerWidth > 768) {
            // Desktop: Target the desktop grid saved container
            savedContainer = document.querySelector('.dashboard-grid .dashboard-saved-grid');
        } else {
            // Mobile: Target the mobile quick grid saved container
            savedContainer = document.querySelector('.dashboard-quick-grid .dashboard-saved-grid');
        }
        
        if (!savedContainer) return;
        
        const propertyElement = document.createElement('div');
        propertyElement.className = 'dashboard-property';
        propertyElement.innerHTML = `
            <div class="property-image" style="background-image: url('${property.image}');">
                <div class="property-overlay">
                    <button class="remove-saved-btn" onclick="uniroomiBookings.removeSavedProperty('${property.id}')" title="Remove from saved">
                        <i class="fa fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="property-content">
                <strong>${property.title}</strong>
                <p>${property.location}</p>
                <button class="dashboard-btn-outline" onclick="window.location.href='${property.link}'" style="width:100%;margin-top:8px">
                    View Property
                </button>
            </div>
        `;
        
        savedContainer.appendChild(propertyElement);
    }

    // Remove saved property
    removeSavedProperty(propertyId) {
        // Use user-specific storage key
        let savedPropertiesKey = 'dashboardSavedProperties';
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (user) {
                savedPropertiesKey = `dashboardSavedProperties_${user.uid}`;
            }
        }
        
        const savedProperties = JSON.parse(localStorage.getItem(savedPropertiesKey) || '[]');
        const property = savedProperties.find(p => p.id === propertyId);
        
        if (property) {
            this.showRemovePropertyModal(property);
        }
    }

    // Show remove property confirmation modal
    showRemovePropertyModal(property) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'remove-property-modal-overlay';
        modalOverlay.innerHTML = `
            <div class="remove-property-modal-container">
                <div class="remove-property-modal-header">
                    <div class="remove-property-modal-icon">
                        <i class="fa fa-heart-broken"></i>
                    </div>
                    <h3>Remove Saved Property</h3>
                </div>
                <div class="remove-property-modal-body">
                    <p>Are you sure you want to remove this property from your saved items?</p>
                    <div class="remove-property-details">
                        <div class="detail-item">
                            <strong>Property:</strong> ${property.title}
                        </div>
                        <div class="detail-item">
                            <strong>Location:</strong> ${property.location}
                        </div>
                    </div>
                    <p class="warning-text"><i class="fa fa-info-circle"></i> You can always save this property again later by clicking the heart icon.</p>
                </div>
                <div class="remove-property-modal-footer">
                    <button class="remove-property-modal-btn keep-btn" onclick="this.closest('.remove-property-modal-overlay').remove()">
                        <i class="fa fa-arrow-left"></i> Keep Property
                    </button>
                    <button class="remove-property-modal-btn remove-btn" onclick="uniroomiBookings.confirmRemoveProperty('${property.id}')">
                        <i class="fa fa-trash"></i> Remove Property
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        
        // Add entrance animation
        setTimeout(() => {
            modalOverlay.classList.add('show');
        }, 10);
        
        // Close on overlay click
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('show');
                setTimeout(() => modalOverlay.remove(), 300);
            }
        });
    }

    // Confirm remove property action
    confirmRemoveProperty(propertyId) {
        // Use user-specific storage key
        let savedPropertiesKey = 'dashboardSavedProperties';
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (user) {
                savedPropertiesKey = `dashboardSavedProperties_${user.uid}`;
            }
        }
        
        const savedProperties = JSON.parse(localStorage.getItem(savedPropertiesKey) || '[]');
        const updatedProperties = savedProperties.filter(p => p.id !== propertyId);
        localStorage.setItem(savedPropertiesKey, JSON.stringify(updatedProperties));
        
        // Also update accommodation favorites (user-specific)
        let accommodationFavoritesKey = 'accommodationFavorites';
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (user) {
                accommodationFavoritesKey = `accommodationFavorites_${user.uid}`;
            }
        }
        const accommodationFavorites = JSON.parse(localStorage.getItem(accommodationFavoritesKey) || '{}');
        accommodationFavorites[propertyId] = false;
        localStorage.setItem(accommodationFavoritesKey, JSON.stringify(accommodationFavorites));
        
        // Close modal
        const modal = document.querySelector('.remove-property-modal-overlay');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
        
        // Reload saved properties
        this.loadSavedProperties();
        
        // Show notification
        this.showNotification('Property removed from saved items', 'info');
    }

    // Update saved properties count
    updateSavedPropertiesCount(count) {
        const savedCards = document.querySelectorAll('.dashboard-quick-card');
        savedCards.forEach(card => {
            const icon = card.querySelector('.dashboard-icon');
            if (icon && icon.textContent.includes('🔖')) {
                const strongElement = card.querySelector('strong');
                if (strongElement) {
                    strongElement.textContent = count > 0 ? `${count} Saved` : '0 Saved';
                }
            }
        });
    }

    // Display a single booking
    displayBooking(booking) {
        // Determine which booking container to target based on screen size
        let bookingContainer;
        if (window.innerWidth > 768) {
            // Desktop: Target the desktop grid booking container
            bookingContainer = document.querySelector('.dashboard-grid .dashboard-bookings-container');
        } else {
            // Mobile: Target the mobile quick grid booking container
            bookingContainer = document.querySelector('.dashboard-quick-grid .dashboard-bookings-container');
        }
        
        if (!bookingContainer) {
            console.log('Booking container not found');
            return;
        }

        // Remove loading message if it exists
        const loadingMessage = bookingContainer.querySelector('.loading-bookings');
        if (loadingMessage) {
            loadingMessage.remove();
        }

        const bookingElement = document.createElement('div');
        bookingElement.className = `dashboard-booking ${booking.status}`;
        bookingElement.innerHTML = `
            <div class="favorite-heart" onclick="uniroomiBookings.toggleFavorite(${booking.id})" title="Add to favorites">
                <i class="fa fa-heart"></i>
            </div>
            <div class="booking-content">
                <div class="booking-main">
                    <div class="booking-property">
                        <strong>${booking.propertyTitle}</strong>
                        <p>${booking.propertyLocation}</p>
                        <div class="booking-details">
                            <span class="room-type">${booking.roomType}</span>
                            <span class="price">${booking.price}</span>
                        </div>
                    </div>
                    <div class="booking-status">
                        <span class="status-badge ${booking.status}">${this.formatStatus(booking.status)}</span>
                    </div>
                </div>
                <div class="booking-host">
                    <div class="host-info">
                        <div class="host-avatar-small">${booking.hostAvatar}</div>
                        <div>
                            <div class="host-name">${booking.hostName}</div>
                            <div class="request-time">Requested ${this.formatTime(booking.requestedAt)}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="booking-actions">
                <button class="dashboard-btn-outline" onclick="uniroomiBookings.viewBookingDetails(${booking.id})">
                    Details
                </button>
                ${booking.status === 'pending' ? `
                    <button class="dashboard-btn" onclick="uniroomiBookings.cancelBooking(${booking.id})">
                        Cancel Request
                    </button>
                ` : ''}
                ${booking.status === 'cancelled' ? `
                    <button class="dashboard-btn delete-btn" onclick="uniroomiBookings.deleteBooking(${booking.id})">
                        Delete Request
                    </button>
                ` : ''}
            </div>
        `;

        bookingContainer.appendChild(bookingElement);
        
        // Load and apply favorite status
        const isFavorite = this.loadFavoriteStatus(booking.id);
        const heartElement = bookingElement.querySelector('.favorite-heart');
        if (isFavorite) {
            heartElement.classList.add('favorited');
        }
    }

    // Format date for display
    formatDate(dateString) {
        if (!dateString || dateString === 'undefined' || dateString === undefined) {
            return 'Date to be confirmed';
        }
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Date to be confirmed';
            }
            return date.toLocaleDateString('en-ZA', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                    });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Date to be confirmed';
        }
    }

    // Format status for display
    formatStatus(status) {
        const statusMap = {
            'pending': 'Pending',
            'confirmed': 'Confirmed',
            'cancelled': 'Cancelled',
            'rejected': 'Rejected'
        };
        return statusMap[status] || status;
    }

    // Format time for display
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    // Update booking count in dashboard
    updateBookingCount() {
        const bookings = this.getBookings();
        const pendingCount = bookings.filter(b => b.status === 'pending').length;
        
        // Update dashboard quick card - look for the booking card with calendar icon
        const bookingCards = document.querySelectorAll('.dashboard-quick-card');
        bookingCards.forEach(card => {
            const icon = card.querySelector('.dashboard-icon');
            if (icon && icon.textContent.includes('📅')) {
                const strongElement = card.querySelector('strong');
                if (strongElement) {
                    strongElement.textContent = pendingCount > 0 ? `${pendingCount} Pending` : '0 Pending';
                    console.log(`Booking count updated: ${pendingCount} pending bookings`);
                }
            }
        });
    }

    // Cancel booking
    cancelBooking(bookingId) {
        const bookings = this.getBookings();
        const booking = bookings.find(b => b.id === bookingId);
        
        if (booking) {
            this.showCancelConfirmationModal(booking);
        }
    }

    // Show cancel confirmation modal
    showCancelConfirmationModal(booking) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'cancel-modal-overlay';
        modalOverlay.innerHTML = `
            <div class="cancel-modal-container">
                <div class="cancel-modal-header">
                    <div class="cancel-modal-icon">
                        <i class="fa fa-exclamation-triangle"></i>
                    </div>
                    <h3>Cancel Booking Request</h3>
                </div>
                <div class="cancel-modal-body">
                    <p>Are you sure you want to cancel this booking request?</p>
                    <div class="cancel-booking-details">
                        <div class="detail-item">
                            <strong>Property:</strong> ${booking.propertyTitle}
                        </div>
                        <div class="detail-item">
                            <strong>Location:</strong> ${booking.propertyLocation}
                        </div>
                        <div class="detail-item">
                            <strong>Room Type:</strong> ${booking.roomType}
                        </div>
                        <div class="detail-item">
                            <strong>Price:</strong> ${booking.price}
                        </div>
                    </div>
                    <p class="warning-text"><i class="fa fa-info-circle"></i> You can always delete this booking later if needed.</p>
                </div>
                <div class="cancel-modal-footer">
                    <button class="cancel-modal-btn keep-btn" onclick="this.closest('.cancel-modal-overlay').remove()">
                        <i class="fa fa-arrow-left"></i> Keep Booking
                    </button>
                    <button class="cancel-modal-btn confirm-btn" onclick="uniroomiBookings.confirmCancel(${booking.id})">
                        <i class="fa fa-times"></i> Cancel Request
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        
        // Add entrance animation
        setTimeout(() => {
            modalOverlay.classList.add('show');
        }, 10);
        
        // Close on overlay click
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('show');
                setTimeout(() => modalOverlay.remove(), 300);
            }
        });
    }

    // Confirm cancel action
    confirmCancel(bookingId) {
        const bookings = this.getBookings();
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);
        
        if (bookingIndex !== -1) {
            bookings[bookingIndex].status = 'cancelled';
            localStorage.setItem(this.userBookingsKey, JSON.stringify(bookings));
            
            // Close modal
            const modal = document.querySelector('.cancel-modal-overlay');
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            }
            
            // Update UI
            this.loadBookings(); // Reload to update display
            this.updateBookingCount();
            this.showCancellationMessage();
        }
    }

    // Delete booking (for cancelled bookings)
    deleteBooking(bookingId) {
        const bookings = this.getBookings();
        const booking = bookings.find(b => b.id === bookingId);
        
        if (booking) {
            this.showDeleteConfirmationModal(booking);
        }
    }

    // Show delete confirmation modal
    showDeleteConfirmationModal(booking) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'delete-modal-overlay';
        modalOverlay.innerHTML = `
            <div class="delete-modal-container">
                <div class="delete-modal-header">
                    <div class="delete-modal-icon">
                        <i class="fa fa-trash"></i>
                    </div>
                    <h3>Delete Booking Request</h3>
                </div>
                <div class="delete-modal-body">
                    <p>Are you sure you want to permanently delete this cancelled booking request?</p>
                    <div class="delete-booking-details">
                        <div class="detail-item">
                            <strong>Property:</strong> ${booking.propertyTitle}
                        </div>
                        <div class="detail-item">
                            <strong>Location:</strong> ${booking.propertyLocation}
                        </div>
                        <div class="detail-item">
                            <strong>Room Type:</strong> ${booking.roomType}
                        </div>
                        <div class="detail-item">
                            <strong>Price:</strong> ${booking.price}
                        </div>
                    </div>
                    <p class="warning-text"><i class="fa fa-exclamation-triangle"></i> This action cannot be undone.</p>
                </div>
                <div class="delete-modal-footer">
                    <button class="delete-modal-btn cancel-btn" onclick="this.closest('.delete-modal-overlay').remove()">
                        <i class="fa fa-times"></i> Cancel
                    </button>
                    <button class="delete-modal-btn confirm-btn" onclick="uniroomiBookings.confirmDelete(${booking.id})">
                        <i class="fa fa-trash"></i> Delete Request
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        
        // Add entrance animation
        setTimeout(() => {
            modalOverlay.classList.add('show');
        }, 10);
        
        // Close on overlay click
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('show');
                setTimeout(() => modalOverlay.remove(), 300);
            }
        });
    }

    // Confirm delete action
    confirmDelete(bookingId) {
        const bookings = this.getBookings();
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);
        
        if (bookingIndex !== -1) {
            const deletedBooking = bookings[bookingIndex];
            bookings.splice(bookingIndex, 1); // Remove the booking from array
            localStorage.setItem(this.userBookingsKey, JSON.stringify(bookings));
            
            // Close modal
            const modal = document.querySelector('.delete-modal-overlay');
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            }
            
            // Update UI
            this.loadBookings(); // Reload to update display
            this.updateBookingCount();
            
            // Show deletion confirmation
            this.showDeletionMessage(deletedBooking);
        }
    }

    // View booking details
    viewBookingDetails(bookingId) {
        const bookings = this.getBookings();
        const booking = bookings.find(b => b.id === bookingId);
        
        if (booking) {
            alert(`Booking Details:\n\nProperty: ${booking.propertyTitle}\nLocation: ${booking.propertyLocation}\nRoom Type: ${booking.roomType}\nPrice: ${booking.price}\nHost: ${booking.hostName}\nStatus: ${booking.formatStatus(booking.status)}\nCheck-in: ${this.formatDate(booking.checkInDate)}\nRequested: ${this.formatTime(booking.requestedAt)}`);
        }
    }

    // Show booking confirmation
    showBookingConfirmation(booking) {
        const confirmationMessage = `
🎉 Booking Request Sent!

Your booking request for ${booking.propertyTitle} has been sent to ${booking.hostName}.

📧 You'll receive a notification when the host responds.
📅 Check-in date: ${this.formatDate(booking.checkInDate)}
💰 Price: ${booking.price}

Status: Pending confirmation
        `;
        
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'booking-confirmation-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h4>🎉 Booking Request Sent!</h4>
                <p>Your request for <strong>${booking.propertyTitle}</strong> has been sent.</p>
                <button onclick="this.parentElement.parentElement.remove()">OK</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Show cancellation message
    showCancellationMessage() {
        const notification = document.createElement('div');
        notification.className = 'booking-cancellation-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h4>Booking Cancelled</h4>
                <p>Your booking request has been cancelled.</p>
                <button onclick="this.parentElement.parentElement.remove()">OK</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    // Show deletion message
    showDeletionMessage(deletedBooking) {
        const notification = document.createElement('div');
        notification.className = 'booking-deletion-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h4>Booking Deleted</h4>
                <p>Your cancelled booking request for ${deletedBooking.propertyTitle} has been permanently deleted.</p>
                <button onclick="this.parentElement.parentElement.remove()">OK</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    // Toggle favorite status
    toggleFavorite(bookingId) {
        const heartElement = event.currentTarget;
        const isFavorite = heartElement.classList.contains('favorited');
        
        if (isFavorite) {
            heartElement.classList.remove('favorited');
            this.showNotification('Removed from favorites', 'info');
        } else {
            heartElement.classList.add('favorited');
            this.showNotification('Added to favorites', 'success');
        }
        
        // Save favorite status to localStorage
        this.saveFavoriteStatus(bookingId, !isFavorite);
    }

    // Save favorite status
    saveFavoriteStatus(bookingId, isFavorite) {
        // Use user-specific storage key
        let favoritesKey = 'bookingFavorites';
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (user) {
                favoritesKey = `bookingFavorites_${user.uid}`;
            }
        }
        
        let favorites = JSON.parse(localStorage.getItem(favoritesKey) || '{}');
        favorites[bookingId] = isFavorite;
        localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    }

    // Load favorite status
    loadFavoriteStatus(bookingId) {
        // Use user-specific storage key
        let favoritesKey = 'bookingFavorites';
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (user) {
                favoritesKey = `bookingFavorites_${user.uid}`;
            }
        }
        
        const favorites = JSON.parse(localStorage.getItem(favoritesKey) || '{}');
        return favorites[bookingId] || false;
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `favorite-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 2000);
    }
}

// Update welcome message based on login history and user role
function updateWelcomeMessage(userName) {
    console.log('=== DEBUG: updateWelcomeMessage called ===');
    console.log('userName:', userName);
    
    const welcomeElement = document.getElementById('welcomeMessage');
    console.log('welcomeElement found:', !!welcomeElement);
    
    if (!welcomeElement) {
        console.error('Welcome message element not found!');
        return;
    }
    
    console.log('Current welcomeElement content:', welcomeElement.innerHTML);
    
    // Check if user is a host and if we're on the host dashboard
    const isHostDashboard = window.location.pathname.includes('dashboard-host.html');
    const currentUser = firebase.auth().currentUser;
    
    if (currentUser) {
        // Get user role from localStorage
        const userData = localStorage.getItem(`uniroomi_user_${currentUser.uid}`);
        if (userData) {
            const user = JSON.parse(userData);
            const isHost = user.role === 'host';
            
            let newMessage;
            if (isHost && isHostDashboard) {
                // Host-specific welcome message for host dashboard
                newMessage = `Welcome to your Host Dashboard <span style="color: #16a34a;">${userName}</span>! 🏠`;
            } else if (isHost) {
                // Host on regular dashboard (shouldn't happen but just in case)
                newMessage = `Welcome back <span style="color: #16a34a;">${userName}</span>! (Host)`;
            } else {
                // Regular guest welcome message
                newMessage = `Welcome back <span style="color: #2563eb;">${userName}</span>!`;
            }
            
            console.log('Setting new message:', newMessage);
            welcomeElement.innerHTML = newMessage;
            console.log('Message updated successfully!');
            return;
        }
    }
    
    // Fallback to default message if user data not found
    const newMessage = `Welcome back <span style="color: #2563eb;">${userName}</span>!`;
    console.log('Setting fallback message:', newMessage);
    welcomeElement.innerHTML = newMessage;
    console.log('Fallback message updated successfully!');
}

// Initialize booking system
const uniroomiBookings = new UniRoomiBookings();

// Single booking initialization
function initializeBookings() {
    console.log('Initializing UniRoomi booking system...');
    uniroomiBookings.initialize();
}
