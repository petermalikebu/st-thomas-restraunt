# St. Thomas Square Restaurant Management System

A comprehensive restaurant management system with separate admin and customer portals, built with Flask backend and modern frontend technologies.

## Features

### Admin Portal
- **Authentication System**: Secure login/registration for admin and chef accounts
- **Dashboard**: Overview of orders, revenue, and inventory status
- **Menu Management**: Add, edit, and remove menu items with categories and pricing
- **Event Management**: Create and manage restaurant events
- **Inventory Management**: Track stock levels and manage suppliers
- **Order Management**: View and process customer orders
- **User Management**: Manage admin and chef accounts

### Customer Portal
- **Menu Browsing**: View menu items with filtering by category
- **Shopping Cart**: Add items to cart and manage quantities
- **Order Placement**: Complete checkout process with customer information
- **Events Viewing**: Browse upcoming restaurant events
- **About Section**: Restaurant information and contact details
- **Responsive Design**: Mobile-friendly interface

## Technology Stack

### Backend
- **Flask**: Python web framework
- **SQLAlchemy**: Database ORM
- **Flask-CORS**: Cross-origin resource sharing
- **SQLite**: Database (easily replaceable with PostgreSQL/MySQL)
- **Werkzeug**: Password hashing and security

### Frontend
- **HTML5**: Modern semantic markup
- **CSS3**: Advanced styling with gradients, animations, and responsive design
- **JavaScript**: Interactive functionality and API integration
- **Font Awesome**: Icon library

## Installation and Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

### Step 1: Extract and Navigate
```bash
unzip st_thomas_restaurant.zip
cd st_thomas_restaurant
```

### Step 2: Create Virtual Environment
```bash
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Initialize Database
The database will be automatically created when you first run the application.

### Step 5: Run the Application
```bash
python src/main.py
```

The application will start on `http://localhost:5002`

## Usage

### First Time Setup

1. **Access Admin Portal**: Navigate to `http://localhost:5002`
2. **Create Admin Account**: Click "Register here" and create an admin account
3. **Login**: Use your credentials to access the admin dashboard

### Admin Portal Usage

1. **Dashboard**: View system overview and statistics
2. **Menu Management**: 
   - Add new menu items with name, price, description, and category
   - Edit existing items
   - Mark items as available/unavailable
3. **Event Management**:
   - Create events with title, description, date, and time
   - Upload event images
   - Set special menu items for events
4. **Inventory Management**:
   - Track ingredient stock levels
   - Set low stock alerts
   - Manage supplier information
5. **Order Management**:
   - View incoming orders
   - Update order status
   - Process payments

### Customer Portal Usage

1. **Access Customer Portal**: Navigate to `http://localhost:5002/customer.html`
2. **Browse Menu**: View available items and filter by category
3. **Add to Cart**: Select items and quantities
4. **Checkout**: Complete order with customer information
5. **View Events**: Check upcoming restaurant events

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout

### Menu Management
- `GET /api/menu` - Get all menu items
- `POST /api/menu` - Create new menu item (Admin only)
- `PUT /api/menu/<id>` - Update menu item (Admin only)
- `DELETE /api/menu/<id>` - Delete menu item (Admin only)

### Event Management
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event (Admin only)
- `PUT /api/events/<id>` - Update event (Admin only)
- `DELETE /api/events/<id>` - Delete event (Admin only)

### Order Management
- `GET /api/orders` - Get orders (Admin only)
- `POST /api/orders` - Create new order
- `PUT /api/orders/<id>` - Update order status (Admin only)

### Inventory Management
- `GET /api/inventory` - Get inventory items (Admin only)
- `POST /api/inventory` - Add inventory item (Admin only)
- `PUT /api/inventory/<id>` - Update inventory item (Admin only)

## Database Schema

### Users Table
- `id`: Primary key
- `username`: Unique username
- `email`: User email
- `password_hash`: Hashed password
- `role`: User role (admin/chef)
- `is_active`: Account status
- `created_at`: Registration timestamp

### Menu Items Table
- `id`: Primary key
- `name`: Item name
- `description`: Item description
- `price`: Item price
- `category`: Item category
- `is_available`: Availability status
- `image_url`: Item image URL
- `created_at`: Creation timestamp

### Events Table
- `id`: Primary key
- `title`: Event title
- `description`: Event description
- `event_date`: Event date
- `event_time`: Event time
- `image_url`: Event image URL
- `is_active`: Event status

### Orders Table
- `id`: Primary key
- `customer_name`: Customer name
- `customer_email`: Customer email
- `customer_phone`: Customer phone
- `order_type`: Order type (dine_in/takeaway/delivery)
- `status`: Order status
- `total_amount`: Total order amount
- `special_instructions`: Special requests
- `created_at`: Order timestamp

### Inventory Table
- `id`: Primary key
- `item_name`: Ingredient name
- `quantity`: Current stock
- `unit`: Measurement unit
- `low_stock_threshold`: Alert threshold
- `supplier`: Supplier information
- `last_updated`: Last update timestamp

## Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///database/app.db
FLASK_ENV=development
```

### Database Configuration
To use a different database (PostgreSQL/MySQL), update the `DATABASE_URL` in the configuration.

## Security Features

- **Password Hashing**: Secure password storage using Werkzeug
- **Session Management**: Secure user sessions
- **Role-Based Access**: Different permissions for admin and chef roles
- **CORS Protection**: Configured for secure cross-origin requests
- **Input Validation**: Server-side validation for all inputs

## Deployment

### Production Deployment

1. **Set Environment Variables**:
   ```bash
   export FLASK_ENV=production
   export SECRET_KEY=your-production-secret-key
   ```

2. **Use Production Database**:
   Update `DATABASE_URL` to point to your production database

3. **Use Production WSGI Server**:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 src.main:app
   ```

### Docker Deployment (Optional)

Create a `Dockerfile`:
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "src.main:app"]
```

## Troubleshooting

### Common Issues

1. **Database Errors**: Delete `src/database/app.db` and restart the application
2. **Port Already in Use**: Change the port in `src/main.py`
3. **Permission Errors**: Ensure proper file permissions for the database directory
4. **Module Not Found**: Ensure virtual environment is activated and dependencies are installed

### Logs
Check the console output for detailed error messages and debugging information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For support and questions, please contact:
- Email: admin@stthomassquare.com
- Phone: (555) 123-4567

## Version History

- **v1.0.0**: Initial release with full admin and customer portal functionality
- Complete authentication system
- Menu and event management
- Order processing
- Inventory tracking
- Responsive design

---

**St. Thomas Square Restaurant Management System** - Experience culinary excellence in the heart of the city.

