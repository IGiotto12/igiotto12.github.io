document.addEventListener('DOMContentLoaded', function () {
    const textElement = document.getElementById('typewriter-text');
    const text = "Hey, I am a 3rd-year undergrad major in Math-CS and minor in ICAM at UC San Diego. I am actively looking for various internship positions about Software Engineer/Machine Learning Engineer/Data Analysis/Web Development this summer 2025. Nice to meet U";
    let index = 0;

    function type() {
        if (index < text.length) {
            textElement.innerHTML += text.charAt(index);
            index++;
            setTimeout(type, 30); // Adjust typing speed, number is the time
        }
    }

    type();
});
