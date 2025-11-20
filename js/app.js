document.addEventListener('DOMContentLoaded', function () {
    
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
                setTimeout(type, 30); 
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

    // --- 3. Header Hide/Show Logic ---
    let lastScrollTop = 0;
    const header = document.getElementById('navbar');
    
    if(header) {
        window.addEventListener('scroll', () => {
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > lastScrollTop) {
                header.style.transform = "translateY(-100%)"; 
            } else {
                header.style.transform = "translateY(0)"; 
            }
            lastScrollTop = scrollTop;
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
    
    if(feedContainer) {
        fetch('data/thoughts.json')
            .then(response => response.json())
            .then(data => {
                feedContainer.innerHTML = ''; // Clear loading text
                
                data.forEach(note => {
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
    const floatingBg = document.getElementById('floating-background');
    const neuralConnections = document.getElementById('neural-connections');
    
    if(floatingBg && neuralConnections) {
        class Neuron {
            constructor(x, y, size, id, vx, vy, opacity) {
                this.x = x;
                this.y = y;
                this.size = size;
                this.id = id; // Neuron number
                this.vx = vx; // velocity x
                this.vy = vy; // velocity y
                this.opacity = opacity; // Random opacity
                this.hoverOpacity = Math.min(opacity + 0.15, 0.5); // Slightly brighter on hover
                this.mass = size; // mass proportional to size
                this.element = this.createElement();
                this.isDragging = false;
            }

            createElement() {
                const div = document.createElement('div');
                div.className = 'floating-object';
                div.style.width = this.size + 'px';
                div.style.height = this.size + 'px';
                div.style.left = this.x + 'px';
                div.style.top = this.y + 'px';
                div.style.opacity = this.opacity;
                
                // Add mouse interaction
                div.addEventListener('mousedown', (e) => {
                    this.isDragging = true;
                    this.vx = 0;
                    this.vy = 0;
                    e.preventDefault();
                });
                
                // Hover effect
                div.addEventListener('mouseenter', () => {
                    div.style.opacity = this.hoverOpacity;
                });
                
                div.addEventListener('mouseleave', () => {
                    div.style.opacity = this.opacity;
                });
                
                floatingBg.appendChild(div);
                return div;
            }

            update() {
                if (this.isDragging) return;

                // Update position (no gravity, just drift)
                this.x += this.vx;
                this.y += this.vy;

                // Boundary collision with bounce
                const bounds = {
                    width: window.innerWidth,
                    height: window.innerHeight
                };

                // Left/Right boundaries
                if (this.x <= 0 || this.x + this.size >= bounds.width) {
                    this.vx *= -0.9; // Soft bounce
                    this.x = Math.max(0, Math.min(this.x, bounds.width - this.size));
                }

                // Top/Bottom boundaries
                if (this.y <= 0 || this.y + this.size >= bounds.height) {
                    this.vy *= -0.9; // Soft bounce
                    this.y = Math.max(0, Math.min(this.y, bounds.height - this.size));
                }

                // Air resistance only (no gravity)
                this.vx *= 0.999;
                this.vy *= 0.999;

                // Update DOM
                this.element.style.left = this.x + 'px';
                this.element.style.top = this.y + 'px';
            }

            getCenter() {
                return {
                    x: this.x + this.size / 2,
                    y: this.y + this.size / 2
                };
            }

            distanceTo(other) {
                const c1 = this.getCenter();
                const c2 = other.getCenter();
                const dx = c2.x - c1.x;
                const dy = c2.y - c1.y;
                return Math.sqrt(dx * dx + dy * dy);
            }

            checkCollision(other) {
                const distance = this.distanceTo(other);
                const minDistance = (this.size + other.size) / 2;

                // Check if collision occurred
                if (distance < minDistance) {
                    const c1 = this.getCenter();
                    const c2 = other.getCenter();
                    const dx = c2.x - c1.x;
                    const dy = c2.y - c1.y;

                    // Normalize collision vector
                    const nx = dx / distance;
                    const ny = dy / distance;

                    // Relative velocity
                    const dvx = other.vx - this.vx;
                    const dvy = other.vy - this.vy;

                    // Relative velocity in collision normal direction
                    const dvn = dvx * nx + dvy * ny;

                    // Do not resolve if velocities are separating
                    if (dvn > 0) return;

                    // Collision impulse (softer)
                    const impulse = (1.5 * dvn) / (this.mass + other.mass);

                    // Update velocities
                    this.vx += impulse * other.mass * nx;
                    this.vy += impulse * other.mass * ny;
                    other.vx -= impulse * this.mass * nx;
                    other.vy -= impulse * this.mass * ny;

                    // Separate objects to prevent overlap
                    const overlap = minDistance - distance;
                    const separationX = (overlap / 2) * nx;
                    const separationY = (overlap / 2) * ny;

                    this.x -= separationX;
                    this.y -= separationY;
                    other.x += separationX;
                    other.y += separationY;
                }
            }
        }

        // Create neurons
        const neurons = [];
        const numNeurons = 10;
        const connectionDistance = 300; // Max distance for visible connections

        for (let i = 0; i < numNeurons; i++) {
            const size = Math.random() * 30 + 50; // 50-80px
            const x = Math.random() * (window.innerWidth - size);
            const y = Math.random() * (window.innerHeight - size);
            const vx = (Math.random() - 0.5) * 1.5; // Slower movement
            const vy = (Math.random() - 0.5) * 1.5;
            const opacity = Math.random() * 0.35 + 0.15; // Random opacity between 0.15 and 0.5
            
            neurons.push(new Neuron(x, y, size, i + 1, vx, vy, opacity));
        }

        // Draw neural connections
        function drawConnections() {
            // Clear previous connections
            neuralConnections.innerHTML = '';

            for (let i = 0; i < neurons.length; i++) {
                for (let j = i + 1; j < neurons.length; j++) {
                    const distance = neurons[i].distanceTo(neurons[j]);
                    
                    if (distance < connectionDistance) {
                        const c1 = neurons[i].getCenter();
                        const c2 = neurons[j].getCenter();
                        
                        // Calculate opacity based on distance (closer = more visible)
                        const opacity = 1 - (distance / connectionDistance);
                        const strokeWidth = opacity * 2;
                        
                        // Create SVG line
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.setAttribute('x1', c1.x);
                        line.setAttribute('y1', c1.y);
                        line.setAttribute('x2', c2.x);
                        line.setAttribute('y2', c2.y);
                        line.setAttribute('stroke', `rgba(86, 174, 174, ${opacity * 0.3})`);
                        line.setAttribute('stroke-width', strokeWidth);
                        line.setAttribute('stroke-linecap', 'round');
                        
                        neuralConnections.appendChild(line);
                    }
                }
            }
        }

        // Mouse interaction
        let draggedNeuron = null;

        document.addEventListener('mousemove', (e) => {
            neurons.forEach(neuron => {
                if (neuron.isDragging) {
                    neuron.x = e.clientX - neuron.size / 2;
                    neuron.y = e.clientY - neuron.size / 2;
                    draggedNeuron = neuron;
                }
            });
        });

        document.addEventListener('mouseup', () => {
            neurons.forEach(neuron => {
                if (neuron.isDragging) {
                    neuron.isDragging = false;
                    // Add some velocity on release
                    neuron.vx = (Math.random() - 0.5) * 3;
                    neuron.vy = (Math.random() - 0.5) * 3;
                }
            });
            draggedNeuron = null;
        });

        // Animation loop
        function animate() {
            // Update all neurons
            neurons.forEach(neuron => neuron.update());

            // Check collisions between all pairs
            for (let i = 0; i < neurons.length; i++) {
                for (let j = i + 1; j < neurons.length; j++) {
                    neurons[i].checkCollision(neurons[j]);
                }
            }

            // Draw connections
            drawConnections();

            requestAnimationFrame(animate);
        }

        animate();

        // Handle window resize
        window.addEventListener('resize', () => {
            neurons.forEach(neuron => {
                if (neuron.x + neuron.size > window.innerWidth) {
                    neuron.x = window.innerWidth - neuron.size;
                }
                if (neuron.y + neuron.size > window.innerHeight) {
                    neuron.y = window.innerHeight - neuron.size;
                }
            });
            
            // Update SVG dimensions
            neuralConnections.setAttribute('width', window.innerWidth);
            neuralConnections.setAttribute('height', window.innerHeight);
        });

        // Set initial SVG dimensions
        neuralConnections.setAttribute('width', window.innerWidth);
        neuralConnections.setAttribute('height', window.innerHeight);
    }

});