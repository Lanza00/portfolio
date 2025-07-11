// Portfolio Animations and Interactive Features
document.addEventListener('DOMContentLoaded', function() {
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                // Responsive header height based on screen size
                let headerHeight = 70; // Desktop header height
                if (window.innerWidth <= 768) {
                    headerHeight = 60; // Mobile header height
                }
                
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.section-title, .about-content, .experience-item, .project-card, .contact-content');
    animateElements.forEach(el => {
        observer.observe(el);
    });

    // --- Add for timeline interactivity ---
    const timelineItems = document.querySelectorAll('.timeline-item');
    const timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            } else {
                entry.target.classList.remove('in-view');
            }
        });
    }, { threshold: 0.2 });
    timelineItems.forEach(item => timelineObserver.observe(item));
    // --- End timeline interactivity ---

    // Typing effect for the name in header
    function typeWriter(element, text, speed = 100) {
        let i = 0;
        element.textContent = '';
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        type();
    }

    // Initialize typing effect when page loads
    const nameElement = document.querySelector('.name');
    if (nameElement) {
        const originalText = nameElement.textContent;
        setTimeout(() => {
            typeWriter(nameElement, originalText, 150);
        }, 1000);
    }

    // Project cards hover effect with 3D tilt (desktop only)
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        // Only add 3D tilt effect on desktop (non-touch devices)
        if (!('ontouchstart' in window)) {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 10;
                const rotateY = (centerX - x) / 10;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
            });
        } else {
            // Mobile touch effect - simple scale on touch
            card.addEventListener('touchstart', () => {
                card.style.transform = 'scale(1.02)';
            });
            
            card.addEventListener('touchend', () => {
                card.style.transform = 'scale(1)';
            });
        }
    });

    // Contact items hover animation (responsive)
    const contactItems = document.querySelectorAll('.contact-item');
    contactItems.forEach(item => {
        if (!('ontouchstart' in window)) {
            // Desktop hover effects
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'translateY(-5px) scale(1.05)';
                item.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.transform = 'translateY(0) scale(1)';
                item.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            });
        } else {
            // Mobile touch effects
            item.addEventListener('touchstart', () => {
                item.style.transform = 'scale(1.02)';
                item.style.boxShadow = '0 4px 15px rgba(0,0,0,0.12)';
            });
            
            item.addEventListener('touchend', () => {
                item.style.transform = 'scale(1)';
                item.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            });
        }
    });

    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            animation: fadeInUp 0.8s ease forwards;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .section-title, .about-content, .experience-item, .project-card, .contact-content {
            opacity: 0;
            transform: translateY(30px);
        }
        
        .project-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .contact-item {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        /* Mobile responsive animations */
        @media (max-width: 768px) {
            .animate-in {
                animation: fadeInUp 0.6s ease forwards;
            }
            
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .section-title, .about-content, .experience-item, .project-card, .contact-content {
                opacity: 0;
                transform: translateY(20px);
            }
            
            .project-card {
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            
            .contact-item {
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
        }
        
        /* Touch device optimizations */
        @media (hover: none) and (pointer: coarse) {
            .project-card:hover,
            .contact-item:hover {
                transform: none !important;
            }
        }
    `;
    document.head.appendChild(style);

    // Console welcome message
    console.log('%c🚀 Welcome to Aznal Anas Portfolio!', 'color: #667eea; font-size: 20px; font-weight: bold;');
    console.log('%c💻 Check out the source code and let\'s connect!', 'color: #764ba2; font-size: 14px;');
});
