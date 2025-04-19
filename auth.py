from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, PasswordResetToken, EmailVerificationToken
from datetime import datetime, timedelta
import secrets
import logging
from flask_login import login_user, logout_user, login_required, current_user
from flask_mail import Message
import os

auth = Blueprint('auth', __name__)

def send_otp_email(email, otp):
    """Send OTP email using Flask-Mail."""
    try:
        msg = Message(
            'Your AIrena Verification OTP',
            sender=current_app.config['MAIL_DEFAULT_SENDER'],
            recipients=[email]
        )
        msg.body = f"""
        Your verification OTP is: {otp}
        
        This OTP will expire in 10 minutes.
        
        If you didn't request this OTP, please ignore this email.
        """
        current_app.extensions['mail'].send(msg)
        logging.info(f"OTP email sent successfully to {email}")
        return True
    except Exception as e:
        logging.error(f"Failed to send OTP email: {str(e)}")
        return False

@auth.route('/signup', methods=['GET', 'POST'])
def signup():
    """Handle user signup."""
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return redirect(url_for('auth.login'))
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered', 'error')
            return redirect(url_for('auth.login'))
        
        user = User(name=name, email=email)
        user.set_password(password)
        
        # Generate OTP
        otp = user.generate_otp()
        
        db.session.add(user)
        db.session.commit()
        
        if send_otp_email(email, otp):
            flash('OTP sent to your email. Please check your inbox.', 'success')
            return redirect(url_for('auth.verify_otp', email=email))
        else:
            flash('Error sending OTP. Please try again.', 'error')
            return redirect(url_for('auth.login'))
    
    return render_template('auth/signup.html')

@auth.route('/verify-otp', methods=['GET', 'POST'])
def verify_otp():
    """Handle OTP verification."""
    email = request.args.get('email')
    if not email:
        return redirect(url_for('auth.signup'))
        
    if request.method == 'POST':
        otp = request.form.get('otp')
        user = User.query.filter_by(email=email).first()
        
        if not user:
            flash('User not found', 'error')
            return redirect(url_for('auth.signup'))
            
        if not user.otp or user.otp_expiry < datetime.utcnow():
            flash('OTP expired. Please request a new one.', 'error')
            return redirect(url_for('auth.login'))
            
        if user.otp != otp:
            flash('Invalid OTP', 'error')
            return redirect(url_for('auth.verify_otp', email=email))
            
        user.is_verified = True
        user.otp = None
        user.otp_expiry = None
        db.session.commit()
        
        login_user(user)
        flash('Email verified successfully', 'success')
        return redirect(url_for('index'))
        
    return render_template('auth/verify_otp.html', email=email)

@auth.route('/resend-otp', methods=['POST'])
def resend_otp():
    """Resend OTP to user's email."""
    email = request.form.get('email')
    user = User.query.filter_by(email=email).first()
    
    if not user:
        flash('User not found', 'error')
        return redirect(url_for('auth.signup'))
        
    otp = user.generate_otp()
    db.session.commit()
    
    if send_otp_email(email, otp):
        flash('New OTP sent to your email', 'success')
    else:
        flash('Error sending OTP. Please try again.', 'error')
        
    return redirect(url_for('auth.verify_otp', email=email))

@auth.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        
        if user is None or not user.check_password(password):
            flash('Invalid email or password')
            return redirect(url_for('auth.login'))
            
        if not user.is_verified:
            flash('Please verify your email first')
            return redirect(url_for('auth.verify_email'))
            
        login_user(user)
        return redirect(url_for('index'))
        
    return render_template('auth/login.html')

@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))

@auth.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email')
        user = User.query.filter_by(email=email).first()
        
        if user:
            token = secrets.token_urlsafe(32)
            reset_token = PasswordResetToken(
                user_id=user.id,
                token=token,
                expiry=datetime.utcnow() + timedelta(hours=1)
            )
            db.session.add(reset_token)
            db.session.commit()
            
            reset_link = f"{request.host_url}reset-password/{token}"
            email_body = f"""
            <html>
                <body>
                    <h2>Password Reset Request</h2>
                    <p>Click the link below to reset your password:</p>
                    <a href="{reset_link}">Reset Password</a>
                    <p>This link will expire in 1 hour.</p>
                </body>
            </html>
            """
            send_otp_email(email, token)
            
        return jsonify({'message': 'If an account exists with this email, you will receive a password reset link'})
    
    return render_template('auth/forgot_password.html')

@auth.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    reset_token = PasswordResetToken.query.filter_by(token=token, is_used=False).first()
    
    if not reset_token or reset_token.expiry < datetime.utcnow():
        return jsonify({'error': 'Invalid or expired token'}), 400
        
    if request.method == 'POST':
        password = request.form.get('password')
        user = User.query.get(reset_token.user_id)
        user.password_hash = generate_password_hash(password)
        reset_token.is_used = True
        db.session.commit()
        
        return jsonify({'message': 'Password reset successful'})
    
    return render_template('auth/reset_password.html', token=token) 