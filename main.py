import os
import logging
import importlib.util
from flask import Flask, render_template, url_for, request, jsonify, send_from_directory, redirect, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_mail import Mail, Message
from groqai.ai.api import GroqAPI
from models import db, User, PasswordResetToken
from auth import auth as auth_blueprint

# Configure logging for easier debugging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log')
    ]
)

# Create Flask app with appropriate static and template folders
app = Flask(__name__, static_folder='static', template_folder='templates')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///airena.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.urandom(24)

# Flask-Mail configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('EMAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('EMAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('EMAIL_USERNAME')

# Initialize extensions
db.init_app(app)
mail = Mail(app)

# Create database tables
with app.app_context():
    db.create_all()
    logging.info("Database tables created successfully")

# Initialize login manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Register blueprints
app.register_blueprint(auth_blueprint)

# Register screen recording routes if available
try:
    from screenpipe.routes import register_routes
    register_routes(app)
    logging.info("Successfully registered screenpipe routes")
except ImportError:
    logging.warning("screenpipe module not found, screen recording functionality will not be available")

# Initialize Groq API
try:
    groq_api = GroqAPI()
    logging.info("Groq API initialized successfully")
except Exception as e:
    logging.error(f"Failed to initialize Groq API: {str(e)}")
    groq_api = None

@app.route('/')
def index():
    """Render the main application page."""
    if not current_user.is_authenticated:
        return redirect(url_for('auth.login'))
    return render_template('index.html')

@app.route('/groq')
@login_required
def groq():
    """Render the Groq AI assistant page."""
    return render_template('groq.html')
    
@app.route('/quiz')
@login_required
def quiz():
    """Render the quiz page."""
    return send_from_directory('quiz', 'quiz.html')
    
@app.route('/quiz/<path:filename>')
@login_required
def quiz_static(filename):
    """Serve static files for the quiz."""
    return send_from_directory('quiz', filename)
    
@app.route('/templates/images/<path:filename>')
@login_required
def templates_images(filename):
    """Serve images from templates/images directory."""
    return send_from_directory('templates/images', filename)

@app.route('/game')
@login_required
def game():
    """Render the space shooter game page."""
    return render_template('game.html')

# API endpoints for the Groq AI chat functionality
@app.route('/api/groq/chat', methods=['POST'])
@login_required
def groq_chat():
    """Handle chat messages sent to Groq API."""
    data = request.json
    message = data.get('message', '')
    use_agent = data.get('use_agent', False)
    
    # Call the actual Groq API using our implementation
    response = groq_api.get_chat_response(message, use_agent)
    
    return jsonify({
        'success': True,
        'response': response
    })

@app.route('/api/groq/vision', methods=['POST'])
@login_required
def groq_vision():
    """Handle image analysis with Groq Vision API."""
    if 'image' not in request.files and 'image' not in request.json:
        return jsonify({'error': 'No image provided'}), 400
        
    if 'image' in request.files:
        image_file = request.files['image']
        image_data = image_file.read()
    else:
        # Handle base64 image data from JSON
        image_data = request.json.get('image', '')
        
    prompt = request.json.get('prompt', 'What is in this image?') if 'image' in request.json else 'What is in this image?'
    
    # Process the image using Groq API
    description = groq_api.process_image(image_data)
    
    return jsonify({
        'success': True,
        'response': description
    })

@app.route('/api/groq/speech-to-text', methods=['POST'])
@login_required
def groq_stt():
    """Handle speech-to-text conversion."""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    audio_data = audio_file.read()
    
    # Convert speech to text using Groq API
    text = groq_api.speech_to_text(audio_data)
    
    # Get response from Groq API based on the text
    response = groq_api.get_chat_response(text, False)
    
    return jsonify({
        'success': True,
        'text': text,
        'response': response
    })

@app.route('/api/groq/text-to-speech', methods=['POST'])
@login_required
def groq_tts():
    """Handle text-to-speech conversion."""
    data = request.json
    text = data.get('text', '')
    
    # Let the frontend handle text-to-speech for now
    return jsonify({
        'success': True,
        'message': 'Using browser TTS capabilities',
        'original_text': text
    })

# Groq API routes to handle direct requests from the groq.html template
@app.route('/chat', methods=['POST'])
@login_required
def chat():
    """Handle chat requests directly from groq.html"""
    data = request.json
    user_input = data.get('message', '')
    use_agent = data.get('use_agent', False)
    
    if not user_input:
        return jsonify({'error': 'No message provided'}), 400
    
    # Get response from Groq API
    response = groq_api.get_chat_response(user_input, use_agent)
    
    return jsonify({'response': response})

@app.route('/speech-to-text', methods=['POST'])
@login_required
def speech_to_text():
    """Convert speech to text - called directly from groq.html"""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    audio_data = audio_file.read()
    
    # Convert speech to text using Groq API
    text = groq_api.speech_to_text(audio_data)
    
    # Get response from Groq API based on the text
    response = groq_api.get_chat_response(text, False)
    
    return jsonify({
        'text': text,
        'response': response
    })

@app.route('/process-image', methods=['POST'])
@login_required
def process_image():
    """Process an image using Groq's vision capabilities - called directly from groq.html"""
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    image_file = request.files['image']
    image_data = image_file.read()
    
    # Process the image using Groq API
    description = groq_api.process_image(image_data)
    
    return jsonify({'description': description})

@app.route('/process-audio', methods=['POST'])
@login_required
def process_audio():
    """Process an audio file for transcription - called directly from groq.html"""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    audio_data = audio_file.read()
    
    # Process the audio using Groq API
    result = groq_api.process_audio(audio_data)
    
    return jsonify(result)

@app.route('/api/fluvio/generate-quiz', methods=['POST'])
@login_required
def generate_quiz():
    """Generate a quiz based on selected topics."""
    try:
        from quiz.quiz_fluvio import generate_quiz, list_available_genres
        
        data = request.json
        topic = data.get('topic', ' ')
        question_count = data.get('count', 5)
        
        # If requesting available topics
        if topic == 'list_genres':
            genres = list_available_genres()
            return jsonify({
                'success': True,
                'genres': genres
            })
        
        # Generate quiz from our quiz_fluvio module
        quiz_data = generate_quiz(topic, question_count)
        
        if not quiz_data:
            return jsonify({
                'success': False,
                'message': f'No questions available for topic: {topic}'
            })
        
        return jsonify({
            'success': True,
            'quiz': quiz_data
        })
    except ImportError:
        logging.warning("quiz.quiz_fluvio module not found, quiz functionality will be limited")
        return jsonify({
            'success': False,
            'message': 'Quiz functionality is not available'
        })

@app.route('/api/game/create', methods=['POST'])
@login_required
def create_game():
    """Create a new game session."""
    data = request.json
    username = data.get('username', 'Player')
    
    # In a real implementation, this would create a game session
    game_id = '12345'  # Mock game ID
    
    return jsonify({
        'success': True,
        'game_id': game_id,
        'player_id': '1',
        'message': f'Game created by {username}'
    })

@app.route('/api/game/join', methods=['POST'])
@login_required
def join_game():
    """Join an existing game session."""
    data = request.json
    game_id = data.get('game_id', '')
    username = data.get('username', 'Player')
    
    # In a real implementation, this would join an existing game
    return jsonify({
        'success': True,
        'game_id': game_id,
        'player_id': '2',
        'message': f'{username} joined game {game_id}'
    })

@app.route('/api/screenPipe/stream', methods=['POST'])
@login_required
def screen_pipe_stream():
    """Handle screen capture streaming."""
    # In a real implementation, this would handle screen capture
    return jsonify({'success': True, 'message': 'Stream started'})

# Serve static files from groqai/static
@app.route('/groqai/static/<path:filename>')
@login_required
def groqai_static(filename):
    """Serve static files from the groqai/static directory."""
    return send_from_directory('groqai/static', filename)

@app.route('/subscribe', methods=['POST'])
def subscribe():
    email = request.form.get('email')
    if email:
        try:
            msg = Message(
                'Welcome to AIrena Newsletter',
                sender=app.config['MAIL_DEFAULT_SENDER'],
                recipients=[email]
            )
            msg.body = f"""
            Thank you for subscribing to AIrena's newsletter!
            
            You'll now receive updates about:
            - New AI features and capabilities
            - Latest quizzes and games
            - Platform improvements
            - Community events
            
            Stay tuned for exciting updates!
            
            Best regards,
            The AIrena Team
            """
            mail.send(msg)
            flash('Thank you for subscribing! Check your email for confirmation.', 'success')
        except Exception as e:
            flash('Error sending subscription email. Please try again later.', 'error')
            app.logger.error(f"Newsletter subscription error: {str(e)}")
    else:
        flash('Please provide a valid email address.', 'error')
    
    return redirect(url_for('index'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=False, host='0.0.0.0', port=int(os.environ.get('PORT', 5001)))
