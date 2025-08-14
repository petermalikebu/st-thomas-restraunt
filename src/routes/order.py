from flask import Blueprint, jsonify, request, session
from src.models.user import User, db
from src.models.order import Order
from src.models.menu import MenuItem
from datetime import datetime
from functools import wraps
import json

order_bp = Blueprint('order', __name__)

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

@order_bp.route('/orders', methods=['POST'])
def create_order():
    """Public endpoint for customers to place orders"""
    data = request.json
    
    # Validate order items
    order_items = data.get('order_items', [])
    if not order_items:
        return jsonify({'error': 'Order must contain at least one item'}), 400
    
    total_amount = 0
    validated_items = []
    
    for item in order_items:
        menu_item = MenuItem.query.get(item.get('menu_item_id'))
        if not menu_item or not menu_item.is_available:
            return jsonify({'error': f'Menu item {item.get("menu_item_id")} is not available'}), 400
        
        quantity = int(item.get('quantity', 1))
        item_total = menu_item.price * quantity
        total_amount += item_total
        
        validated_items.append({
            'menu_item_id': menu_item.id,
            'name': menu_item.name,
            'price': menu_item.price,
            'quantity': quantity,
            'total': item_total
        })
    
    order = Order(
        customer_name=data['customer_name'],
        customer_email=data.get('customer_email', ''),
        customer_phone=data.get('customer_phone', ''),
        order_items=json.dumps(validated_items),
        total_amount=total_amount,
        order_type=data.get('order_type', 'dine_in'),
        special_instructions=data.get('special_instructions', '')
    )
    
    db.session.add(order)
    db.session.commit()
    return jsonify(order.to_dict()), 201

@order_bp.route('/orders', methods=['GET'])
@login_required
def get_orders():
    """Admin/staff endpoint to get all orders"""
    status = request.args.get('status')
    order_type = request.args.get('order_type')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    query = Order.query
    
    if status:
        query = query.filter_by(status=status)
    
    if order_type:
        query = query.filter_by(order_type=order_type)
    
    if date_from:
        try:
            date_from = datetime.fromisoformat(date_from)
            query = query.filter(Order.created_at >= date_from)
        except ValueError:
            pass
    
    if date_to:
        try:
            date_to = datetime.fromisoformat(date_to)
            query = query.filter(Order.created_at <= date_to)
        except ValueError:
            pass
    
    orders = query.order_by(Order.created_at.desc()).all()
    return jsonify([order.to_dict() for order in orders])

@order_bp.route('/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    """Public endpoint to get order details (for customers to check their order)"""
    order = Order.query.get_or_404(order_id)
    return jsonify(order.to_dict())

@order_bp.route('/orders/<int:order_id>/status', methods=['PATCH'])
@login_required
def update_order_status(order_id):
    """Admin/staff endpoint to update order status"""
    order = Order.query.get_or_404(order_id)
    data = request.json
    
    valid_statuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']
    new_status = data.get('status')
    
    if new_status not in valid_statuses:
        return jsonify({'error': f'Invalid status. Must be one of: {valid_statuses}'}), 400
    
    order.status = new_status
    db.session.commit()
    return jsonify(order.to_dict())

@order_bp.route('/orders/<int:order_id>', methods=['PUT'])
@admin_required
def update_order(order_id):
    """Admin endpoint to update order details"""
    order = Order.query.get_or_404(order_id)
    data = request.json
    
    order.customer_name = data.get('customer_name', order.customer_name)
    order.customer_email = data.get('customer_email', order.customer_email)
    order.customer_phone = data.get('customer_phone', order.customer_phone)
    order.order_type = data.get('order_type', order.order_type)
    order.special_instructions = data.get('special_instructions', order.special_instructions)
    
    if 'status' in data:
        valid_statuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']
        if data['status'] in valid_statuses:
            order.status = data['status']
    
    db.session.commit()
    return jsonify(order.to_dict())

@order_bp.route('/orders/<int:order_id>', methods=['DELETE'])
@admin_required
def delete_order(order_id):
    """Admin endpoint to delete an order"""
    order = Order.query.get_or_404(order_id)
    db.session.delete(order)
    db.session.commit()
    return '', 204

@order_bp.route('/orders/stats', methods=['GET'])
@admin_required
def get_order_stats():
    """Get order statistics"""
    total_orders = Order.query.count()
    pending_orders = Order.query.filter_by(status='pending').count()
    completed_orders = Order.query.filter_by(status='completed').count()
    
    # Revenue calculation
    completed_orders_list = Order.query.filter_by(status='completed').all()
    total_revenue = sum(order.total_amount for order in completed_orders_list)
    
    return jsonify({
        'total_orders': total_orders,
        'pending_orders': pending_orders,
        'completed_orders': completed_orders,
        'total_revenue': total_revenue
    })

