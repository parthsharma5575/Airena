"""
Quiz generator module for Fluvio Quiz feature.
Provides functions to load and generate quizzes with multiple-choice questions from text files.
"""

import os
import random

# Path to questions directory
QUESTIONS_DIR = os.path.join(os.path.dirname(__file__), 'questions')

def list_available_genres():
    """List all available question genres based on files in the questions directory."""
    genres = []
    if os.path.exists(QUESTIONS_DIR):
        for filename in os.listdir(QUESTIONS_DIR):
            if filename.endswith('.txt'):
                genre = os.path.splitext(filename)[0]
                genres.append(genre)
    return sorted(genres)

def load_questions_from_file(genre):
    """Load questions from a specific genre file."""
    filepath = os.path.join(QUESTIONS_DIR, f"{genre}.txt")
    questions = []
    
    if not os.path.exists(filepath):
        return []
    
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            for line in file:
                # Skip empty lines
                line = line.strip()
                if not line:
                    continue
                
                # Parse question format: Question|Correct Answer|Wrong1|Wrong2|Wrong3
                parts = line.split('|')
                if len(parts) >= 5:
                    question = parts[0]
                    correct_answer = parts[1]
                    wrong_answers = parts[2:5]
                    
                    questions.append({
                        'question': question,
                        'correct': correct_answer,
                        'wrong': wrong_answers
                    })
    except Exception as e:
        print(f"Error loading questions for {genre}: {str(e)}")
        return []
    
    return questions

def get_random_questions(genre, count=5):
    """Get a set of random questions from a specific genre."""
    all_questions = load_questions_from_file(genre)
    
    if not all_questions:
        return []
    
    # Limit count to available questions
    count = min(count, len(all_questions))
    
    # Randomly select questions
    selected_questions = random.sample(all_questions, count)
    return selected_questions

def format_for_api(questions):
    """Format questions for API response."""
    formatted_questions = []
    
    for idx, q in enumerate(questions):
        # Create options by combining correct and wrong answers
        options = [q['correct']] + q['wrong']
        
        # Remember the correct answer index (0)
        correct_idx = 0
        
        # Shuffle options
        random.shuffle(options)
        
        # Find new index of correct answer after shuffle
        correct_idx = options.index(q['correct'])
        
        # Format the question
        formatted_questions.append({
            'question': q['question'],
            'options': options,
            'correct': correct_idx
        })
    
    return formatted_questions

def generate_quiz(genre, question_count=5):
    """Generate a complete quiz for the given genre."""
    # Check if genre exists
    if genre not in list_available_genres():
        return None
    
    # Get random questions
    questions = get_random_questions(genre, question_count)
    
    if not questions:
        return None
    
    # Format questions for API
    formatted_questions = format_for_api(questions)
    
    # Create quiz data
    quiz = {
        'topic': genre.capitalize(),
        'questions': formatted_questions
    }
    
    return quiz