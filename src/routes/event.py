from flask import Blueprint, jsonify, request, session
from src.models.user import User, db
from src.models.event import Event
from datetime import datetime
from functools import wraps

event_bp = Blueprint('event', __name__)

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

@event_bp.route('/events', methods=['GET'])
def get_events():
    """Public endpoint to get all active events"""
    active_only = request.args.get('active', 'true').lower() == 'true'
    upcoming_only = request.args.get('upcoming', 'false').lower() == 'true'
    
    query = Event.query
    
    if active_only:
        query = query.filter_by(is_active=True)
    
    if upcoming_only:
        query = query.filter(Event.event_date >= datetime.utcnow())
    
    events = query.order_by(Event.event_date).all()
    return jsonify([event.to_dict() for event in events])

@event_bp.route('/events', methods=['POST'])
@admin_required
def create_event():
    data = request.json
    
    # Parse event date
    try:
        event_date = datetime.fromisoformat(data['event_date'].replace('Z', '+00:00'))
    except (ValueError, KeyError):
        return jsonify({'error': 'Invalid event_date format. Use ISO format.'}), 400
    
    event = Event(
        title=data['title'],
        description=data.get('description', ''),
        event_date=event_date,
        event_time=data.get('event_time', ''),
        image_url=data.get('image_url', ''),
        is_active=data.get('is_active', True),
        special_menu_items=data.get('special_menu_items', ''),
        created_by=session['user_id']
    )
    
    db.session.add(event)
    db.session.commit()
    return jsonify(event.to_dict()), 201

@event_bp.route('/events/<int:event_id>', methods=['GET'])
def get_event(event_id):
    """Public endpoint to get a specific event"""
    event = Event.query.get_or_404(event_id)
    return jsonify(event.to_dict())

@event_bp.route('/events/<int:event_id>', methods=['PUT'])
@admin_required
def update_event(event_id):
    event = Event.query.get_or_404(event_id)
    data = request.json
    
    event.title = data.get('title', event.title)
    event.description = data.get('description', event.description)
    event.event_time = data.get('event_time', event.event_time)
    event.image_url = data.get('image_url', event.image_url)
    event.is_active = data.get('is_active', event.is_active)
    event.special_menu_items = data.get('special_menu_items', event.special_menu_items)
    
    if 'event_date' in data:
        try:
            event.event_date = datetime.fromisoformat(data['event_date'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Invalid event_date format. Use ISO format.'}), 400
    
    db.session.commit()
    return jsonify(event.to_dict())

@event_bp.route('/events/<int:event_id>', methods=['DELETE'])
@admin_required
def delete_event(event_id):
    event = Event.query.get_or_404(event_id)
    db.session.delete(event)
    db.session.commit()
    return '', 204

@event_bp.route('/events/<int:event_id>/toggle-active', methods=['PATCH'])
@admin_required
def toggle_event_active(event_id):
    event = Event.query.get_or_404(event_id)
    event.is_active = not event.is_active
    db.session.commit()
    return jsonify(event.to_dict())

