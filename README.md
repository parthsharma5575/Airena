# AIrena - Your AI Playground

AIrena is a cutting-edge platform that brings together various AI technologies in one place. Our mission is to make AI accessible and fun for everyone.

## Features

- 🔐 Secure Authentication with OTP Verification
- 💬 Interactive AI Chat
- 🎮 AI-Powered Games
- 📚 Educational Quizzes
- 🎨 Creative AI Tools
- 🎥 Screen Recording Capabilities

## Getting Started

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/airena.git
cd airena
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```
FLASK_APP=main.py
FLASK_ENV=development
SECRET_KEY=your-secret-key
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

5. Initialize the database:
```bash
flask db init
flask db migrate
flask db upgrade
```

6. Run the application:
```bash
python main.py
```

The application will be available at `http://localhost:5001`

## Project Structure

```
airena/
├── static/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── animations.js
│   └── images/
├── templates/
│   ├── auth/
│   │   ├── login.html
│   │   ├── signup.html
│   │   ├── forgot_password.html
│   │   └── reset_password.html
│   ├── base.html
│   └── index.html
├── models.py
├── auth.py
├── main.py
└── requirements.txt
```

## Team

- Mokshit Kaushik - Lead Developer
- Sumukhi Tripathi - UI/UX Designer
- Kanishka Sharma - AI Engineer
- Parth Sharma - Project Manager

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Flask - Web framework
- SQLAlchemy - Database ORM
- GSAP - Animation library
- Bootstrap - UI framework 