from flask import Blueprint, jsonify, request, session
from src.models.user import User, db
from src.models.menu import MenuItem
from functools import wraps

menu_bp = Blueprint('menu', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def chef_or_admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        user = User.query.get(session['user_id'])
        if not user or user.role not in ['admin', 'chef']:
            return jsonify({'error': 'Chef or admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@menu_bp.route('/menu', methods=['GET'])
def get_menu():
    """Public endpoint to get all available menu items"""
    category = request.args.get('category')
    available_only = request.args.get('available', 'true').lower() == 'true'
    
    query = MenuItem.query
    
    if available_only:
        query = query.filter_by(is_available=True)
    
    if category:
        query = query.filter_by(category=category)
    
    menu_items = query.order_by(MenuItem.category, MenuItem.name).all()
    return jsonify([item.to_dict() for item in menu_items])

@menu_bp.route('/menu/categories', methods=['GET'])
def get_categories():
    """Get all unique categories"""
    categories = db.session.query(MenuItem.category).distinct().all()
    return jsonify([cat[0] for cat in categories])

@menu_bp.route('/menu', methods=['POST'])
@chef_or_admin_required
def create_menu_item():
    data = request.json
    
    menu_item = MenuItem(
        name=data['name'],
        description=data.get('description', ''),
        price=data['price'],
        category=data['category'],
        image_url=data.get('image_url', ''),
        is_available=data.get('is_available', True),
        created_by=session['user_id']
    )
    
    db.session.add(menu_item)
    db.session.commit()
    return jsonify(menu_item.to_dict()), 201

@menu_bp.route('/menu/<int:item_id>', methods=['GET'])
def get_menu_item(item_id):
    """Public endpoint to get a specific menu item"""
    menu_item = MenuItem.query.get_or_404(item_id)
    return jsonify(menu_item.to_dict())

@menu_bp.route('/menu/<int:item_id>', methods=['PUT'])
@chef_or_admin_required
def update_menu_item(item_id):
    menu_item = MenuItem.query.get_or_404(item_id)
    data = request.json
    
    menu_item.name = data.get('name', menu_item.name)
    menu_item.description = data.get('description', menu_item.description)
    menu_item.price = data.get('price', menu_item.price)
    menu_item.category = data.get('category', menu_item.category)
    menu_item.image_url = data.get('image_url', menu_item.image_url)
    menu_item.is_available = data.get('is_available', menu_item.is_available)
    
    db.session.commit()
    return jsonify(menu_item.to_dict())

@menu_bp.route('/menu/<int:item_id>', methods=['DELETE'])
@chef_or_admin_required
def delete_menu_item(item_id):
    menu_item = MenuItem.query.get_or_404(item_id)
    db.session.delete(menu_item)
    db.session.commit()
    return '', 204

@menu_bp.route('/menu/<int:item_id>/toggle-availability', methods=['PATCH'])
@chef_or_admin_required
def toggle_menu_item_availability(item_id):
    menu_item = MenuItem.query.get_or_404(item_id)
    menu_item.is_available = not menu_item.is_available
    db.session.commit()
    return jsonify(menu_item.to_dict())

