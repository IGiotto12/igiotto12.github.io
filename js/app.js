document.addEventListener('DOMContentLoaded', function () {

    // --- 0. Custom Cursor (Simple Follower) ---
    // Create cursor elements
    const cursorDot = document.createElement('div');
    const cursorRing = document.createElement('div');
    cursorDot.className = 'cursor-dot';
    cursorRing.className = 'cursor-ring';
    document.body.appendChild(cursorDot);
    document.body.appendChild(cursorRing);

    document.addEventListener('mousemove', (e) => {
        cursorDot.style.left = e.clientX + 'px';
        cursorDot.style.top = e.clientY + 'px';

        // Slight delay for ring
        setTimeout(() => {
            cursorRing.style.left = e.clientX + 'px';
            cursorRing.style.top = e.clientY + 'px';
        }, 50);
    });

    // Add hover states
    const hoverables = document.querySelectorAll('a, button, .project-card');
    hoverables.forEach(el => {
        el.addEventListener('mouseenter', () => cursorRing.classList.add('active'));
        el.addEventListener('mouseleave', () => cursorRing.classList.remove('active'));
    });

    // --- 0.1 Project Card 3D Tilt ---
    const cards = document.querySelectorAll('.project-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element.
            const y = e.clientY - rect.top;  // y position within the element.

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -10; // Max rotation deg
            const rotateY = ((x - centerX) / centerX) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });

    // --- 1. Your Specific Typewriter Logic ---
    const textElement = document.getElementById('typewriter-text');
    // Only run this if the element exists on the current page (prevents errors on Resume/Research pages)
    if (textElement) {
        const text = "I am a 3rd-year undergrad double major in Math-CS and Cog Sci (Neural Computation & ML) at UC San Diego. I specialize in deep learning with PyTorch, developing transformer-based models. I have hands-on experience building AI agents with LangChain and multi-agent frameworks, and implementing RAG/GraphRAG systems. My cloud computing expertise includes deploying ML models on AWS (EC2, SageMaker, Lambda). I am actively looking for internship positions about Software Dev Engineer, LLM/ML Engineer, Data Analyst, and more.";
        let index = 0;

        function type() {
            if (index < text.length) {
                textElement.innerHTML += text.charAt(index);
                index++;
                setTimeout(type, 15);
            }
        }
        type();
    }

    // --- 2. Scroll Animations (Intersection Observer) ---
    const observerOptions = { threshold: 0.1 };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            }
        });
    }, observerOptions);

    const hiddenElements = document.querySelectorAll('.hidden');
    hiddenElements.forEach((el) => observer.observe(el));

    // --- 3. Header & Scroll Spy Logic ---
    let lastScrollTop = 0;
    const header = document.getElementById('navbar');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-container nav ul li a');

    if (header) {
        window.addEventListener('scroll', () => {
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            // Header Hide/Show
            if (scrollTop > lastScrollTop) {
                header.style.transform = "translateY(-100%)";
            } else {
                header.style.transform = "translateY(0)";
            }
            lastScrollTop = scrollTop;

            // Scroll Spy
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(li => {
                li.classList.remove('active');
                if (li.getAttribute('href').includes(current)) {
                    li.classList.add('active');
                }
            });
        });
    }

    // ... (Keep your existing Typewriter & Header logic here) ...

    // --- 1. Project Filtering Logic ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add to clicked
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            projectCards.forEach(card => {
                if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                    card.classList.remove('hide');
                    card.classList.add('show'); // Re-trigger fade in if needed
                } else {
                    card.classList.add('hide');
                    card.classList.remove('show');
                }
            });
        });
    });

    // --- 2. Neural Stream Fetcher (JSON to HTML) ---
    const feedContainer = document.getElementById('feed-container');

    if (feedContainer) {
        fetch('data/thoughts.json')
            .then(response => response.json())
            .then(data => {
                feedContainer.innerHTML = ''; // Clear loading text

                // Reverse to show newest thoughts first
                data.reverse().forEach(note => {
                    const noteDiv = document.createElement('div');
                    noteDiv.classList.add('note-item');

                    noteDiv.innerHTML = `
                        <div class="note-header">
                            <span class="note-tag">#${note.tag}</span>
                            <span class="note-date">${note.date}</span>
                        </div>
                        <div class="note-content">
                            ${note.content}
                        </div>
                    `;

                    feedContainer.appendChild(noteDiv);
                });
            })
            .catch(error => {
                console.error('Error loading thoughts:', error);
                feedContainer.innerHTML = '<div class="note-item">Error loading neural stream.</div>';
            });
    }

    // --- 3. Neural Network Floating Objects ---
    // --- 3. Neural Network Canvas Animation ---
    const canvas = document.getElementById('neural-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];

        // Configuration
        const config = {
            particleCount: 80,
            connectionDistance: 150,
            mouseDistance: 250,
            baseSpeed: 0.1,
            colors: {
                particles: 'rgba(45, 52, 54, 0.5)', // Dark Grey
                lines: 'rgba(45, 52, 54, 0.1)'     // Very faint grey lines
            }
        };

        const mouse = { x: null, y: null };

        // Particle Class
        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * config.baseSpeed;
                this.vy = (Math.random() - 0.5) * config.baseSpeed;
                this.size = Math.random() * 2 + 1;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;

                // Mouse Interaction
                if (mouse.x != null) {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < config.mouseDistance) {
                        const forceDirectionX = dx / distance;
                        const forceDirectionY = dy / distance;
                        const force = (config.mouseDistance - distance) / config.mouseDistance;
                        const directionX = forceDirectionX * force * 0.6;
                        const directionY = forceDirectionY * force * 0.6;

                        this.vx += directionX;
                        this.vy += directionY;
                    }
                }
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = config.colors.particles;
                ctx.fill();
            }
        }

        function init() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            particles = [];
            for (let i = 0; i < config.particleCount; i++) {
                particles.push(new Particle());
            }
        }

        function animate() {
            requestAnimationFrame(animate);
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                let p = particles[i];
                p.update();
                p.draw();

                // Draw connections
                for (let j = i; j < particles.length; j++) {
                    let p2 = particles[j];
                    let dx = p.x - p2.x;
                    let dy = p.y - p2.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < config.connectionDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = config.colors.lines;
                        ctx.lineWidth = 1 - (distance / config.connectionDistance);
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }
        }

        // Event Listeners
        window.addEventListener('resize', init);
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.x;
            mouse.y = e.y;
        });
        window.addEventListener('mouseout', () => {
            mouse.x = null;
            mouse.y = null;
        });

        init();
        animate();
    }

});