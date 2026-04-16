// Accommodation Favorites System
class AccommodationFavorites {
    constructor() {
        // Use user-specific key if Firebase user is available
        this.favoritesKey = 'accommodationFavorites';
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (user) {
                this.favoritesKey = `accommodationFavorites_${user.uid}`;
            }
        }
        console.log('Using accommodation favorites key:', this.favoritesKey);
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.addFavoriteHearts());
        } else {
            this.addFavoriteHearts();
        }
    }

    addFavoriteHearts() {
        const accommodationItems = document.querySelectorAll('.accomodation_item');
        
        accommodationItems.forEach((item, index) => {
            // Create unique ID for each accommodation
            const accommodationId = this.generateAccommodationId(item, index);
            
            // Extract property details
            const propertyDetails = this.extractPropertyDetails(item, accommodationId);
            
            // Create heart element
            const heartElement = document.createElement('div');
            heartElement.className = 'accommodation-favorite-heart';
            heartElement.setAttribute('data-accommodation-id', accommodationId);
            heartElement.setAttribute('title', 'Add to favorites');
            heartElement.innerHTML = '<i class="fa fa-heart"></i>';
            
            // Add click handler
            heartElement.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleFavorite(accommodationId, heartElement, propertyDetails);
            });
            
            // Add to the image container
            const hotelImg = item.querySelector('.hotel_img');
            if (hotelImg) {
                hotelImg.style.position = 'relative';
                hotelImg.appendChild(heartElement);
            }
            
            // Load and apply favorite status
            const isFavorite = this.loadFavoriteStatus(accommodationId);
            if (isFavorite) {
                heartElement.classList.add('favorited');
            }
        });
    }

    extractPropertyDetails(item, accommodationId) {
        const titleElement = item.querySelector('h4.sec_h4');
        const locationElement = item.querySelector('h5 small');
        const imageElement = item.querySelector('.hotel_img img');
        const linkElement = item.querySelector('.hotel_img a');
        
        return {
            id: accommodationId,
            title: titleElement ? titleElement.textContent.trim() : 'Unknown Property',
            location: locationElement ? locationElement.textContent.trim() : 'Unknown Location',
            image: imageElement ? imageElement.src : '../image/room5_263x270.png',
            link: linkElement ? linkElement.href : '#',
            savedAt: new Date().toISOString()
        };
    }

    generateAccommodationId(item, index) {
        // Try to get a unique identifier from the accommodation name
        const titleElement = item.querySelector('h4.sec_h4');
        const locationElement = item.querySelector('h5 small');
        
        let identifier = '';
        if (titleElement) {
            identifier = titleElement.textContent.trim().toLowerCase().replace(/\s+/g, '-');
        }
        if (locationElement) {
            identifier += '-' + locationElement.textContent.trim().toLowerCase().replace(/\s+/g, '-');
        }
        
        // Fallback to index if no clear identifier
        if (!identifier) {
            identifier = `accommodation-${index}`;
        }
        
        // Create hash to ensure uniqueness
        return this.hashCode(identifier);
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString();
    }

    toggleFavorite(accommodationId, heartElement, propertyDetails) {
        const isFavorite = heartElement.classList.contains('favorited');
        
        if (isFavorite) {
            heartElement.classList.remove('favorited');
            this.showNotification('Removed from favorites', 'info');
            this.removeSavedProperty(accommodationId);
        } else {
            heartElement.classList.add('favorited');
            this.showNotification('Added to favorites', 'success');
            this.savePropertyToDashboard(propertyDetails);
        }
        
        // Save favorite status to localStorage
        this.saveFavoriteStatus(accommodationId, !isFavorite);
    }

    savePropertyToDashboard(propertyDetails) {
        // Use user-specific storage key
        let savedPropertiesKey = 'dashboardSavedProperties';
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (user) {
                savedPropertiesKey = `dashboardSavedProperties_${user.uid}`;
            }
        }
        
        let savedProperties = JSON.parse(localStorage.getItem(savedPropertiesKey) || '[]');
        
        // Check if property already exists
        const existingIndex = savedProperties.findIndex(p => p.id === propertyDetails.id);
        if (existingIndex === -1) {
            savedProperties.unshift(propertyDetails);
            localStorage.setItem(savedPropertiesKey, JSON.stringify(savedProperties));
            
            // Update dashboard count if dashboard is available
            this.updateDashboardSavedCount(savedProperties.length);
        }
    }

    removeSavedProperty(accommodationId) {
        // Use user-specific storage key
        let savedPropertiesKey = 'dashboardSavedProperties';
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (user) {
                savedPropertiesKey = `dashboardSavedProperties_${user.uid}`;
            }
        }
        
        let savedProperties = JSON.parse(localStorage.getItem(savedPropertiesKey) || '[]');
        
        savedProperties = savedProperties.filter(p => p.id !== accommodationId);
        localStorage.setItem(savedPropertiesKey, JSON.stringify(savedProperties));
        
        // Update dashboard count if dashboard is available
        this.updateDashboardSavedCount(savedProperties.length);
    }

    updateDashboardSavedCount(count) {
        // Update the saved properties count on dashboard if available
        const savedCountElement = document.querySelector('.dashboard-quick-card:has(.dashboard-icon:contains("🔖")) strong');
        if (savedCountElement) {
            savedCountElement.textContent = count > 0 ? `${count} Saved` : '0 Saved';
        }
    }

    saveFavoriteStatus(accommodationId, isFavorite) {
        let favorites = JSON.parse(localStorage.getItem(this.favoritesKey) || '{}');
        favorites[accommodationId] = isFavorite;
        localStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
    }

    loadFavoriteStatus(accommodationId) {
        const favorites = JSON.parse(localStorage.getItem(this.favoritesKey) || '{}');
        return favorites[accommodationId] || false;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `accommodation-favorite-notification ${type}`;
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

// Initialize the accommodation favorites system
const accommodationFavorites = new AccommodationFavorites();
