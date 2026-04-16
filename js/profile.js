// UniRoomi Profile Management JavaScript
class UniRoomiProfile {
    constructor() {
        this.currentUser = null;
        this.profileData = {
            personalInfo: {
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                dateOfBirth: '',
                gender: '',
                university: '',
                studyField: '',
                yearOfStudy: '',
                studentId: '',
                emergencyContact: {
                    name: '',
                    relationship: '',
                    phone: ''
                }
            },
            preferences: {
                budget: 5000,
                location: '',
                roomType: 'single',
                amenities: [],
                moveInDate: '',
                leaseDuration: ''
            },
            avatar: {
                url: '',
                initials: ''
            }
        };
        this.isEditMode = false;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupAuth());
        } else {
            this.setupAuth();
        }
    }

    setupAuth() {
        console.log('Setting up auth...');
        
        // Wait for Firebase to be ready
        if (typeof firebase !== 'undefined' && firebase.auth) {
            console.log('Firebase is available, setting up auth listener');
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    console.log('User is authenticated:', user.email);
                    this.currentUser = user;
                    this.loadProfileData();
                    this.setupEventListeners();
                } else {
                    console.log('User not authenticated, creating mock user');
                    // For testing purposes, create a mock user if not authenticated
                    this.createMockUser();
                    this.loadProfileData();
                    this.setupEventListeners();
                }
            });
        } else {
            // Firebase not loaded, use mock data for testing
            console.log('Firebase not loaded, using mock data');
            this.createMockUser();
            this.loadProfileData();
            this.setupEventListeners();
        }
    }

    createMockUser() {
        this.currentUser = {
            uid: 'mock-user-123',
            email: 'john.doe@university.edu',
            displayName: 'John Doe'
        };
    }

    async loadProfileData() {
        try {
            console.log('Loading profile data...');
            // Load profile from Firebase or use mock data for now
            await this.loadMockProfileData();
            this.renderProfile();
            this.updateProfileCard();
            console.log('Profile data loaded successfully');
        } catch (error) {
            console.error('Error loading profile data:', error);
            this.showNotification('Error loading profile data', 'error');
            // Try to render a basic profile even if there's an error
            this.renderProfile();
        }
    }

    async loadMockProfileData() {
        console.log('Loading mock profile data...');
        // Generate initials from user email or display name
        let initials = 'U';
        if (this.currentUser.displayName) {
            const nameParts = this.currentUser.displayName.trim().split(' ');
            if (nameParts.length >= 2) {
                initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
            } else if (nameParts.length === 1) {
                initials = nameParts[0][0].toUpperCase();
            }
        } else if (this.currentUser.email) {
            initials = this.currentUser.email.substring(0, 2).toUpperCase();
        }

        this.profileData = {
            personalInfo: {
                firstName: 'John',
                lastName: 'Doe',
                email: this.currentUser.email,
                phone: '+27 83 123 4567',
                dateOfBirth: '2000-05-15',
                gender: 'male',
                university: 'University of Pretoria',
                studyField: 'Computer Science',
                yearOfStudy: '3rd Year',
                studentId: 'UP20201234',
                emergencyContact: {
                    name: 'Jane Doe',
                    relationship: 'Mother',
                    phone: '+27 82 987 6543'
                }
            },
            preferences: {
                budget: 5000,
                location: 'Pretoria',
                roomType: 'single',
                amenities: ['wifi', 'parking', 'security', 'laundry'],
                moveInDate: '2026-02-01',
                leaseDuration: '6_months'
            },
            avatar: {
                url: '',
                initials: initials
            }
        };
        
        console.log('Mock profile data loaded:', this.profileData);
    }

    renderProfile() {
        console.log('Rendering profile...');
        
        // Check if profile section exists
        const profileContainer = document.querySelector('.dashboard-profile-section');
        console.log('Profile container found:', !!profileContainer);
        
        if (!profileContainer) {
            console.error('Profile section container not found');
            // Try to create the profile section if it doesn't exist
            this.createProfileSection();
            return;
        }
        
        console.log('Profile container exists, updating view...');
        this.updateProfileView();
        this.calculateProfileCompletion();
        console.log('Profile rendered successfully');
    }

    updateProfileView() {
        const profileContainer = document.querySelector('.dashboard-profile-section');
        console.log('Updating profile view, container found:', !!profileContainer);
        
        if (!profileContainer) {
            console.error('Profile container not found in updateProfileView');
            return;
        }

        console.log('Is edit mode:', this.isEditMode);
        console.log('Profile data:', this.profileData);

        try {
            if (this.isEditMode) {
                profileContainer.innerHTML = this.createEditProfileHTML();
            } else {
                profileContainer.innerHTML = this.createViewProfileHTML();
            }
            console.log('Profile view updated successfully');
        } catch (error) {
            console.error('Error updating profile view:', error);
            profileContainer.innerHTML = '<div class="error-message">Error loading profile. Please refresh the page.</div>';
        }
    }

    createProfileSection() {
        console.log('Creating profile section...');
        
        // First, try to find the dashboard grid
        let dashboardGrid = document.querySelector('.dashboard-grid');
        
        if (!dashboardGrid) {
            console.log('Dashboard grid not found, creating it...');
            
            // Find the dashboard container
            const dashboardContainer = document.querySelector('.dashboard-container');
            if (!dashboardContainer) {
                console.error('Dashboard container not found');
                return;
            }
            
            // Create the dashboard grid
            dashboardGrid = document.createElement('div');
            dashboardGrid.className = 'dashboard-grid';
            dashboardContainer.appendChild(dashboardGrid);
            console.log('Dashboard grid created');
        }
        
        // Create profile section
        const profileSection = document.createElement('div');
        profileSection.className = 'dashboard-card dashboard-profile-section';
        profileSection.innerHTML = '<div class="loading">Loading profile...</div>';
        
        // Insert at the beginning of the grid
        dashboardGrid.insertBefore(profileSection, dashboardGrid.firstChild);
        
        console.log('Profile section created and inserted');
        
        // Now try to render the profile
        setTimeout(() => {
            this.renderProfile();
        }, 100);
    }

    createViewProfileHTML() {
        const info = this.profileData.personalInfo;
        const avatar = this.profileData.avatar;
        
        return `
            <div class="profile-view">
                <div class="profile-header">
                    <div class="profile-avatar-section">
                        <div class="profile-avatar-large">
                            ${avatar.url ? 
                                `<img src="${avatar.url}" alt="Profile Avatar">` : 
                                `<div class="avatar-initials-large">${avatar.initials}</div>`
                            }
                        </div>
                        <div class="profile-basic-info">
                            <h2>${info.firstName} ${info.lastName}</h2>
                            <p class="profile-email">${info.email}</p>
                            <p class="profile-university">${info.university} • ${info.studyField}</p>
                        </div>
                    </div>
                    <div class="profile-actions">
                        <button class="dashboard-btn" onclick="profile.toggleEditMode()">Edit Profile</button>
                        <button class="dashboard-btn-outline" onclick="profile.changeAvatar()">Change Avatar</button>
                    </div>
                </div>

                <div class="profile-content">
                    <div class="profile-section">
                        <h3>Personal Information</h3>
                        <div class="profile-grid">
                            <div class="profile-item">
                                <label>Full Name</label>
                                <p>${info.firstName} ${info.lastName}</p>
                            </div>
                            <div class="profile-item">
                                <label>Phone Number</label>
                                <p>${info.phone}</p>
                            </div>
                            <div class="profile-item">
                                <label>Date of Birth</label>
                                <p>${new Date(info.dateOfBirth).toLocaleDateString()}</p>
                            </div>
                            <div class="profile-item">
                                <label>Gender</label>
                                <p>${info.gender.charAt(0).toUpperCase() + info.gender.slice(1)}</p>
                            </div>
                            <div class="profile-item">
                                <label>Student ID</label>
                                <p>${info.studentId}</p>
                            </div>
                            <div class="profile-item">
                                <label>Year of Study</label>
                                <p>${info.yearOfStudy}</p>
                            </div>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h3>Emergency Contact</h3>
                        <div class="profile-grid">
                            <div class="profile-item">
                                <label>Contact Name</label>
                                <p>${info.emergencyContact.name}</p>
                            </div>
                            <div class="profile-item">
                                <label>Relationship</label>
                                <p>${info.emergencyContact.relationship}</p>
                            </div>
                            <div class="profile-item">
                                <label>Contact Phone</label>
                                <p>${info.emergencyContact.phone}</p>
                            </div>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h3>Accommodation Preferences</h3>
                        <div class="profile-grid">
                            <div class="profile-item">
                                <label>Budget</label>
                                <p>R${info.preferences.budget}/month</p>
                            </div>
                            <div class="profile-item">
                                <label>Preferred Location</label>
                                <p>${info.preferences.location}</p>
                            </div>
                            <div class="profile-item">
                                <label>Room Type</label>
                                <p>${info.preferences.roomType.charAt(0).toUpperCase() + info.preferences.roomType.slice(1)}</p>
                            </div>
                            <div class="profile-item">
                                <label>Move-in Date</label>
                                <p>${new Date(info.preferences.moveInDate).toLocaleDateString()}</p>
                            </div>
                            <div class="profile-item">
                                <label>Lease Duration</label>
                                <p>${info.preferences.leaseDuration.replace('_', ' ').charAt(0).toUpperCase() + info.preferences.leaseDuration.replace('_', ' ').slice(1)}</p>
                            </div>
                            <div class="profile-item">
                                <label>Amenities</label>
                                <p>${info.preferences.amenities.join(', ')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createEditProfileHTML() {
        const info = this.profileData.personalInfo;
        const prefs = this.profileData.preferences;
        
        return `
            <div class="profile-edit">
                <div class="profile-header">
                    <h2>Edit Profile</h2>
                    <div class="profile-actions">
                        <button class="dashboard-btn-outline" onclick="profile.cancelEdit()">Cancel</button>
                        <button class="dashboard-btn" onclick="profile.saveProfile()">Save Changes</button>
                    </div>
                </div>

                <form class="profile-form" onsubmit="profile.handleFormSubmit(event)">
                    <div class="profile-section">
                        <h3>Personal Information</h3>
                        <div class="profile-grid">
                            <div class="form-group">
                                <label for="firstName">First Name</label>
                                <input type="text" id="firstName" name="firstName" value="${info.firstName}" required>
                            </div>
                            <div class="form-group">
                                <label for="lastName">Last Name</label>
                                <input type="text" id="lastName" name="lastName" value="${info.lastName}" required>
                            </div>
                            <div class="form-group">
                                <label for="phone">Phone Number</label>
                                <input type="tel" id="phone" name="phone" value="${info.phone}" required>
                            </div>
                            <div class="form-group">
                                <label for="dateOfBirth">Date of Birth</label>
                                <input type="date" id="dateOfBirth" name="dateOfBirth" value="${info.dateOfBirth}" required>
                            </div>
                            <div class="form-group">
                                <label for="gender">Gender</label>
                                <select id="gender" name="gender" required>
                                    <option value="male" ${info.gender === 'male' ? 'selected' : ''}>Male</option>
                                    <option value="female" ${info.gender === 'female' ? 'selected' : ''}>Female</option>
                                    <option value="other" ${info.gender === 'other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="studentId">Student ID</label>
                                <input type="text" id="studentId" name="studentId" value="${info.studentId}" required>
                            </div>
                            <div class="form-group">
                                <label for="university">University</label>
                                <input type="text" id="university" name="university" value="${info.university}" required>
                            </div>
                            <div class="form-group">
                                <label for="studyField">Field of Study</label>
                                <input type="text" id="studyField" name="studyField" value="${info.studyField}" required>
                            </div>
                            <div class="form-group">
                                <label for="yearOfStudy">Year of Study</label>
                                <select id="yearOfStudy" name="yearOfStudy" required>
                                    <option value="1st Year" ${info.yearOfStudy === '1st Year' ? 'selected' : ''}>1st Year</option>
                                    <option value="2nd Year" ${info.yearOfStudy === '2nd Year' ? 'selected' : ''}>2nd Year</option>
                                    <option value="3rd Year" ${info.yearOfStudy === '3rd Year' ? 'selected' : ''}>3rd Year</option>
                                    <option value="4th Year" ${info.yearOfStudy === '4th Year' ? 'selected' : ''}>4th Year</option>
                                    <option value="Postgraduate" ${info.yearOfStudy === 'Postgraduate' ? 'selected' : ''}>Postgraduate</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h3>Emergency Contact</h3>
                        <div class="profile-grid">
                            <div class="form-group">
                                <label for="emergencyName">Contact Name</label>
                                <input type="text" id="emergencyName" name="emergencyName" value="${info.emergencyContact.name}" required>
                            </div>
                            <div class="form-group">
                                <label for="emergencyRelationship">Relationship</label>
                                <select id="emergencyRelationship" name="emergencyRelationship" required>
                                    <option value="Mother" ${info.emergencyContact.relationship === 'Mother' ? 'selected' : ''}>Mother</option>
                                    <option value="Father" ${info.emergencyContact.relationship === 'Father' ? 'selected' : ''}>Father</option>
                                    <option value="Guardian" ${info.emergencyContact.relationship === 'Guardian' ? 'selected' : ''}>Guardian</option>
                                    <option value="Sibling" ${info.emergencyContact.relationship === 'Sibling' ? 'selected' : ''}>Sibling</option>
                                    <option value="Spouse" ${info.emergencyContact.relationship === 'Spouse' ? 'selected' : ''}>Spouse</option>
                                    <option value="Other" ${info.emergencyContact.relationship === 'Other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="emergencyPhone">Contact Phone</label>
                                <input type="tel" id="emergencyPhone" name="emergencyPhone" value="${info.emergencyContact.phone}" required>
                            </div>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h3>Accommodation Preferences</h3>
                        <div class="profile-grid">
                            <div class="form-group">
                                <label for="budget">Monthly Budget (R)</label>
                                <input type="number" id="budget" name="budget" value="${prefs.budget}" min="1000" max="20000" required>
                            </div>
                            <div class="form-group">
                                <label for="location">Preferred Location</label>
                                <input type="text" id="location" name="location" value="${prefs.location}" required>
                            </div>
                            <div class="form-group">
                                <label for="roomType">Room Type</label>
                                <select id="roomType" name="roomType" required>
                                    <option value="single" ${prefs.roomType === 'single' ? 'selected' : ''}>Single Room</option>
                                    <option value="shared" ${prefs.roomType === 'shared' ? 'selected' : ''}>Shared Room</option>
                                    <option value="studio" ${prefs.roomType === 'studio' ? 'selected' : ''}>Studio</option>
                                    <option value="apartment" ${prefs.roomType === 'apartment' ? 'selected' : ''}>Apartment</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="moveInDate">Preferred Move-in Date</label>
                                <input type="date" id="moveInDate" name="moveInDate" value="${prefs.moveInDate}" required>
                            </div>
                            <div class="form-group">
                                <label for="leaseDuration">Lease Duration</label>
                                <select id="leaseDuration" name="leaseDuration" required>
                                    <option value="3_months" ${prefs.leaseDuration === '3_months' ? 'selected' : ''}>3 Months</option>
                                    <option value="6_months" ${prefs.leaseDuration === '6_months' ? 'selected' : ''}>6 Months</option>
                                    <option value="12_months" ${prefs.leaseDuration === '12_months' ? 'selected' : ''}>12 Months</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Preferred Amenities</label>
                                <div class="amenities-checkboxes">
                                    ${this.getAmenityCheckboxes(prefs.amenities)}
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        `;
    }

    getAmenityCheckboxes(selectedAmenities) {
        const amenities = ['wifi', 'parking', 'security', 'laundry', 'gym', 'study_room', 'kitchen', 'furnished'];
        return amenities.map(amenity => `
            <label class="checkbox-label">
                <input type="checkbox" name="amenities" value="${amenity}" ${selectedAmenities.includes(amenity) ? 'checked' : ''}>
                <span>${amenity.replace('_', ' ').charAt(0).toUpperCase() + amenity.replace('_', ' ').slice(1)}</span>
            </label>
        `).join('');
    }

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        this.updateProfileView();
    }

    cancelEdit() {
        this.isEditMode = false;
        this.updateProfileView();
        this.showNotification('Changes cancelled', 'info');
    }

    async saveProfile() {
        try {
            // Collect form data
            const formData = this.collectFormData();
            
            // Update profile data
            this.profileData.personalInfo = { ...this.profileData.personalInfo, ...formData.personalInfo };
            this.profileData.preferences = { ...this.profileData.preferences, ...formData.preferences };
            
            // Update initials if name changed
            const initials = (this.profileData.personalInfo.firstName[0] + this.profileData.personalInfo.lastName[0]).toUpperCase();
            this.profileData.avatar.initials = initials;
            
            // Save to Firebase (mock for now)
            await this.saveProfileToFirebase();
            
            // Exit edit mode
            this.isEditMode = false;
            this.updateProfileView();
            this.updateProfileCard();
            this.calculateProfileCompletion();
            
            this.showNotification('Profile updated successfully', 'success');
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showNotification('Error saving profile', 'error');
        }
    }

    collectFormData() {
        const form = document.querySelector('.profile-form');
        const formData = new FormData(form);
        
        const personalInfo = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            phone: formData.get('phone'),
            dateOfBirth: formData.get('dateOfBirth'),
            gender: formData.get('gender'),
            studentId: formData.get('studentId'),
            university: formData.get('university'),
            studyField: formData.get('studyField'),
            yearOfStudy: formData.get('yearOfStudy'),
            emergencyContact: {
                name: formData.get('emergencyName'),
                relationship: formData.get('emergencyRelationship'),
                phone: formData.get('emergencyPhone')
            }
        };
        
        const amenities = formData.getAll('amenities');
        const preferences = {
            budget: parseInt(formData.get('budget')),
            location: formData.get('location'),
            roomType: formData.get('roomType'),
            moveInDate: formData.get('moveInDate'),
            leaseDuration: formData.get('leaseDuration'),
            amenities: amenities
        };
        
        return { personalInfo, preferences };
    }

    async saveProfileToFirebase() {
        // Mock save - replace with actual Firebase call
        console.log('Saving profile to Firebase:', this.profileData);
        return new Promise(resolve => setTimeout(resolve, 1000));
    }

    changeAvatar() {
        // Create file input for avatar upload
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => this.handleAvatarUpload(e);
        input.click();
    }

    async handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (file) {
            try {
                // In a real implementation, upload to Firebase Storage
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.profileData.avatar.url = e.target.result;
                    this.updateProfileView();
                    this.showNotification('Avatar updated successfully', 'success');
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error uploading avatar:', error);
                this.showNotification('Error uploading avatar', 'error');
            }
        }
    }

    calculateProfileCompletion() {
        const info = this.profileData.personalInfo;
        const prefs = this.profileData.preferences;
        
        let completedFields = 0;
        let totalFields = 0;
        
        // Check personal info fields
        const personalFields = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'university', 'studyField', 'yearOfStudy', 'studentId'];
        personalFields.forEach(field => {
            totalFields++;
            if (info[field] && info[field].trim() !== '') completedFields++;
        });
        
        // Check emergency contact
        const emergencyFields = ['name', 'relationship', 'phone'];
        emergencyFields.forEach(field => {
            totalFields++;
            if (info.emergencyContact[field] && info.emergencyContact[field].trim() !== '') completedFields++;
        });
        
        // Check preferences
        const preferenceFields = ['budget', 'location', 'roomType', 'moveInDate', 'leaseDuration'];
        preferenceFields.forEach(field => {
            totalFields++;
            if (prefs[field] && prefs[field].toString().trim() !== '') completedFields++;
        });
        
        // Check amenities
        totalFields++;
        if (prefs.amenities && prefs.amenities.length > 0) completedFields++;
        
        // Check avatar
        totalFields++;
        if (this.profileData.avatar.url || this.profileData.avatar.initials) completedFields++;
        
        const completionPercentage = Math.round((completedFields / totalFields) * 100);
        this.updateProfileCard(completionPercentage);
    }

    updateProfileCard(completion = null) {
        const profileCard = document.querySelector('.dashboard-quick-card');
        if (!profileCard) return;
        
        const percentage = completion !== null ? completion : this.calculateProfileCompletion();
        const strong = profileCard.querySelector('strong');
        if (strong) {
            strong.textContent = `${percentage}% Complete`;
        }
    }

    setupEventListeners() {
        // Add any additional event listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('dashboard-btn') || e.target.classList.contains('dashboard-btn-outline')) {
                // Handle button clicks
                console.log('Profile button clicked:', e.target.textContent);
            }
        });
    }

    handleFormSubmit(event) {
        event.preventDefault();
        this.saveProfile();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `dashboard-notification dashboard-notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize profile when DOM is loaded
let profile;

// Multiple initialization attempts to ensure it works
function initializeProfile() {
    console.log('Initializing profile...');
    if (!profile) {
        profile = new UniRoomiProfile();
        console.log('Profile instance created');
    } else {
        console.log('Profile already exists');
    }
}

// Wait for all scripts to load before initializing
function waitForScriptsAndInitialize() {
    console.log('Waiting for scripts to load...');
    
    // Check if Firebase is loaded
    if (typeof firebase !== 'undefined') {
        console.log('Firebase is loaded');
        initializeProfile();
    } else {
        console.log('Firebase not yet loaded, waiting...');
        // Wait a bit more for Firebase to load
        setTimeout(() => {
            if (typeof firebase !== 'undefined') {
                console.log('Firebase loaded after delay');
                initializeProfile();
            } else {
                console.log('Firebase still not loaded, initializing without it');
                initializeProfile();
            }
        }, 1000);
    }
}

// Try different initialization methods
if (document.readyState === 'loading') {
    console.log('Document still loading, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', waitForScriptsAndInitialize);
} else {
    // DOM already loaded
    console.log('Document already loaded, waiting for scripts');
    waitForScriptsAndInitialize();
}

// Also try as a fallback
window.addEventListener('load', () => {
    console.log('Window load event fired');
    if (!profile) {
        console.log('Profile not initialized yet, initializing now');
        initializeProfile();
    }
});

// Debug: Check if profile section exists after a delay
setTimeout(() => {
    const profileSection = document.querySelector('.dashboard-profile-section');
    console.log('Profile section check after 3 seconds:', !!profileSection);
    if (profileSection) {
        console.log('Profile section HTML length:', profileSection.innerHTML.length);
    }
    
    // Check if dashboard grid exists
    const dashboardGrid = document.querySelector('.dashboard-grid');
    console.log('Dashboard grid check after 3 seconds:', !!dashboardGrid);
    
    // Check if dashboard container exists
    const dashboardContainer = document.querySelector('.dashboard-container');
    console.log('Dashboard container check after 3 seconds:', !!dashboardContainer);
}, 3000);
