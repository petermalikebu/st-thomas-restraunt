from src.models.user import db
from datetime import datetime
import json

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100), nullable=False)
    customer_email = db.Column(db.String(120))
    customer_phone = db.Column(db.String(20))
    order_items = db.Column(db.Text, nullable=False)  # JSON string of ordered items
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, confirmed, preparing, ready, completed, cancelled
    order_type = db.Column(db.String(20), nullable=False, default='dine_in')  # dine_in, takeaway, delivery
    special_instructions = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Order {self.id} - {self.customer_name}>'

    def get_order_items(self):
        try:
            return json.loads(self.order_items) if self.order_items else []
        except:
            return []

    def set_order_items(self, items):
        self.order_items = json.dumps(items)

    def to_dict(self):
        return {
            'id': self.id,
            'customer_name': self.customer_name,
            'customer_email': self.customer_email,
            'customer_phone': self.customer_phone,
            'order_items': self.get_order_items(),
            'total_amount': self.total_amount,
            'status': self.status,
            'order_type': self.order_type,
            'special_instructions': self.special_instructions,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

