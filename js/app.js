document.addEventListener('DOMContentLoaded', function () {
    
    // --- 1. Your Specific Typewriter Logic ---
    const textElement = document.getElementById('typewriter-text');
    // Only run this if the element exists on the current page (prevents errors on Resume/Research pages)
    if (textElement) {
        const text = "Hey, I am a 3rd-year undergrad double major in Math-CS and Cog Sci - Neural Computing & ML (minor in Interdisciplinary Computing Art & Media) at UC San Diego. I am actively looking for internship positions about Full Stack Developer, AI Engineer, Data Analyst. Nice to meet U";
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

});