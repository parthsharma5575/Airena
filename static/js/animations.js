// Stars background animation
function createStars() {
    const stars = document.getElementById('stars');
    const stars2 = document.getElementById('stars2');
    const stars3 = document.getElementById('stars3');
    
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        stars.appendChild(star);
    }
    
    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        stars2.appendChild(star);
    }
    
    for (let i = 0; i < 25; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        stars3.appendChild(star);
    }
}

// GSAP Animations
function initAnimations() {
    // Header animation
    gsap.from('.navbar', {
        y: -50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
    });
    
    // Hero section animation
    gsap.from('.hero-content', {
        y: 50,
        opacity: 0,
        duration: 1,
        delay: 0.5,
        ease: 'power3.out'
    });
    
    // About section animation
    gsap.from('.about-section', {
        scrollTrigger: {
            trigger: '.about-section',
            start: 'top center',
            toggleActions: 'play none none reverse'
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
    });
    
    // Team section animation
    gsap.from('.team-member', {
        scrollTrigger: {
            trigger: '.team-section',
            start: 'top center',
            toggleActions: 'play none none reverse'
        },
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out'
    });
}

// Form validation and animations
function initForms() {
    const forms = document.querySelectorAll('.auth-form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const inputs = form.querySelectorAll('input');
            let isValid = true;
            
            inputs.forEach(input => {
                if (!input.value) {
                    isValid = false;
                    input.classList.add('is-invalid');
                    gsap.to(input, {
                        x: [0, 10, -10, 0],
                        duration: 0.3,
                        ease: 'power1.out'
                    });
                } else {
                    input.classList.remove('is-invalid');
                }
            });
            
            if (isValid) {
                form.submit();
            }
        });
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create stars
    const stars = document.querySelector('.stars');
    const starsCount = 200;
    
    for (let i = 0; i < starsCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 2 + 's';
        stars.appendChild(star);
    }
    
    // Add CSS for stars
    const style = document.createElement('style');
    style.textContent = `
        .star {
            position: absolute;
            width: 2px;
            height: 2px;
            background: white;
            border-radius: 50%;
            animation: twinkle 1s infinite;
        }
        
        @keyframes twinkle {
            0% { opacity: 0; }
            50% { opacity: 1; }
            100% { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    createStars();
    initAnimations();
    initForms();
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                gsap.to(window, {
                    duration: 1,
                    scrollTo: {
                        y: target,
                        offsetY: 70
                    },
                    ease: 'power2.inOut'
                });
            }
        });
    });
}); 