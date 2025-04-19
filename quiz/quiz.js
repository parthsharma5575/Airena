// Fluvio Quiz - JavaScript

// Global variables
let topicsList = [];
let selectedTopic = null;
let quizData = null;
let currentQuestion = 0;
let correctAnswers = 0;

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Quiz interface loaded');
    
    // Fetch available topics
    fetchTopics();
    
    // Set up event listeners
    setupEventListeners();
});

// Fetch available topics from the API
function fetchTopics() {
    console.log('Fetching topics...');
    
    fetch('/api/fluvio/generate-quiz', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ topic: 'list_genres' })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Topics received:', data);
        if (data.success && data.genres) {
            topicsList = data.genres;
            renderTopics();
        } else {
            showError('Failed to load topics');
        }
    })
    .catch(error => {
        console.error('Error fetching topics:', error);
        showError('Failed to load topics');
    });
}

// Render topic cards
function renderTopics() {
    const topicsContainer = document.getElementById('topics-container');
    
    // Clear loading placeholder
    topicsContainer.innerHTML = '';
    
    // Define icons for topics
    const topicIcons = {
        mathematics: 'calculator',
        science: 'flask',
        history: 'landmark',
        geography: 'globe',
        technology: 'microchip',
        sports: 'football-ball',
        entertainment: 'film',
        business: 'chart-line',
        environment: 'leaf'
    };
    
    console.log("Rendering topic cards for:", topicsList);
    
    // Create a card for each topic
    topicsList.forEach(topic => {
        const icon = topicIcons[topic] || 'book';
        
        const topicCard = document.createElement('div');
        topicCard.className = 'col-md-4 mb-3';
        topicCard.innerHTML = `
            <div class="card h-100 topic-card fade-in" data-topic="${topic}">
                <div class="card-body text-center">
                    <div class="topic-icon">
                        <i class="fas fa-${icon}"></i>
                    </div>
                    <h5>${topic.charAt(0).toUpperCase() + topic.slice(1)}</h5>
                </div>
            </div>
        `;
        
        topicsContainer.appendChild(topicCard);
        
        // Add click event listener directly to the card
        const card = topicCard.querySelector('.topic-card');
        card.addEventListener('click', function() {
            console.log("Topic card clicked:", this.dataset.topic);
            selectTopic(this);
        });
    });
    
    // Add click event listeners again after rendering
    document.querySelectorAll('.topic-card').forEach(card => {
        card.addEventListener('click', function() {
            console.log("Topic card clicked (direct):", this.dataset.topic);
            selectTopic(this);
        });
    });
}

// Set up event listeners
function setupEventListeners() {
    // Generate quiz button
    const btnGenerateQuiz = document.getElementById('btn-generate-quiz');
    btnGenerateQuiz.addEventListener('click', generateQuiz);
    
    // Next question button
    const btnNextQuestion = document.getElementById('btn-next-question');
    btnNextQuestion.addEventListener('click', showNextQuestion);
    
    // Restart quiz button
    const btnRestartQuiz = document.getElementById('btn-restart-quiz');
    btnRestartQuiz.addEventListener('click', restartQuiz);
    
    // New topic button
    const btnNewTopic = document.getElementById('btn-new-topic');
    btnNewTopic.addEventListener('click', goToTopicSelection);
}

// Select a topic
function selectTopic(card) {
    console.log("Select topic called with card:", card);
    console.log("Topic data attribute:", card.dataset.topic);
    
    // Deselect all topics
    document.querySelectorAll('.topic-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Select this topic
    card.classList.add('selected');
    
    // Update selected topic
    selectedTopic = card.dataset.topic;
    console.log("Selected topic set to:", selectedTopic);
    
    // Enable generate button
    const btnGenerateQuiz = document.getElementById('btn-generate-quiz');
    btnGenerateQuiz.disabled = false;
    btnGenerateQuiz.innerHTML = `<span>Generate ${selectedTopic.charAt(0).toUpperCase() + selectedTopic.slice(1)} Quiz</span><i class="fas fa-chevron-right ms-2"></i>`;
}

// Generate a quiz
function generateQuiz() {
    if (!selectedTopic) return;
    
    console.log('Generating quiz for topic:', selectedTopic);
    
    // Show loading section
    showSection('quiz-loading');
    
    // Send request to API
    fetch('/api/fluvio/generate-quiz', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ topic: selectedTopic })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Quiz data received:', data);
        if (data.success && data.quiz) {
            // Store quiz data
            quizData = data.quiz;
            
            // Reset current question and score
            currentQuestion = 0;
            correctAnswers = 0;
            
            // Prepare and show first question
            prepareQuestion();
            showSection('quiz-questions');
        } else {
            // Show error and go back to topic selection
            showError(data.message || 'Failed to generate quiz');
            showSection('topic-selection');
        }
    })
    .catch(error => {
        console.error('Error generating quiz:', error);
        showError('Failed to generate quiz');
        showSection('topic-selection');
    });
}

// Prepare a question
function prepareQuestion() {
    if (!quizData || !quizData.questions || currentQuestion >= quizData.questions.length) return;
    
    const question = quizData.questions[currentQuestion];
    
    // Update quiz title
    document.getElementById('quiz-topic-title').textContent = quizData.topic;
    
    // Update question counter
    document.getElementById('question-counter').textContent = `Question ${currentQuestion + 1}/${quizData.questions.length}`;
    
    // Update score counter
    document.getElementById('score-counter').textContent = `Score: ${correctAnswers}`;
    
    // Update question text
    document.getElementById('question-text').textContent = question.question;
    
    // Create options
    const optionsRow = document.getElementById('options-row');
    optionsRow.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionCol = document.createElement('div');
        optionCol.className = 'col-md-6 mb-3';
        optionCol.innerHTML = `
            <div class="card h-100 option-item" data-option="${index}">
                <div class="card-body">
                    <h5 class="option-text">${option}</h5>
                </div>
            </div>
        `;
        
        optionsRow.appendChild(optionCol);
        
        // Add click event listener
        const optionItem = optionCol.querySelector('.option-item');
        optionItem.addEventListener('click', function() {
            selectAnswer(this);
        });
    });
    
    // Reset next button
    const btnNextQuestion = document.getElementById('btn-next-question');
    btnNextQuestion.disabled = true;
}

// Select an answer
function selectAnswer(optionItem) {
    if (!quizData || !quizData.questions || currentQuestion >= quizData.questions.length) return;
    
    // If already answered, do nothing
    if (document.querySelector('.option-item.correct') || document.querySelector('.option-item.incorrect')) return;
    
    const selectedOption = parseInt(optionItem.dataset.option);
    const correctOption = quizData.questions[currentQuestion].correct;
    
    // Mark selected option
    optionItem.classList.add('selected');
    
    // Check if correct
    if (selectedOption === correctOption) {
        // Correct answer
        optionItem.classList.add('correct');
        correctAnswers++;
        
        // Update score counter
        document.getElementById('score-counter').textContent = `Score: ${correctAnswers}`;
    } else {
        // Incorrect answer
        optionItem.classList.add('incorrect');
        
        // Mark correct option
        document.querySelector(`.option-item[data-option="${correctOption}"]`).classList.add('correct');
    }
    
    // Enable next button
    const btnNextQuestion = document.getElementById('btn-next-question');
    btnNextQuestion.disabled = false;
}

// Show next question
function showNextQuestion() {
    currentQuestion++;
    
    if (currentQuestion < quizData.questions.length) {
        // Show next question
        prepareQuestion();
    } else {
        // Quiz complete, show results
        showQuizResults();
    }
}

// Show quiz results
function showQuizResults() {
    // Update final score
    document.getElementById('final-score').textContent = `${correctAnswers}/${quizData.questions.length}`;
    
    // Update score percentage
    const percentage = Math.round((correctAnswers / quizData.questions.length) * 100);
    document.getElementById('score-percentage').textContent = `${percentage}% Correct`;
    
    // Update feedback message
    let feedback = '';
    if (percentage >= 90) {
        feedback = 'Outstanding! You have mastered this topic!';
    } else if (percentage >= 70) {
        feedback = 'Great job! You have a solid understanding of the topic.';
    } else if (percentage >= 50) {
        feedback = 'Good effort! You\'re making progress with this topic.';
    } else {
        feedback = 'Keep practicing! This topic needs a bit more study.';
    }
    document.getElementById('result-feedback').textContent = feedback;
    
    // Show results section
    showSection('quiz-results');
}

// Restart quiz
function restartQuiz() {
    // Reset current question and score
    currentQuestion = 0;
    correctAnswers = 0;
    
    // Prepare and show first question
    prepareQuestion();
    showSection('quiz-questions');
}

// Go to topic selection
function goToTopicSelection() {
    // Reset selected topic
    selectedTopic = null;
    document.querySelectorAll('.topic-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Reset generate button
    const btnGenerateQuiz = document.getElementById('btn-generate-quiz');
    btnGenerateQuiz.disabled = true;
    btnGenerateQuiz.innerHTML = '<span>Select a topic to continue</span><i class="fas fa-chevron-right ms-2"></i>';
    
    // Show topic selection
    showSection('topic-selection');
}

// Show a section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.quiz-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// Show error message
function showError(message) {
    alert('Error: ' + message);
}