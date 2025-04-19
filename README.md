# AIrena

AIrena is an AI-powered platform that provides entertainment and educational experiences through various interactive features.

## Features

- AI Chat: Chat with our advanced AI assistant powered by Groq
- Educational Quizzes: Test your knowledge with AI-generated quizzes
- AI Games: Play games enhanced with artificial intelligence
- Screen Recording: Record and share your gameplay experiences

## Installation

1. Clone the repository:
```bash
git clone https://github.com/parthsharma5575/Airena.git
cd Airena
```

2. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
Create a `.env` file with the following variables:
```
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
GROQ_API_KEY=your_groq_api_key
```

5. Initialize the database:
```bash
python reset_db.py
```

6. Run the application:
```bash
python main.py
```

## Technologies Used

- Flask: Web framework
- SQLAlchemy: Database ORM
- Groq API: AI chat functionality
- Flask-Mail: Email services
- HTML/CSS/JavaScript: Frontend development

## Contributing

Feel free to submit issues and enhancement requests.

## License

This project is licensed under the MIT License.
