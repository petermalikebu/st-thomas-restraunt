// Global state
let cart = [];
let menuItems = [];
let events = [];

// API Base URL
const API_BASE = '/api';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadMenuItems();
    loadEvents();
    updateCartDisplay();
    setupSmoothScrolling();
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Mobile menu
    document.getElementById('mobileMenuBtn').addEventListener('click', toggleMobileMenu);
    
    // Cart
    document.getElementById('cartBtn').addEventListener('click', toggleCart);
    document.getElementById('closeCartBtn').addEventListener('click', closeCart);
    document.getElementById('cartOverlay').addEventListener('click', closeCart);
    document.getElementById('checkoutBtn').addEventListener('click', showCheckout);
    
    // Checkout
    document.getElementById('closeCheckoutBtn').addEventListener('click', closeCheckout);
    document.getElementById('checkoutForm').addEventListener('submit', handleCheckout);
    
    // Menu filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleMenuFilter);
    });
    
    // Scroll navigation
    window.addEventListener('scroll', updateActiveNavigation);
}

function setupSmoothScrolling() {
    // Update active navigation based on scroll position
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    function updateActiveNav() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.pageYOffset >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', updateActiveNav);
}

function handleNavigation(e) {
    e.preventDefault();
    const targetId = e.target.getAttribute('href').substring(1);
    scrollToSection(targetId);
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offsetTop = section.offsetTop - 70; // Account for fixed navbar
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

function updateActiveNavigation() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.pageYOffset >= sectionTop) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

function toggleMobileMenu() {
    // Mobile menu functionality can be implemented here
    console.log('Mobile menu toggle');
}

async function loadMenuItems() {
    try {
        showLoading('menuGrid');
        const response = await fetch(`${API_BASE}/menu?available=true`);
        if (response.ok) {
            menuItems = await response.json();
            displayMenuItems(menuItems);
        } else {
            showError('Failed to load menu items');
        }
    } catch (error) {
        console.error('Error loading menu items:', error);
        showError('Network error while loading menu');
    }
}

function displayMenuItems(items) {
    const container = document.getElementById('menuGrid');
    
    if (items.length === 0) {
        container.innerHTML = '<div class="text-center"><p>No menu items available at the moment.</p></div>';
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="menu-item" data-category="${item.category}">
            <div class="menu-item-image">
                ${item.image_url ? 
                    `<img src="${item.image_url}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">` :
                    `<i class="fas fa-utensils"></i>`
                }
            </div>
            <div class="menu-item-content">
                <div class="menu-item-category">${item.category}</div>
                <div class="menu-item-header">
                    <div class="menu-item-title">${item.name}</div>
                    <div class="menu-item-price">$${item.price.toFixed(2)}</div>
                </div>
                <div class="menu-item-description">
                    ${item.description || 'Delicious dish prepared with care'}
                </div>
                <div class="menu-item-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="changeQuantity(${item.id}, -1)">-</button>
                        <input type="number" class="quantity-input" id="qty-${item.id}" value="1" min="1" max="10">
                        <button class="quantity-btn" onclick="changeQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button class="add-to-cart-btn" onclick="addToCart(${item.id})">
                        <i class="fas fa-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function handleMenuFilter(e) {
    const category = e.target.dataset.category;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Filter menu items
    if (category === '') {
        displayMenuItems(menuItems);
    } else {
        const filteredItems = menuItems.filter(item => item.category === category);
        displayMenuItems(filteredItems);
    }
}

function changeQuantity(itemId, change) {
    const input = document.getElementById(`qty-${itemId}`);
    let currentValue = parseInt(input.value);
    let newValue = currentValue + change;
    
    if (newValue < 1) newValue = 1;
    if (newValue > 10) newValue = 10;
    
    input.value = newValue;
}

function addToCart(itemId) {
    const item = menuItems.find(item => item.id === itemId);
    const quantityInput = document.getElementById(`qty-${itemId}`);
    const quantity = parseInt(quantityInput.value);
    
    if (!item) return;
    
    // Check if item already in cart
    const existingItem = cart.find(cartItem => cartItem.id === itemId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: quantity
        });
    }
    
    updateCartDisplay();
    showAlert('Item added to cart!', 'success');
    
    // Reset quantity to 1
    quantityInput.value = 1;
}

function updateCartDisplay() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    
    // Update cart items
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <p>Add some delicious items from our menu!</p>
            </div>
        `;
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="updateCartItemQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateCartItemQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
    
    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total.toFixed(2);
    
    // Enable/disable checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.disabled = cart.length === 0;
}

function updateCartItemQuantity(itemId, change) {
    const item = cart.find(cartItem => cartItem.id === itemId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(itemId);
    } else {
        updateCartDisplay();
    }
}

function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCartDisplay();
    showAlert('Item removed from cart', 'info');
}

function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    
    cartSidebar.classList.toggle('active');
    cartOverlay.classList.toggle('active');
}

function closeCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
}

function showCheckout() {
    if (cart.length === 0) {
        showAlert('Your cart is empty', 'error');
        return;
    }
    
    const modal = document.getElementById('checkoutModal');
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    // Populate checkout items
    checkoutItems.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <span>${item.name} x${item.quantity}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');
    
    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    checkoutTotal.textContent = total.toFixed(2);
    
    modal.classList.add('active');
    closeCart();
}

function closeCheckout() {
    document.getElementById('checkoutModal').classList.remove('active');
}

async function handleCheckout(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const orderData = Object.fromEntries(formData);
    
    // Prepare order items
    const orderItems = cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity
    }));
    
    const order = {
        ...orderData,
        order_items: orderItems
    };
    
    try {
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
        
        if (response.ok) {
            const result = await response.json();
            showAlert(`Order placed successfully! Order #${result.id}`, 'success');
            
            // Clear cart and close modal
            cart = [];
            updateCartDisplay();
            closeCheckout();
            
            // Reset form
            e.target.reset();
            
            // Show order confirmation
            showOrderConfirmation(result);
        } else {
            const error = await response.json();
            showAlert(error.error || 'Failed to place order', 'error');
        }
    } catch (error) {
        console.error('Error placing order:', error);
        showAlert('Network error. Please try again.', 'error');
    }
}

function showOrderConfirmation(order) {
    const modal = document.getElementById('checkoutModal');
    const modalContent = modal.querySelector('.modal-content');
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3><i class="fas fa-check-circle" style="color: #28a745;"></i> Order Confirmed!</h3>
            <button onclick="closeCheckout()" class="close-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="order-confirmation">
            <div class="confirmation-details">
                <h4>Order #${order.id}</h4>
                <p><strong>Customer:</strong> ${order.customer_name}</p>
                <p><strong>Type:</strong> ${order.order_type}</p>
                <p><strong>Total:</strong> $${order.total_amount.toFixed(2)}</p>
                <p><strong>Status:</strong> <span class="badge badge-warning">Pending</span></p>
            </div>
            <div class="confirmation-message">
                <p>Thank you for your order! We'll start preparing your food shortly.</p>
                <p>You can check your order status by keeping this order number: <strong>#${order.id}</strong></p>
            </div>
            <button onclick="closeCheckout()" class="btn btn-primary btn-full">
                <i class="fas fa-check"></i> Continue Browsing
            </button>
        </div>
    `;
    
    modal.classList.add('active');
}

async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE}/events?active=true&upcoming=true`);
        if (response.ok) {
            events = await response.json();
            displayEvents(events);
        } else {
            console.error('Failed to load events');
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

function displayEvents(events) {
    const container = document.getElementById('eventsGrid');
    
    if (events.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1;">
                <p>No upcoming events at the moment. Check back soon!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = events.map(event => `
        <div class="event-card">
            <div class="event-image">
                ${event.image_url ? 
                    `<img src="${event.image_url}" alt="${event.title}" style="width: 100%; height: 100%; object-fit: cover;">` :
                    `<i class="fas fa-calendar-alt"></i>`
                }
            </div>
            <div class="event-content">
                <div class="event-date">${new Date(event.event_date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</div>
                <div class="event-title">${event.title}</div>
                ${event.event_time ? `<div class="event-time"><i class="fas fa-clock"></i> ${event.event_time}</div>` : ''}
                <div class="event-description">${event.description || 'Join us for this special event!'}</div>
            </div>
        </div>
    `).join('');
}

function showLoading(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
        </div>
    `;
}

function showError(message) {
    showAlert(message, 'error');
}

function showAlert(message, type = 'info') {
    // Remove existing alerts
    document.querySelectorAll('.alert').forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    // Add to top of page
    document.body.insertBefore(alertDiv, document.body.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
    
    // Make alert clickable to dismiss
    alertDiv.addEventListener('click', () => {
        alertDiv.remove();
    });
}

// Utility functions
function formatPrice(price) {
    return `$${price.toFixed(2)}`;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Expose functions to global scope for onclick handlers
window.changeQuantity = changeQuantity;
window.addToCart = addToCart;
window.updateCartItemQuantity = updateCartItemQuantity;
window.removeFromCart = removeFromCart;
window.scrollToSection = scrollToSection;
window.closeCheckout = closeCheckout;

