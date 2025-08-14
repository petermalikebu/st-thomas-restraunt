// Global state
let currentUser = null;
let currentSection = 'dashboard';

// API Base URL
const API_BASE = '/api';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    checkAuthStatus();
}

function setupEventListeners() {
    // Login/Register forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('showRegister').addEventListener('click', () => showScreen('registerScreen'));
    document.getElementById('showLogin').addEventListener('click', () => showScreen('loginScreen'));
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Navigation
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Modal
    document.getElementById('modalOverlay').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Add buttons
    document.getElementById('addMenuItemBtn').addEventListener('click', () => showMenuItemModal());
    document.getElementById('addEventBtn').addEventListener('click', () => showEventModal());
    document.getElementById('addInventoryItemBtn').addEventListener('click', () => showInventoryModal());
    document.getElementById('addUserBtn').addEventListener('click', () => showUserModal());
    
    // Filters
    document.getElementById('categoryFilter').addEventListener('change', filterMenuItems);
    document.getElementById('menuSearch').addEventListener('input', filterMenuItems);
    document.getElementById('inventoryFilter').addEventListener('change', filterInventoryItems);
    document.getElementById('lowStockFilter').addEventListener('click', toggleLowStockFilter);
    document.getElementById('orderStatusFilter').addEventListener('change', filterOrders);
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`);
        if (response.ok) {
            currentUser = await response.json();
            showDashboard();
        } else {
            showScreen('loginScreen');
        }
    } catch (error) {
        showScreen('loginScreen');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            currentUser = result.user;
            showDashboard();
        } else {
            const error = await response.json();
            showAlert(error.error || 'Login failed', 'error');
        }
    } catch (error) {
        showAlert('Network error. Please try again.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showAlert('Registration successful! Please login.', 'success');
            showScreen('loginScreen');
        } else {
            const error = await response.json();
            showAlert(error.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showAlert('Network error. Please try again.', 'error');
    }
}

async function handleLogout() {
    try {
        await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
        currentUser = null;
        showScreen('loginScreen');
    } catch (error) {
        showAlert('Logout failed', 'error');
    }
}

function showDashboard() {
    showScreen('dashboardScreen');
    updateUserInfo();
    setupUserPermissions();
    loadDashboardData();
    showSection('dashboard');
}

function updateUserInfo() {
    document.getElementById('userInfo').textContent = 
        `${currentUser.username} (${currentUser.role})`;
}

function setupUserPermissions() {
    const usersMenuItem = document.getElementById('usersMenuItem');
    if (currentUser.role !== 'admin') {
        usersMenuItem.style.display = 'none';
    }
}

function handleNavigation(e) {
    e.preventDefault();
    const section = e.target.closest('a').dataset.section;
    showSection(section);
}

function showSection(sectionName) {
    // Update navigation
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionName}Section`).classList.add('active');
    
    currentSection = sectionName;
    
    // Load section data
    switch(sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'menu':
            loadMenuItems();
            loadMenuCategories();
            break;
        case 'events':
            loadEvents();
            break;
        case 'inventory':
            loadInventoryItems();
            loadInventoryCategories();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'users':
            loadUsers();
            break;
    }
}

async function loadDashboardData() {
    try {
        // Load order stats
        const statsResponse = await fetch(`${API_BASE}/orders/stats`);
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            document.getElementById('totalOrders').textContent = stats.total_orders;
            document.getElementById('pendingOrders').textContent = stats.pending_orders;
            document.getElementById('totalRevenue').textContent = `$${stats.total_revenue.toFixed(2)}`;
        }
        
        // Load low stock items
        const lowStockResponse = await fetch(`${API_BASE}/inventory/low-stock`);
        if (lowStockResponse.ok) {
            const lowStockItems = await lowStockResponse.json();
            document.getElementById('lowStockItems').textContent = lowStockItems.length;
        }
        
        // Load recent orders
        const ordersResponse = await fetch(`${API_BASE}/orders?status=pending`);
        if (ordersResponse.ok) {
            const orders = await ordersResponse.json();
            displayRecentOrders(orders.slice(0, 5));
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function displayRecentOrders(orders) {
    const container = document.getElementById('recentOrdersList');
    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">Order #${order.id}</span>
                <span class="order-status status-${order.status}">${order.status}</span>
            </div>
            <p><strong>Customer:</strong> ${order.customer_name}</p>
            <p><strong>Total:</strong> $${order.total_amount.toFixed(2)}</p>
            <p><strong>Type:</strong> ${order.order_type}</p>
        </div>
    `).join('');
}

async function loadMenuItems() {
    try {
        const response = await fetch(`${API_BASE}/menu`);
        if (response.ok) {
            const items = await response.json();
            displayMenuItems(items);
        }
    } catch (error) {
        console.error('Error loading menu items:', error);
    }
}

function displayMenuItems(items) {
    const container = document.getElementById('menuItemsList');
    container.innerHTML = items.map(item => `
        <div class="item-card">
            <div class="item-header">
                <div>
                    <div class="item-title">${item.name}</div>
                    <div class="item-subtitle">${item.category}</div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-sm btn-outline" onclick="editMenuItem(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMenuItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="item-content">
                <p>${item.description || 'No description'}</p>
            </div>
            <div class="item-meta">
                <span><strong>$${item.price.toFixed(2)}</strong></span>
                <span class="badge ${item.is_available ? 'badge-success' : 'badge-danger'}">
                    ${item.is_available ? 'Available' : 'Unavailable'}
                </span>
            </div>
        </div>
    `).join('');
}

async function loadMenuCategories() {
    try {
        const response = await fetch(`${API_BASE}/menu/categories`);
        if (response.ok) {
            const categories = await response.json();
            const select = document.getElementById('categoryFilter');
            select.innerHTML = '<option value="">All Categories</option>' +
                categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function filterMenuItems() {
    const category = document.getElementById('categoryFilter').value;
    const search = document.getElementById('menuSearch').value.toLowerCase();
    
    let url = `${API_BASE}/menu`;
    const params = new URLSearchParams();
    
    if (category) params.append('category', category);
    if (search) {
        // For search, we'll filter client-side for simplicity
        loadMenuItems().then(() => {
            const cards = document.querySelectorAll('#menuItemsList .item-card');
            cards.forEach(card => {
                const title = card.querySelector('.item-title').textContent.toLowerCase();
                const description = card.querySelector('.item-content p').textContent.toLowerCase();
                const matches = title.includes(search) || description.includes(search);
                card.style.display = matches ? 'block' : 'none';
            });
        });
        return;
    }
    
    if (params.toString()) url += '?' + params.toString();
    
    fetch(url)
        .then(response => response.json())
        .then(items => displayMenuItems(items))
        .catch(error => console.error('Error filtering menu items:', error));
}

async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE}/events`);
        if (response.ok) {
            const events = await response.json();
            displayEvents(events);
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

function displayEvents(events) {
    const container = document.getElementById('eventsList');
    container.innerHTML = events.map(event => `
        <div class="item-card">
            <div class="item-header">
                <div>
                    <div class="item-title">${event.title}</div>
                    <div class="item-subtitle">${new Date(event.event_date).toLocaleDateString()}</div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-sm btn-outline" onclick="editEvent(${event.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEvent(${event.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="item-content">
                <p>${event.description || 'No description'}</p>
                ${event.event_time ? `<p><strong>Time:</strong> ${event.event_time}</p>` : ''}
            </div>
            <div class="item-meta">
                <span class="badge ${event.is_active ? 'badge-success' : 'badge-danger'}">
                    ${event.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>
        </div>
    `).join('');
}

async function loadInventoryItems() {
    try {
        const response = await fetch(`${API_BASE}/inventory`);
        if (response.ok) {
            const items = await response.json();
            displayInventoryItems(items);
        }
    } catch (error) {
        console.error('Error loading inventory items:', error);
    }
}

function displayInventoryItems(items) {
    const container = document.getElementById('inventoryItemsList');
    container.innerHTML = items.map(item => `
        <div class="item-card">
            <div class="item-header">
                <div>
                    <div class="item-title">${item.name}</div>
                    <div class="item-subtitle">${item.category}</div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-sm btn-outline" onclick="editInventoryItem(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="addStock(${item.id})">
                        <i class="fas fa-plus"></i> Stock
                    </button>
                </div>
            </div>
            <div class="item-content">
                <p><strong>Current Stock:</strong> ${item.current_stock} ${item.unit}</p>
                <p><strong>Minimum Stock:</strong> ${item.minimum_stock} ${item.unit}</p>
                ${item.supplier_name ? `<p><strong>Supplier:</strong> ${item.supplier_name}</p>` : ''}
            </div>
            <div class="item-meta">
                <span><strong>$${item.unit_cost.toFixed(2)}/${item.unit}</strong></span>
                <span class="badge ${item.is_low_stock ? 'badge-warning' : 'badge-success'}">
                    ${item.is_low_stock ? 'Low Stock' : 'In Stock'}
                </span>
            </div>
        </div>
    `).join('');
}

async function loadInventoryCategories() {
    try {
        const response = await fetch(`${API_BASE}/inventory/categories`);
        if (response.ok) {
            const categories = await response.json();
            const select = document.getElementById('inventoryFilter');
            select.innerHTML = '<option value="">All Categories</option>' +
                categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading inventory categories:', error);
    }
}

function filterInventoryItems() {
    const category = document.getElementById('inventoryFilter').value;
    let url = `${API_BASE}/inventory`;
    if (category) url += `?category=${category}`;
    
    fetch(url)
        .then(response => response.json())
        .then(items => displayInventoryItems(items))
        .catch(error => console.error('Error filtering inventory items:', error));
}

function toggleLowStockFilter() {
    const button = document.getElementById('lowStockFilter');
    const isActive = button.classList.contains('active');
    
    if (isActive) {
        button.classList.remove('active');
        loadInventoryItems();
    } else {
        button.classList.add('active');
        fetch(`${API_BASE}/inventory/low-stock`)
            .then(response => response.json())
            .then(items => displayInventoryItems(items))
            .catch(error => console.error('Error loading low stock items:', error));
    }
}

async function loadOrders() {
    try {
        const response = await fetch(`${API_BASE}/orders`);
        if (response.ok) {
            const orders = await response.json();
            displayOrders(orders);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function displayOrders(orders) {
    const container = document.getElementById('ordersList');
    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">Order #${order.id}</span>
                <select class="order-status-select" data-order-id="${order.id}">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                    <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
            <div class="order-info">
                <p><strong>Customer:</strong> ${order.customer_name}</p>
                ${order.customer_phone ? `<p><strong>Phone:</strong> ${order.customer_phone}</p>` : ''}
                <p><strong>Type:</strong> ${order.order_type}</p>
                <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
            </div>
            <div class="order-items">
                <h4>Items:</h4>
                ${order.order_items.map(item => `
                    <div class="order-item">
                        <span>${item.name} x${item.quantity}</span>
                        <span>$${item.total.toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            ${order.special_instructions ? `<p><strong>Special Instructions:</strong> ${order.special_instructions}</p>` : ''}
            <div class="order-footer">
                <span class="order-total">Total: $${order.total_amount.toFixed(2)}</span>
            </div>
        </div>
    `).join('');
    
    // Add event listeners for status changes
    document.querySelectorAll('.order-status-select').forEach(select => {
        select.addEventListener('change', updateOrderStatus);
    });
}

async function updateOrderStatus(e) {
    const orderId = e.target.dataset.orderId;
    const newStatus = e.target.value;
    
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            showAlert('Order status updated successfully', 'success');
        } else {
            showAlert('Failed to update order status', 'error');
        }
    } catch (error) {
        showAlert('Network error', 'error');
    }
}

function filterOrders() {
    const status = document.getElementById('orderStatusFilter').value;
    let url = `${API_BASE}/orders`;
    if (status) url += `?status=${status}`;
    
    fetch(url)
        .then(response => response.json())
        .then(orders => displayOrders(orders))
        .catch(error => console.error('Error filtering orders:', error));
}

async function loadUsers() {
    if (currentUser.role !== 'admin') return;
    
    try {
        const response = await fetch(`${API_BASE}/users`);
        if (response.ok) {
            const users = await response.json();
            displayUsers(users);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function displayUsers(users) {
    const container = document.getElementById('usersList');
    container.innerHTML = users.map(user => `
        <div class="item-card">
            <div class="item-header">
                <div>
                    <div class="item-title">${user.username}</div>
                    <div class="item-subtitle">${user.email}</div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-sm btn-outline" onclick="editUser(${user.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="item-meta">
                <span class="badge ${user.role === 'admin' ? 'badge-info' : 'badge-success'}">${user.role}</span>
                <span class="badge ${user.is_active ? 'badge-success' : 'badge-danger'}">
                    ${user.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>
        </div>
    `).join('');
}

// Modal functions
function showModal(title, content) {
    document.getElementById('modalContent').innerHTML = `
        <div class="modal-header">
            <h3>${title}</h3>
            <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        ${content}
    `;
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

function showMenuItemModal(item = null) {
    const isEdit = item !== null;
    const title = isEdit ? 'Edit Menu Item' : 'Add Menu Item';
    
    const content = `
        <form id="menuItemForm" class="modal-form">
            <div class="form-group">
                <label for="itemName">Name</label>
                <input type="text" id="itemName" name="name" value="${item?.name || ''}" required>
            </div>
            <div class="form-group">
                <label for="itemDescription">Description</label>
                <textarea id="itemDescription" name="description" rows="3">${item?.description || ''}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="itemPrice">Price</label>
                    <input type="number" id="itemPrice" name="price" step="0.01" value="${item?.price || ''}" required>
                </div>
                <div class="form-group">
                    <label for="itemCategory">Category</label>
                    <select id="itemCategory" name="category" required>
                        <option value="">Select Category</option>
                        <option value="appetizer" ${item?.category === 'appetizer' ? 'selected' : ''}>Appetizer</option>
                        <option value="main" ${item?.category === 'main' ? 'selected' : ''}>Main Course</option>
                        <option value="dessert" ${item?.category === 'dessert' ? 'selected' : ''}>Dessert</option>
                        <option value="beverage" ${item?.category === 'beverage' ? 'selected' : ''}>Beverage</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label for="itemImageUrl">Image URL</label>
                <input type="url" id="itemImageUrl" name="image_url" value="${item?.image_url || ''}">
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" name="is_available" ${item?.is_available !== false ? 'checked' : ''}>
                    Available
                </label>
            </div>
            <button type="submit" class="btn btn-primary">
                ${isEdit ? 'Update' : 'Add'} Menu Item
            </button>
        </form>
    `;
    
    showModal(title, content);
    
    document.getElementById('menuItemForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        data.is_available = formData.has('is_available');
        data.price = parseFloat(data.price);
        
        try {
            const url = isEdit ? `${API_BASE}/menu/${item.id}` : `${API_BASE}/menu`;
            const method = isEdit ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                closeModal();
                loadMenuItems();
                showAlert(`Menu item ${isEdit ? 'updated' : 'added'} successfully`, 'success');
            } else {
                const error = await response.json();
                showAlert(error.error || 'Operation failed', 'error');
            }
        } catch (error) {
            showAlert('Network error', 'error');
        }
    });
}

function showEventModal(event = null) {
    const isEdit = event !== null;
    const title = isEdit ? 'Edit Event' : 'Add Event';
    
    const content = `
        <form id="eventForm" class="modal-form">
            <div class="form-group">
                <label for="eventTitle">Title</label>
                <input type="text" id="eventTitle" name="title" value="${event?.title || ''}" required>
            </div>
            <div class="form-group">
                <label for="eventDescription">Description</label>
                <textarea id="eventDescription" name="description" rows="3">${event?.description || ''}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="eventDate">Date</label>
                    <input type="date" id="eventDate" name="event_date" value="${event?.event_date ? event.event_date.split('T')[0] : ''}" required>
                </div>
                <div class="form-group">
                    <label for="eventTime">Time</label>
                    <input type="text" id="eventTime" name="event_time" value="${event?.event_time || ''}" placeholder="e.g., 7:00 PM - 10:00 PM">
                </div>
            </div>
            <div class="form-group">
                <label for="eventImageUrl">Image URL</label>
                <input type="url" id="eventImageUrl" name="image_url" value="${event?.image_url || ''}">
            </div>
            <div class="form-group">
                <label for="specialMenuItems">Special Menu Items (JSON)</label>
                <textarea id="specialMenuItems" name="special_menu_items" rows="3" placeholder='[{"name": "Special Dish", "price": 25.99}]'>${event?.special_menu_items || ''}</textarea>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" name="is_active" ${event?.is_active !== false ? 'checked' : ''}>
                    Active
                </label>
            </div>
            <button type="submit" class="btn btn-primary">
                ${isEdit ? 'Update' : 'Add'} Event
            </button>
        </form>
    `;
    
    showModal(title, content);
    
    document.getElementById('eventForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        data.is_active = formData.has('is_active');
        data.event_date = new Date(data.event_date).toISOString();
        
        try {
            const url = isEdit ? `${API_BASE}/events/${event.id}` : `${API_BASE}/events`;
            const method = isEdit ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                closeModal();
                loadEvents();
                showAlert(`Event ${isEdit ? 'updated' : 'added'} successfully`, 'success');
            } else {
                const error = await response.json();
                showAlert(error.error || 'Operation failed', 'error');
            }
        } catch (error) {
            showAlert('Network error', 'error');
        }
    });
}

function showInventoryModal(item = null) {
    const isEdit = item !== null;
    const title = isEdit ? 'Edit Inventory Item' : 'Add Inventory Item';
    
    const content = `
        <form id="inventoryForm" class="modal-form">
            <div class="form-group">
                <label for="inventoryName">Name</label>
                <input type="text" id="inventoryName" name="name" value="${item?.name || ''}" required>
            </div>
            <div class="form-group">
                <label for="inventoryDescription">Description</label>
                <textarea id="inventoryDescription" name="description" rows="2">${item?.description || ''}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="inventoryCategory">Category</label>
                    <select id="inventoryCategory" name="category" required>
                        <option value="">Select Category</option>
                        <option value="meat" ${item?.category === 'meat' ? 'selected' : ''}>Meat</option>
                        <option value="vegetables" ${item?.category === 'vegetables' ? 'selected' : ''}>Vegetables</option>
                        <option value="dairy" ${item?.category === 'dairy' ? 'selected' : ''}>Dairy</option>
                        <option value="spices" ${item?.category === 'spices' ? 'selected' : ''}>Spices</option>
                        <option value="beverages" ${item?.category === 'beverages' ? 'selected' : ''}>Beverages</option>
                        <option value="other" ${item?.category === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="inventoryUnit">Unit</label>
                    <select id="inventoryUnit" name="unit" required>
                        <option value="">Select Unit</option>
                        <option value="kg" ${item?.unit === 'kg' ? 'selected' : ''}>Kilograms</option>
                        <option value="lbs" ${item?.unit === 'lbs' ? 'selected' : ''}>Pounds</option>
                        <option value="pieces" ${item?.unit === 'pieces' ? 'selected' : ''}>Pieces</option>
                        <option value="liters" ${item?.unit === 'liters' ? 'selected' : ''}>Liters</option>
                        <option value="bottles" ${item?.unit === 'bottles' ? 'selected' : ''}>Bottles</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="currentStock">Current Stock</label>
                    <input type="number" id="currentStock" name="current_stock" step="0.01" value="${item?.current_stock || 0}" required>
                </div>
                <div class="form-group">
                    <label for="minimumStock">Minimum Stock</label>
                    <input type="number" id="minimumStock" name="minimum_stock" step="0.01" value="${item?.minimum_stock || 0}" required>
                </div>
            </div>
            <div class="form-group">
                <label for="unitCost">Unit Cost</label>
                <input type="number" id="unitCost" name="unit_cost" step="0.01" value="${item?.unit_cost || 0}" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="supplierName">Supplier Name</label>
                    <input type="text" id="supplierName" name="supplier_name" value="${item?.supplier_name || ''}">
                </div>
                <div class="form-group">
                    <label for="supplierContact">Supplier Contact</label>
                    <input type="text" id="supplierContact" name="supplier_contact" value="${item?.supplier_contact || ''}">
                </div>
            </div>
            <button type="submit" class="btn btn-primary">
                ${isEdit ? 'Update' : 'Add'} Inventory Item
            </button>
        </form>
    `;
    
    showModal(title, content);
    
    document.getElementById('inventoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        // Convert numeric fields
        data.current_stock = parseFloat(data.current_stock);
        data.minimum_stock = parseFloat(data.minimum_stock);
        data.unit_cost = parseFloat(data.unit_cost);
        
        try {
            const url = isEdit ? `${API_BASE}/inventory/${item.id}` : `${API_BASE}/inventory`;
            const method = isEdit ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                closeModal();
                loadInventoryItems();
                showAlert(`Inventory item ${isEdit ? 'updated' : 'added'} successfully`, 'success');
            } else {
                const error = await response.json();
                showAlert(error.error || 'Operation failed', 'error');
            }
        } catch (error) {
            showAlert('Network error', 'error');
        }
    });
}

function showUserModal(user = null) {
    if (currentUser.role !== 'admin') return;
    
    const isEdit = user !== null;
    const title = isEdit ? 'Edit User' : 'Add User';
    
    const content = `
        <form id="userForm" class="modal-form">
            <div class="form-group">
                <label for="userUsername">Username</label>
                <input type="text" id="userUsername" name="username" value="${user?.username || ''}" required>
            </div>
            <div class="form-group">
                <label for="userEmail">Email</label>
                <input type="email" id="userEmail" name="email" value="${user?.email || ''}" required>
            </div>
            ${!isEdit ? `
            <div class="form-group">
                <label for="userPassword">Password</label>
                <input type="password" id="userPassword" name="password" required>
            </div>
            ` : ''}
            <div class="form-row">
                <div class="form-group">
                    <label for="userRole">Role</label>
                    <select id="userRole" name="role" required>
                        <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="chef" ${user?.role === 'chef' ? 'selected' : ''}>Chef</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="is_active" ${user?.is_active !== false ? 'checked' : ''}>
                        Active
                    </label>
                </div>
            </div>
            <button type="submit" class="btn btn-primary">
                ${isEdit ? 'Update' : 'Add'} User
            </button>
        </form>
    `;
    
    showModal(title, content);
    
    document.getElementById('userForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        data.is_active = formData.has('is_active');
        
        try {
            const url = isEdit ? `${API_BASE}/users/${user.id}` : `${API_BASE}/users`;
            const method = isEdit ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                closeModal();
                loadUsers();
                showAlert(`User ${isEdit ? 'updated' : 'added'} successfully`, 'success');
            } else {
                const error = await response.json();
                showAlert(error.error || 'Operation failed', 'error');
            }
        } catch (error) {
            showAlert('Network error', 'error');
        }
    });
}

// Edit functions
async function editMenuItem(id) {
    try {
        const response = await fetch(`${API_BASE}/menu/${id}`);
        if (response.ok) {
            const item = await response.json();
            showMenuItemModal(item);
        }
    } catch (error) {
        showAlert('Error loading menu item', 'error');
    }
}

async function editEvent(id) {
    try {
        const response = await fetch(`${API_BASE}/events/${id}`);
        if (response.ok) {
            const event = await response.json();
            showEventModal(event);
        }
    } catch (error) {
        showAlert('Error loading event', 'error');
    }
}

async function editInventoryItem(id) {
    try {
        const response = await fetch(`${API_BASE}/inventory/${id}`);
        if (response.ok) {
            const item = await response.json();
            showInventoryModal(item);
        }
    } catch (error) {
        showAlert('Error loading inventory item', 'error');
    }
}

async function editUser(id) {
    if (currentUser.role !== 'admin') return;
    
    try {
        const response = await fetch(`${API_BASE}/users/${id}`);
        if (response.ok) {
            const user = await response.json();
            showUserModal(user);
        }
    } catch (error) {
        showAlert('Error loading user', 'error');
    }
}

// Delete functions
async function deleteMenuItem(id) {
    if (confirm('Are you sure you want to delete this menu item?')) {
        try {
            const response = await fetch(`${API_BASE}/menu/${id}`, { method: 'DELETE' });
            if (response.ok) {
                loadMenuItems();
                showAlert('Menu item deleted successfully', 'success');
            } else {
                showAlert('Error deleting menu item', 'error');
            }
        } catch (error) {
            showAlert('Network error', 'error');
        }
    }
}

async function deleteEvent(id) {
    if (confirm('Are you sure you want to delete this event?')) {
        try {
            const response = await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
            if (response.ok) {
                loadEvents();
                showAlert('Event deleted successfully', 'success');
            } else {
                showAlert('Error deleting event', 'error');
            }
        } catch (error) {
            showAlert('Network error', 'error');
        }
    }
}

async function deleteUser(id) {
    if (currentUser.role !== 'admin') return;
    
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            const response = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
            if (response.ok) {
                loadUsers();
                showAlert('User deleted successfully', 'success');
            } else {
                showAlert('Error deleting user', 'error');
            }
        } catch (error) {
            showAlert('Network error', 'error');
        }
    }
}

// Stock management
function addStock(id) {
    const content = `
        <form id="stockForm" class="modal-form">
            <div class="form-group">
                <label for="movementType">Movement Type</label>
                <select id="movementType" name="movement_type" required>
                    <option value="in">Stock In</option>
                    <option value="out">Stock Out</option>
                    <option value="adjustment">Adjustment</option>
                </select>
            </div>
            <div class="form-group">
                <label for="quantity">Quantity</label>
                <input type="number" id="quantity" name="quantity" step="0.01" required>
            </div>
            <div class="form-group">
                <label for="reason">Reason</label>
                <input type="text" id="reason" name="reason" placeholder="e.g., Delivery, Usage, Correction">
            </div>
            <button type="submit" class="btn btn-primary">Update Stock</button>
        </form>
    `;
    
    showModal('Update Stock', content);
    
    document.getElementById('stockForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        data.quantity = parseFloat(data.quantity);
        
        try {
            const response = await fetch(`${API_BASE}/inventory/${id}/stock-movement`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                closeModal();
                loadInventoryItems();
                showAlert('Stock updated successfully', 'success');
            } else {
                const error = await response.json();
                showAlert(error.error || 'Error updating stock', 'error');
            }
        } catch (error) {
            showAlert('Network error', 'error');
        }
    });
}

// Alert system
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Remove existing alerts
    document.querySelectorAll('.alert').forEach(alert => alert.remove());
    
    // Add new alert
    const container = document.querySelector('.main-content');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

