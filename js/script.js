/* Load Real Users from localStorage */

function loadUsersFromStorage() {
  const users = [];
  
  // Get all localStorage keys that match user pattern
  const userKeys = Object.keys(localStorage).filter(key => key.startsWith('uniroomi_user_'));
  
  userKeys.forEach(key => {
    try {
      const userData = JSON.parse(localStorage.getItem(key));
      if (userData) {
        users.push({
          name: userData.displayName || userData.email,
          email: userData.email,
          password: '🔐 Authenticated', // User has secure authentication
          role: userData.role || 'guest',
          uid: userData.uid,
          createdAt: userData.createdAt,
          suspended: userData.suspended || false // Add suspension status
        });
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  });
  
  return users;
}

/* Separate users by role */

let allUsers = loadUsersFromStorage();

function getUsersByRole() {
  const hosts = allUsers.filter(user => user.role === 'host');
  const guests = allUsers.filter(user => user.role === 'guest');
  return { hosts, guests };
}

/* Load Pending Properties from localStorage */

function loadPendingProperties() {
  const pendingProperties = [];
  
  // Get all localStorage keys that match host listings pattern
  const hostListingKeys = Object.keys(localStorage).filter(key => key.startsWith('host_listings_'));
  
  hostListingKeys.forEach(key => {
    try {
      const listings = JSON.parse(localStorage.getItem(key));
      if (listings && Array.isArray(listings)) {
        // Filter for pending approval listings
        const pendingListings = listings.filter(listing => listing.status === 'pending approval');
        pendingListings.forEach(listing => {
          pendingProperties.push({
            id: listing.id,
            name: listing.title,
            location: `${listing.city}, ${listing.province}`,
            address: listing.address,
            hostId: listing.hostId,
            hostName: listing.hostName,
            hostEmail: listing.hostEmail,
            hostCellphone: listing.hostCellphone,
            price: listing.singlePrice || listing.doublePrice || '0',
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            guests: listing.guests,
            description: listing.description,
            createdAt: listing.createdAt,
            storageKey: key
          });
        });
      }
    } catch (error) {
      console.error('Error parsing listings data:', error);
    }
  });
  
  return pendingProperties;
}

/* Sample Properties */

let properties = [
  {name:"Student Lodge",location:"Durban"},
  {name:"Varsity Apartments",location:"Westville"},
  {name:"Campus View Rooms",location:"Glenwood"}
];

/* Render Users */

function renderUsers(){

  let hostTable=document.getElementById("hostsTable");
  let guestTable=document.getElementById("guestsTable");

  hostTable.innerHTML="<tr><th>Name</th><th>Email</th><th>Password</th><th>Status</th><th>Actions</th></tr>";
  guestTable.innerHTML="<tr><th>Name</th><th>Email</th><th>Password</th><th>Status</th><th>Actions</th></tr>";

  // Reload users from storage to get latest data
  allUsers = loadUsersFromStorage();
  const { hosts, guests } = getUsersByRole();

  // Update statistics
  updateUserStats(hosts.length, guests.length);

  hosts.forEach((user,i)=>{

    const statusClass = user.suspended ? 'suspended' : 'active';
    const statusText = user.suspended ? '🚫 Suspended' : '✅ Active';
    const suspendBtnText = user.suspended ? 'Unsuspend' : 'Suspend';
    const suspendBtnClass = user.suspended ? 'unsuspend' : 'suspend';

    hostTable.innerHTML+=`
    <tr class="${user.suspended ? 'suspended-row' : ''}">
    <td>${user.name}</td>
    <td>${user.email}</td>
    <td>${user.password}</td>
    <td><span class="${statusClass}">${statusText}</span></td>
    <td>
    <button class="${suspendBtnClass}" onclick="suspendUser('host',${i})">${suspendBtnText}</button>
    <button class="delete" onclick="deleteUser('host',${i})">Delete</button>
    </td>
    </tr>
    `;

  });

  guests.forEach((user,i)=>{

    const statusClass = user.suspended ? 'suspended' : 'active';
    const statusText = user.suspended ? '🚫 Suspended' : '✅ Active';
    const suspendBtnText = user.suspended ? 'Unsuspend' : 'Suspend';
    const suspendBtnClass = user.suspended ? 'unsuspend' : 'suspend';

    guestTable.innerHTML+=`
    <tr class="${user.suspended ? 'suspended-row' : ''}">
    <td>${user.name}</td>
    <td>${user.email}</td>
    <td>${user.password}</td>
    <td><span class="${statusClass}">${statusText}</span></td>
    <td>
    <button class="${suspendBtnClass}" onclick="suspendUser('guest',${i})">${suspendBtnText}</button>
    <button class="delete" onclick="deleteUser('guest',${i})">Delete</button>
    </td>
    </tr>
    `;

  });

}

/* Update User Statistics */

function updateUserStats(hostCount, guestCount) {
  document.getElementById('hostCount').textContent = hostCount;
  document.getElementById('guestCount').textContent = guestCount;
  document.getElementById('totalCount').textContent = hostCount + guestCount;
}

/* Delete User */

function deleteUser(type,index){

  // Reload users to get current data
  allUsers = loadUsersFromStorage();
  const { hosts, guests } = getUsersByRole();
  
  // Get the user to delete
  const userToDelete = type === "host" ? hosts[index] : guests[index];
  
  if (userToDelete && userToDelete.uid) {
    // Remove user from localStorage
    localStorage.removeItem(`uniroomi_user_${userToDelete.uid}`);
    
    // Also remove any related data for this user
    const relatedKeys = Object.keys(localStorage).filter(key => 
      key.includes(userToDelete.uid) || 
      key.includes(userToDelete.email)
    );
    
    relatedKeys.forEach(key => {
      if (key !== `uniroomi_user_${userToDelete.uid}`) {
        localStorage.removeItem(key);
      }
    });
  }

  renderUsers();

}

/* Suspend User */

function suspendUser(type, index){
  
  // Reload users to get current data
  allUsers = loadUsersFromStorage();
  const { hosts, guests } = getUsersByRole();
  
  // Get the user to suspend/unsuspend
  const userToToggle = type === "host" ? hosts[index] : guests[index];
  
  if (userToToggle && userToToggle.uid) {
    // Get current user data
    const userData = JSON.parse(localStorage.getItem(`uniroomi_user_${userToToggle.uid}`));
    
    if (userData) {
      // Toggle suspension status
      userData.suspended = !userData.suspended;
      
      // Save updated user data
      localStorage.setItem(`uniroomi_user_${userToToggle.uid}`, JSON.stringify(userData));
      
      const action = userData.suspended ? 'suspended' : 'unsuspended';
      alert(`User account ${action} successfully.`);
      
      // Refresh the user list
      renderUsers();
    }
  }

}

/* Tabs */

function showUsers(type, event){

document.getElementById("hostsTable").style.display=
type=="hosts"?"table":"none";

document.getElementById("guestsTable").style.display=
type=="guests"?"table":"none";

let tabs=document.querySelectorAll(".tab");

tabs.forEach(t=>t.classList.remove("active-tab"));

event.target.classList.add("active-tab");
}

/* Render Properties */
// renderUsers() and renderProperties() are now called from initializeDashboard() after auth check
function renderProperties(){
let list=document.getElementById("propertyList");
list.innerHTML="";
// ... (rest of the function remains the same)
properties = loadPendingProperties();

if (properties.length === 0) {
  list.innerHTML = `
    <div class="no-pending-properties">
      <p>No pending property listings at the moment.</p>
    </div>
  `;
  return;
}

properties.forEach((p,i)=>{

list.innerHTML+=`
<div class="property">
<div>
<strong>${p.name}</strong><br>
<small>📍 ${p.address}, ${p.location}</small><br>
<small>👤 Host: ${p.hostName} (${p.hostEmail})</small><br>
<small>📞 ${p.hostCellphone}</small><br>
<small>🏠 ${p.bedrooms} bed, ${p.bathrooms} bath, sleeps ${p.guests}</small><br>
<small>💰 R${p.price}/month</small>
</div>

<div>
<button class="approve" onclick="approveProperty(${i})">Approve</button>
<button class="decline" onclick="declineProperty(${i})">Decline</button>
</div>
</div>
`;

});

}

function approveProperty(i){
  
  const property = properties[i];
  
  if (property && property.storageKey && property.id) {
    try {
      // Get the host's listings from localStorage
      const listings = JSON.parse(localStorage.getItem(property.storageKey) || '[]');
      
      // Find and update the specific listing
      const listingIndex = listings.findIndex(listing => listing.id === property.id);
      if (listingIndex !== -1) {
        listings[listingIndex].status = 'approved';
        listings[listingIndex].approvedAt = new Date().toISOString();
        
        // Save back to localStorage
        localStorage.setItem(property.storageKey, JSON.stringify(listings));
        
        alert(`Property "${property.name}" has been approved!`);
        
        // Refresh the properties list
        renderProperties();
      } else {
        alert('Error: Property not found in host listings.');
      }
    } catch (error) {
      console.error('Error approving property:', error);
      alert('Error approving property. Please try again.');
    }
  } else {
    alert('Invalid property data.');
  }

}

function declineProperty(i){
  
  const property = properties[i];
  
  if (property && property.storageKey && property.id) {
    if (confirm(`Are you sure you want to decline "${property.name}"? This will remove the listing.`)) {
      try {
        // Get the host's listings from localStorage
        const listings = JSON.parse(localStorage.getItem(property.storageKey) || '[]');
        
        // Remove the specific listing
        const filteredListings = listings.filter(listing => listing.id !== property.id);
        
        // Save back to localStorage
        localStorage.setItem(property.storageKey, JSON.stringify(filteredListings));
        
        alert(`Property "${property.name}" has been declined and removed.`);
        
        // Refresh the properties list
        renderProperties();
      } catch (error) {
        console.error('Error declining property:', error);
        alert('Error declining property. Please try again.');
      }
    }
  } else {
    alert('Invalid property data.');
  }

}

/* Mobile Menu */

function toggleMenu(){

document.getElementById("sidebar").classList.toggle("active");

}

function closeMenu(){

document.getElementById("sidebar").classList.remove("active");

}

/* Mobile Menu - Set up only after authentication */
function setupMobileMenu() {
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
    
    document.addEventListener('click', function(event) {
        const sidebar = document.getElementById('sidebar');
        const menuBtn = document.querySelector('.menu-btn');
        
        if (window.innerWidth <= 768 && 
            !sidebar.contains(event.target) && 
            !menuBtn.contains(event.target) && 
            sidebar.classList.contains('active')) {
            closeMenu();
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // DOM is ready; auth state monitoring happens in the main auth.onAuthStateChanged block below
});

/* Admin Authentication */

// Firebase configuration (same as admin.html)
const firebaseConfig = {
    apiKey: "AIzaSyA4BFHNLe0LB0itiZ392YjefYPoDYznBdw",
    authDomain: "uniroomi-e1216.firebaseapp.com",
    projectId: "uniroomi-e1216",
    storageBucket: "uniroomi-e1216.appspot.com",
    messagingSenderId: "495800480757",
    appId: "1:495800480757:web:d2a02ba1c115c40c23e6bc"
};

// Initialize Firebase only if not already initialized
    
    // Check admin authentication on page load (no Firebase auth check)
    // We rely only on localStorage session since Firebase is signed out immediately after login
    function checkAdminAuthentication() {
        console.log("Checking admin authentication...");
        
        // Check if user has admin session in localStorage
        const adminSession = JSON.parse(localStorage.getItem("adminSession") || "{}");
        console.log("Admin session:", adminSession);
        
        if (!adminSession.uid || !adminSession.email) {
            console.log("No admin session found, redirecting to login");
            // No admin session, redirect to login
            window.location.href = "admin.html";
            return;
        }
        
        // Check if session is still valid (less than 24 hours)
        const loginTime = new Date(adminSession.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        console.log("Session age (hours):", hoursDiff);
        
        if (hoursDiff >= 24) {
            console.log("Session expired, redirecting to login");
            // Session expired, redirect to login
            localStorage.removeItem("adminSession");
            window.location.href = "admin.html";
            return;
        }
        
        // Check if user is admin (specific admin email)
        if (adminSession.email !== "uniroomi@proton.me") {
            console.log("User is not admin, redirecting to login. Email:", adminSession.email);
            // User is not admin, redirect to login
            localStorage.removeItem("adminSession");
            window.location.href = "admin.html";
            return;
        }
        
        console.log("Admin session valid, initializing dashboard");
        // Admin session is valid, initialize dashboard
        initializeDashboard();
    }

    // Check authentication on page load
    checkAdminAuthentication();

    // Admin logout function
    async function adminLogout() {
        try {
            // Clear admin session
            localStorage.removeItem("adminSession");
            // Clear any main site user data to prevent cross-contamination
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('uniroomi_user_') || key.startsWith('host_listings_')) {
                    localStorage.removeItem(key);
                }
            });
            // Redirect to admin login
            window.location.href = "admin.html";
        } catch (error) {
            console.error("Logout error:", error);
            // Force cleanup even if logout fails
            localStorage.removeItem("adminSession");
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('uniroomi_user_') || key.startsWith('host_listings_')) {
                    localStorage.removeItem(key);
                }
            });
            window.location.href = "admin.html";
        }
    }

// Initialize dashboard only after authentication
function initializeDashboard() {
    renderUsers();
    renderProperties();
    setupMobileMenu();
    
    // Set up auto-refresh intervals
    setInterval(function() {
        renderUsers();
    }, 5000);
    
    setInterval(function() {
        renderProperties();
    }, 5000);
    
    // Also refresh when page becomes visible
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            renderUsers();
            renderProperties();
        }
    });
}

/* Admin Login */

document.getElementById("loginForm").addEventListener("submit", function(e){

e.preventDefault();

let username = document.getElementById("username").value;
let password = document.getElementById("password").value;
let error = document.getElementById("error");

/* Example admin login */

let adminUser = "admin";
let adminPass = "123456";

if(username === adminUser && password === adminPass){

window.location.href = "admin-dashboard.html";

}else{

error.innerText = "Invalid username or password";

}

});