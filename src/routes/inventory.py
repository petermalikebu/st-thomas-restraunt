from flask import Blueprint, jsonify, request, session
from src.models.user import User, db
from src.models.inventory import InventoryItem, StockMovement
from datetime import datetime
from functools import wraps

inventory_bp = Blueprint('inventory', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        user = User.query.get(session['user_id'])
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@inventory_bp.route('/inventory', methods=['GET'])
@login_required
def get_inventory():
    low_stock_only = request.args.get('low_stock', 'false').lower() == 'true'
    category = request.args.get('category')
    
    query = InventoryItem.query
    
    if category:
        query = query.filter_by(category=category)
    
    items = query.order_by(InventoryItem.category, InventoryItem.name).all()
    
    if low_stock_only:
        items = [item for item in items if item.is_low_stock()]
    
    return jsonify([item.to_dict() for item in items])

@inventory_bp.route('/inventory/categories', methods=['GET'])
@login_required
def get_inventory_categories():
    """Get all unique inventory categories"""
    categories = db.session.query(InventoryItem.category).distinct().all()
    return jsonify([cat[0] for cat in categories])

@inventory_bp.route('/inventory/low-stock', methods=['GET'])
@login_required
def get_low_stock_items():
    """Get all items with low stock"""
    items = InventoryItem.query.all()
    low_stock_items = [item for item in items if item.is_low_stock()]
    return jsonify([item.to_dict() for item in low_stock_items])

@inventory_bp.route('/inventory', methods=['POST'])
@admin_required
def create_inventory_item():
    data = request.json
    
    item = InventoryItem(
        name=data['name'],
        description=data.get('description', ''),
        category=data['category'],
        unit=data['unit'],
        current_stock=data.get('current_stock', 0),
        minimum_stock=data.get('minimum_stock', 0),
        unit_cost=data.get('unit_cost', 0),
        supplier_name=data.get('supplier_name', ''),
        supplier_contact=data.get('supplier_contact', '')
    )
    
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201

@inventory_bp.route('/inventory/<int:item_id>', methods=['GET'])
@login_required
def get_inventory_item(item_id):
    item = InventoryItem.query.get_or_404(item_id)
    return jsonify(item.to_dict())

@inventory_bp.route('/inventory/<int:item_id>', methods=['PUT'])
@admin_required
def update_inventory_item(item_id):
    item = InventoryItem.query.get_or_404(item_id)
    data = request.json
    
    item.name = data.get('name', item.name)
    item.description = data.get('description', item.description)
    item.category = data.get('category', item.category)
    item.unit = data.get('unit', item.unit)
    item.minimum_stock = data.get('minimum_stock', item.minimum_stock)
    item.unit_cost = data.get('unit_cost', item.unit_cost)
    item.supplier_name = data.get('supplier_name', item.supplier_name)
    item.supplier_contact = data.get('supplier_contact', item.supplier_contact)
    
    db.session.commit()
    return jsonify(item.to_dict())

@inventory_bp.route('/inventory/<int:item_id>', methods=['DELETE'])
@admin_required
def delete_inventory_item(item_id):
    item = InventoryItem.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return '', 204

@inventory_bp.route('/inventory/<int:item_id>/stock-movement', methods=['POST'])
@login_required
def create_stock_movement(item_id):
    item = InventoryItem.query.get_or_404(item_id)
    data = request.json
    
    movement_type = data['movement_type']  # 'in', 'out', 'adjustment'
    quantity = float(data['quantity'])
    
    # Create stock movement record
    movement = StockMovement(
        inventory_item_id=item_id,
        movement_type=movement_type,
        quantity=quantity,
        reason=data.get('reason', ''),
        performed_by=session['user_id']
    )
    
    # Update current stock
    if movement_type == 'in':
        item.current_stock += quantity
        item.last_restocked = datetime.utcnow()
    elif movement_type == 'out':
        item.current_stock -= quantity
    elif movement_type == 'adjustment':
        item.current_stock = quantity
    
    # Ensure stock doesn't go negative
    if item.current_stock < 0:
        item.current_stock = 0
    
    db.session.add(movement)
    db.session.commit()
    
    return jsonify({
        'movement': movement.to_dict(),
        'updated_item': item.to_dict()
    }), 201

@inventory_bp.route('/inventory/<int:item_id>/movements', methods=['GET'])
@login_required
def get_stock_movements(item_id):
    movements = StockMovement.query.filter_by(inventory_item_id=item_id).order_by(StockMovement.created_at.desc()).all()
    return jsonify([movement.to_dict() for movement in movements])

@inventory_bp.route('/inventory/reports/usage', methods=['GET'])
@admin_required
def get_usage_report():
    """Get usage report for all inventory items"""
    movements = StockMovement.query.filter_by(movement_type='out').order_by(StockMovement.created_at.desc()).limit(100).all()
    return jsonify([movement.to_dict() for movement in movements])

