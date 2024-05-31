document.addEventListener('DOMContentLoaded', function () {
    const textElement = document.getElementById('typewriter-text');
    const text = "Hey, I am a first-year undergrad major in Math-CS at UC San Diego. I plan to double major in Cog-Sci specializing in ML next year. I am frequently looking for an internship/research program in ML, data analysis, or UI/UX this summer 2024. Nice to meet U";
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
