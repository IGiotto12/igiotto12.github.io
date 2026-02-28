document.addEventListener('DOMContentLoaded', function () {

    // ============================================================
    // 1. THEME TOGGLE — Light/Dark with persistence
    // ============================================================
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';

    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';

            if (next === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
            localStorage.setItem('theme', next);

            // Update canvas colors
            if (typeof updateCanvasColors === 'function') {
                updateCanvasColors();
            }
        });
    }

    // ============================================================
    // 2. CUSTOM CURSOR — Smooth follow
    // ============================================================
    const cursorDot = document.createElement('div');
    const cursorRing = document.createElement('div');
    cursorDot.className = 'cursor-dot';
    cursorRing.className = 'cursor-ring';
    document.body.appendChild(cursorDot);
    document.body.appendChild(cursorRing);

    let mouseX = 0, mouseY = 0;
    let dotX = 0, dotY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateCursor() {
        dotX += (mouseX - dotX) * 0.2;
        dotY += (mouseY - dotY) * 0.2;
        ringX += (mouseX - ringX) * 0.1;
        ringY += (mouseY - ringY) * 0.1;

        cursorDot.style.left = dotX + 'px';
        cursorDot.style.top = dotY + 'px';
        cursorRing.style.left = ringX + 'px';
        cursorRing.style.top = ringY + 'px';

        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover states
    const interactables = document.querySelectorAll('a, button, .project-card, .note-item, .theme-toggle');
    interactables.forEach(el => {
        el.addEventListener('mouseenter', () => cursorRing.classList.add('active'));
        el.addEventListener('mouseleave', () => cursorRing.classList.remove('active'));
    });

    // ============================================================
    // 3. SCROLL REVEAL — IntersectionObserver with stagger
    // ============================================================
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
        revealObserver.observe(el);
    });

    // ============================================================
    // 4. 3D TILT on Project Cards
    // ============================================================
    const cards = document.querySelectorAll('.project-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -6;
            const rotateY = ((x - centerX) / centerX) * 6;

            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
        });
    });

    // ============================================================
    // 5. HEADER — Hide on scroll down, show on scroll up
    // ============================================================
    let lastScrollTop = 0;
    const header = document.getElementById('navbar');

    if (header) {
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            if (scrollTop > lastScrollTop && scrollTop > 100) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
            lastScrollTop = scrollTop;
        }, { passive: true });
    }

    // ============================================================
    // 6. SCROLL SPY — Active nav link
    // ============================================================
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('nav ul li a[href^="#"]');

    if (navLinks.length > 0) {
        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (window.pageYOffset >= sectionTop - sectionHeight / 3) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + current) {
                    link.classList.add('active');
                }
            });
        }, { passive: true });
    }

    // ============================================================
    // 7. THOUGHTS FEED — Load from JSON
    // ============================================================
    const feedContainer = document.getElementById('feed-container');

    if (feedContainer) {
        fetch('data/thoughts.json')
            .then(response => response.json())
            .then(data => {
                feedContainer.innerHTML = '';

                // Reverse to show newest first
                const sorted = [...data].reverse();

                sorted.forEach((note, index) => {
                    const noteDiv = document.createElement('div');
                    noteDiv.classList.add('note-item', 'reveal');
                    if (index < 6) {
                        noteDiv.classList.add(`reveal-delay-${index + 1}`);
                    }

                    noteDiv.innerHTML = `
            <div class="note-header">
              <span class="note-tag">#${note.tag}</span>
              <span class="note-date">${note.date}</span>
            </div>
            <div class="note-content">${note.content}</div>
          `;

                    feedContainer.appendChild(noteDiv);
                    revealObserver.observe(noteDiv);
                });
            })
            .catch(error => {
                console.error('Error loading thoughts:', error);
                feedContainer.innerHTML = '<div class="note-item">Error loading neural stream.</div>';
            });
    }

    // ============================================================
    // 8. NEURAL NETWORK CANVAS — Theme-aware
    // ============================================================
    const canvas = document.getElementById('neural-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];

        function getCanvasColors() {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            return {
                particles: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.15)',
                lines: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'
            };
        }

        let colors = getCanvasColors();

        // Expose for theme toggle
        window.updateCanvasColors = function () {
            colors = getCanvasColors();
        };

        const config = {
            particleCount: 60,
            connectionDistance: 120,
            mouseDistance: 200,
            baseSpeed: 0.15
        };

        const mouse = { x: null, y: null };

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * config.baseSpeed;
                this.vy = (Math.random() - 0.5) * config.baseSpeed;
                this.size = Math.random() * 1.5 + 0.5;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;

                if (mouse.x != null) {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < config.mouseDistance) {
                        const force = (config.mouseDistance - distance) / config.mouseDistance;
                        this.vx += (dx / distance) * force * 0.3;
                        this.vy += (dy / distance) * force * 0.3;
                    }
                }

                this.vx *= 0.99;
                this.vy *= 0.99;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = colors.particles;
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

                for (let j = i + 1; j < particles.length; j++) {
                    let p2 = particles[j];
                    let dx = p.x - p2.x;
                    let dy = p.y - p2.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < config.connectionDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = colors.lines;
                        ctx.lineWidth = 1 - (distance / config.connectionDistance);
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }
        }

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

    // ============================================================
    // 9. SMOOTH SCROLL for anchor links
    // ============================================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

});