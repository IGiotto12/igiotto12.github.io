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
});