document.addEventListener('DOMContentLoaded', function () {
    const header = document.getElementById('header');
    let lastScrollTop = 0;

    window.addEventListener('scroll', function () {
        let currentScroll = window.pageYOffset || document.documentElement.scrollTop;

        if (currentScroll > lastScrollTop) {
            // Scroll Down
            header.style.top = '-100px'; // Change this value to your header's height
        } else {
            // Scroll Up
            header.style.top = '0px';
        }
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll; // For Mobile or negative scrolling
    }, false);
});
