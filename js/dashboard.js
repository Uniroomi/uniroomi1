// UniRoomi Dashboard JavaScript
class UniRoomiDashboard {
    constructor() {
        this.currentUser = null;
        this.dashboardData = {
            userProfile: {
                completion: 85,
                personalInfo: {
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    university: '',
                    studyField: '',
                    yearOfStudy: '',
                    preferences: {
                        budget: 5000,
                        location: 'Pretoria',
                        roomType: 'single',
                        amenities: []
                    }
                }
            },
            bookings: [],
            savedProperties: [],
            messages: [],
            notifications: []
        };
        this.init();
    }

    async init() {
        // Wait for Firebase to be ready
        if (typeof firebase !== 'undefined') {
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    this.currentUser = user;
                    this.loadDashboardData();
                    this.setupEventListeners();
                    this.updateUI();
                } else {
                    // Redirect to login if not authenticated
                    window.location.href = '../index.html';
                }
            });
        }
    }

    async loadDashboardData() {
        try {
            // Load user profile data
            await this.loadUserProfile();
            
            // Load bookings
            await this.loadBookings();
            
            // Load saved properties
            await this.loadSavedProperties();
            
            // Load messages
            await this.loadMessages();
            
            // Update dashboard counts
            this.updateDashboardCounts();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Error loading dashboard data', 'error');
        }
    }

    async loadUserProfile() {
        // Simulate loading user profile - replace with actual Firebase call
        const mockProfile = {
            firstName: 'John',
            lastName: 'Doe',
            email: this.currentUser.email,
            phone: '+27 83 123 4567',
            university: 'University of Pretoria',
            studyField: 'Computer Science',
            yearOfStudy: '3rd Year',
            preferences: {
                budget: 5000,
                location: 'Pretoria',
                roomType: 'single',
                amenities: ['wifi', 'parking', 'security']
            }
        };
        
        this.dashboardData.userProfile.personalInfo = mockProfile;
    }

    async loadBookings() {
        console.log('Loading bookings...');
        // Simulate loading bookings - replace with actual Firebase call
        const mockBookings = [
            {
                id: 'BK001',
                propertyId: 'PROP001',
                propertyName: 'Sunrise Student Lodge',
                location: 'Durban',
                status: 'active',
                checkIn: '2026-03-01',
                checkOut: '2026-06-30',
                monthlyRent: 4500,
                depositPaid: true,
                image: '../image/property1.jpg'
            },
            {
                id: 'BK002',
                propertyId: 'PROP002',
                propertyName: 'Urban Nest Residence',
                location: 'Johannesburg',
                status: 'upcoming',
                checkIn: '2026-03-15',
                checkOut: '2026-06-15',
                monthlyRent: 5200,
                depositPaid: true,
                image: '../image/property2.jpg'
            }
        ];
        
        this.dashboardData.bookings = mockBookings;
        console.log('Bookings loaded:', this.dashboardData.bookings.length);
        this.renderBookings();
    }

    async loadSavedProperties() {
        // Simulate loading saved properties - replace with actual Firebase call
        const mockSavedProperties = [
            {
                id: 'PROP003',
                name: 'Campus View Apartments',
                location: 'Pretoria',
                price: 4800,
                rating: 4.5,
                distance: '0.5km from campus',
                image: '../image/property3.jpg',
                amenities: ['wifi', 'parking', 'gym', 'security']
            },
            {
                id: 'PROP004',
                name: 'Student Hub Residence',
                location: 'Cape Town',
                price: 5500,
                rating: 4.8,
                distance: '1.2km from campus',
                image: '../image/property4.jpg',
                amenities: ['wifi', 'laundry', 'study-room', 'security']
            }
        ];
        
        this.dashboardData.savedProperties = mockSavedProperties;
        console.log('Saved properties loaded:', this.dashboardData.savedProperties.length);
        this.renderSavedProperties();
    }

    async loadMessages() {
        console.log('Loading messages...');
        // Simulate loading messages - replace with actual Firebase call
        const mockMessages = [
            {
                id: 'MSG001',
                sender: 'Property Manager - Sunrise Lodge',
                content: 'Your booking for March has been confirmed. Please check your email for details.',
                timestamp: new Date('2026-02-01T10:30:00'),
                read: false
            },
            {
                id: 'MSG002',
                sender: 'UniRoomi Support',
                content: 'Welcome to UniRoomi! Your profile is now complete and ready for bookings.',
                timestamp: new Date('2026-01-28T14:15:00'),
                read: true
            }
        ];
        
        this.dashboardData.messages = mockMessages;
        console.log('Messages loaded:', this.dashboardData.messages.length);
        this.renderMessages();
    }

    updateDashboardCounts() {
        // Update quick stats
        const activeBookings = this.dashboardData.bookings.filter(b => b.status === 'active').length;
        const savedCount = this.dashboardData.savedProperties.length;
        const unreadMessages = this.dashboardData.messages.filter(m => !m.read).length;
        
        // Update UI elements
        this.updateQuickCard('My Bookings', `${activeBookings} Active`);
        this.updateQuickCard('Saved Properties', `${savedCount} Saved`);
        this.updateQuickCard('Messages', `${unreadMessages} New`);
    }

    updateQuickCard(title, value) {
        const cards = document.querySelectorAll('.dashboard-quick-card');
        cards.forEach(card => {
            const small = card.querySelector('small');
            const strong = card.querySelector('strong');
            if (small && small.textContent === title) {
                strong.textContent = value;
            }
        });
    }

    updateUI() {
        this.renderBookings();
        this.renderMessages();
        this.renderSavedProperties();
        this.updateUserProfile();
    }

    renderBookings() {
        const bookingsContainer = document.querySelector('.dashboard-bookings-container');
        if (!bookingsContainer) {
            console.log('Bookings container not found, skipping render');
            return;
        }

        console.log('Rendering bookings, found container:', bookingsContainer);
        
        // Clear existing content including loading messages
        bookingsContainer.innerHTML = '';

        // Add bookings
        this.dashboardData.bookings.forEach(booking => {
            const bookingElement = this.createBookingElement(booking);
            bookingsContainer.appendChild(bookingElement);
        });
        
        console.log('Bookings rendered:', this.dashboardData.bookings.length);
    }

    createBookingElement(booking) {
        const bookingDiv = document.createElement('div');
        bookingDiv.className = 'dashboard-booking';
        bookingDiv.style.cssText = 'padding: 15px; border: 1px solid #ddd; margin: 10px 0; border-radius: 8px; background: white; display: block;';
        bookingDiv.innerHTML = `
            <div>
                <strong>${booking.propertyName}</strong>
                <p>${booking.location} • Check-in: ${new Date(booking.checkIn).toLocaleDateString()}</p>
                <small>Status: <span class="status-${booking.status}">${booking.status}</span></small>
            </div>
            <button class="dashboard-btn-outline" onclick="dashboard.viewBookingDetails('${booking.id}')">Details</button>
        `;
        return bookingDiv;
    }

    renderMessages() {
        const messagesContainer = document.querySelector('.dashboard-messages-container');
        if (!messagesContainer) {
            console.log('Messages container not found, skipping render');
            return;
        }

        console.log('Rendering messages, found container:', messagesContainer);
        
        // Clear existing content
        messagesContainer.innerHTML = '';

        // Add messages
        this.dashboardData.messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            messagesContainer.appendChild(messageElement);
        });
        
        console.log('Messages rendered:', this.dashboardData.messages.length);
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'dashboard-message';
        messageDiv.style.cssText = 'padding: 15px; border: 1px solid #ddd; margin: 10px 0; border-radius: 8px; background: white; display: block;';
        messageDiv.innerHTML = `
            <div class="message-header">
                <strong>${message.sender}</strong>
                <small class="message-time">${this.formatTime(message.timestamp)}</small>
            </div>
            <p>${message.content}</p>
            <div class="message-actions">
                <button class="dashboard-btn-outline" onclick="dashboard.viewMessage('${message.id}')">View</button>
                ${!message.read ? '<button class="dashboard-btn-outline" onclick="dashboard.markAsRead(\'' + message.id + '\')">Mark as Read</button>' : ''}
            </div>
        `;
        return messageDiv;
    }

    renderSavedProperties() {
        const propertiesContainer = document.querySelector('.dashboard-saved-grid');
        if (!propertiesContainer) {
            console.log('Saved properties container not found, skipping render');
            return;
        }

        console.log('Rendering saved properties, found container:', propertiesContainer);
        
        // Clear existing properties
        propertiesContainer.innerHTML = '';

        // Add saved properties
        this.dashboardData.savedProperties.forEach(property => {
            const propertyElement = this.createPropertyElement(property);
            propertiesContainer.appendChild(propertyElement);
        });
        
        console.log('Saved properties rendered:', this.dashboardData.savedProperties.length);
    }

    createPropertyElement(property) {
        const propertyDiv = document.createElement('div');
        propertyDiv.className = 'dashboard-property';
        propertyDiv.style.cssText = 'padding: 15px; border: 1px solid #ddd; margin: 10px 0; border-radius: 8px; background: white; display: block;';
        propertyDiv.innerHTML = `
            <div class="property-image" style="background-image: url('${property.image}'); height: 150px; background-size: cover; border-radius: 8px; margin-bottom: 10px;"></div>
            <div class="property-info">
                <strong>${property.name}</strong>
                <p>${property.location} • R${property.price}/month</p>
                <div class="property-details">
                    <small>⭐ ${property.rating} • ${property.distance}</small>
                </div>
                <div class="property-amenities">
                    ${property.amenities.slice(0, 2).map(amenity => `<span class="amenity-tag">${amenity}</span>`).join('')}
                </div>
            </div>
            <div class="property-actions">
                <button class="dashboard-btn-outline" onclick="dashboard.viewProperty('${property.id}')">View Property</button>
                <button class="dashboard-btn-outline" onclick="dashboard.removeSavedProperty('${property.id}')">Remove</button>
            </div>
        `;
        return propertyDiv;
    }

    updateUserProfile() {
        const profile = this.dashboardData.userProfile.personalInfo;
        // Update profile completion
        this.updateQuickCard('My Profile', `${this.dashboardData.userProfile.completion}% Complete`);
    }

    setupEventListeners() {
        // Add event listeners for interactive elements
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('dashboard-btn-outline')) {
                // Handle button clicks
                console.log('Button clicked:', e.target.textContent);
            }
        });
    }

    // Action Methods
    viewBookingDetails(bookingId) {
        const booking = this.dashboardData.bookings.find(b => b.id === bookingId);
        if (booking) {
            this.showBookingModal(booking);
        }
    }

    showBookingModal(booking) {
        // Create and show booking details modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Booking Details</h3>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <h4>${booking.propertyName}</h4>
                    <p><strong>Location:</strong> ${booking.location}</p>
                    <p><strong>Status:</strong> <span class="status-${booking.status}">${booking.status}</span></p>
                    <p><strong>Check-in:</strong> ${new Date(booking.checkIn).toLocaleDateString()}</p>
                    <p><strong>Check-out:</strong> ${new Date(booking.checkOut).toLocaleDateString()}</p>
                    <p><strong>Monthly Rent:</strong> R${booking.monthlyRent}</p>
                    <p><strong>Deposit Paid:</strong> ${booking.depositPaid ? 'Yes' : 'No'}</p>
                </div>
                <div class="modal-footer">
                    <button class="dashboard-btn" onclick="this.closest('.modal-overlay').remove()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    viewMessage(messageId) {
        const message = this.dashboardData.messages.find(m => m.id === messageId);
        if (message) {
            this.showMessageModal(message);
        }
    }

    showMessageModal(message) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${message.subject}</h3>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p><strong>From:</strong> ${message.sender}</p>
                    <p><strong>Date:</strong> ${message.timestamp.toLocaleString()}</p>
                    <hr>
                    <p>${message.content}</p>
                </div>
                <div class="modal-footer">
                    <button class="dashboard-btn" onclick="this.closest('.modal-overlay').remove()">Close</button>
                    <button class="dashboard-btn-outline" onclick="dashboard.replyToMessage('${message.id}')">Reply</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    markAsRead(messageId) {
        const message = this.dashboardData.messages.find(m => m.id === messageId);
        if (message) {
            message.read = true;
            this.updateDashboardCounts();
            this.renderMessages();
            this.showNotification('Message marked as read', 'success');
        }
    }

    viewProperty(propertyId) {
        const property = this.dashboardData.savedProperties.find(p => p.id === propertyId);
        if (property) {
            // Navigate to property details page or show modal
            window.open(`../accomodation.html#property-${propertyId}`, '_blank');
        }
    }

    removeSavedProperty(propertyId) {
        const index = this.dashboardData.savedProperties.findIndex(p => p.id === propertyId);
        if (index > -1) {
            this.dashboardData.savedProperties.splice(index, 1);
            this.updateDashboardCounts();
            this.renderSavedProperties();
            this.showNotification('Property removed from saved list', 'success');
        }
    }

    replyToMessage(messageId) {
        // Implement reply functionality
        this.showNotification('Reply feature coming soon', 'info');
    }

    // Utility Methods
    formatTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        
        if (hours < 1) {
            const minutes = Math.floor(diff / (1000 * 60));
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (hours < 24) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(hours / 24);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new UniRoomiDashboard();
});
