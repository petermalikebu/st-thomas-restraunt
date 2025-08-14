from src.models.user import db
from datetime import datetime

class InventoryItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50), nullable=False)  # meat, vegetables, dairy, spices, etc.
    unit = db.Column(db.String(20), nullable=False)  # kg, lbs, pieces, liters, etc.
    current_stock = db.Column(db.Float, nullable=False, default=0)
    minimum_stock = db.Column(db.Float, nullable=False, default=0)
    unit_cost = db.Column(db.Float, nullable=False, default=0)
    supplier_name = db.Column(db.String(100))
    supplier_contact = db.Column(db.String(100))
    last_restocked = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<InventoryItem {self.name}>'

    def is_low_stock(self):
        return self.current_stock <= self.minimum_stock

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'unit': self.unit,
            'current_stock': self.current_stock,
            'minimum_stock': self.minimum_stock,
            'unit_cost': self.unit_cost,
            'supplier_name': self.supplier_name,
            'supplier_contact': self.supplier_contact,
            'last_restocked': self.last_restocked.isoformat() if self.last_restocked else None,
            'is_low_stock': self.is_low_stock(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class StockMovement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    inventory_item_id = db.Column(db.Integer, db.ForeignKey('inventory_item.id'), nullable=False)
    movement_type = db.Column(db.String(20), nullable=False)  # 'in', 'out', 'adjustment'
    quantity = db.Column(db.Float, nullable=False)
    reason = db.Column(db.String(200))
    performed_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    inventory_item = db.relationship('InventoryItem', backref='movements')
    user = db.relationship('User', backref='stock_movements')

    def __repr__(self):
        return f'<StockMovement {self.movement_type} {self.quantity}>'

    def to_dict(self):
        return {
            'id': self.id,
            'inventory_item_id': self.inventory_item_id,
            'movement_type': self.movement_type,
            'quantity': self.quantity,
            'reason': self.reason,
            'performed_by': self.performed_by,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

