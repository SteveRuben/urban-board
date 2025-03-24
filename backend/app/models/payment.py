# backend/models/payment.py
from datetime import datetime
from app import db

class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscriptions.id'), nullable=True)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), nullable=False, default='EUR')
    payment_method = db.Column(db.String(50), nullable=False)  # stripe, paypal, etc.
    payment_status = db.Column(db.String(20), nullable=False)  # completed, pending, failed
    external_payment_id = db.Column(db.String(100), nullable=True)
    payment_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    invoice_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    subscription = db.relationship('Subscription', backref='payments')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'subscription_id': self.subscription_id,
            'amount': self.amount,
            'currency': self.currency,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'external_payment_id': self.external_payment_id,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'invoice_url': self.invoice_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }