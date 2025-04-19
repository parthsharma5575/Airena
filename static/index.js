document.addEventListener('DOMContentLoaded', function() {
    // Initialize application
    initApp();
    
    // Add event listeners
    setupEventListeners();
});

// Sound effects using Tone.js
const sounds = {
    click: null,
    success: null,
    error: null,
    transition: null,
    punch: null,
    kick: null,
    special: null,
    block: null,
    countdown: null,
    victory: null,
    defeat: null
};

// Initialize application
function initApp() {
    console.log('Initializing application...');
    
    // Initialize sound effects
    initSounds();
    
    // Show loader for a brief moment to enhance UX
    setTimeout(() => {
        document.getElementById('loader').style.opacity = 0;
        setTimeout(() => {
            document.getElementById('loader').style.display = 'none';
        }, 500);
    }, 1500);
}

// Initialize sound effects using Tone.js
function initSounds() {
    try {
        // Create a limiter for all sounds
        const limiter = new Tone.Limiter(-6).toDestination();
        
        // Click sound - used for buttons
        sounds.click = new Tone.Player({
            url: 'https://tonejs.github.io/audio/berklee/gong_1.mp3',
            volume: -15
        }).connect(limiter);
        
        // Success sound
        sounds.success = new Tone.Player({
            url: 'https://tonejs.github.io/audio/berklee/guitar_harmonics_a4.mp3',
            volume: -10
        }).connect(limiter);
        
        // Error sound
        sounds.error = new Tone.Player({
            url: 'https://tonejs.github.io/audio/berklee/trombone_choir_d3.mp3',
            volume: -15
        }).connect(limiter);
        
        // Transition sound
        sounds.transition = new Tone.Player({
            url: 'https://tonejs.github.io/audio/berklee/gong_1.mp3',
            volume: -15
        }).connect(limiter);
    } catch (error) {
        console.error('Error initializing sounds:', error);
    }
}

// Setup event listeners for all interactive elements
function setupEventListeners() {
    // Option cards on homepage
    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', function() {
            // Use the button inside the card for navigation
            const button = this.querySelector('.card-hover-content a, .card-hover-content button');
            if (button) {
                // Play click sound
                if (sounds.click) {
                    sounds.click.start();
                }
                
                // If it's an anchor tag, let it do its work
                if (button.tagName === 'A') {
                    // No need for additional handling, the link will navigate
                    return;
                } else {
                    // For buttons, get target section
                    const targetSection = this.dataset.section;
                    if (targetSection) {
                        navigateToSection(targetSection);
                    }
                }
            }
        });
    });
}

// Navigation between sections
function navigateToSection(sectionId) {
    // Play transition sound
    if (sounds.transition) {
        sounds.transition.start();
    }
    
    // If it's an external route, navigate to it
    if (sectionId === 'groq-chatbot') {
        window.location.href = '/groq';
        return;
    } else if (sectionId === 'fluvio-quiz') {
        window.location.href = '/quiz';
        return;
    } else if (sectionId === 'multiplayer-game') {
        window.location.href = '/game';
        return;
    }
    
    // For internal sections, switch visibility
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}