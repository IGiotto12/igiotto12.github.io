document.addEventListener('DOMContentLoaded', () => {
    const notes = document.getElementById('misc-notes');
    fetch('../data/thoughts.json')
        .then(response => {
            if (!response.ok) throw new Error('Notes could not be loaded');
            return response.json();
        })
        .then(data => {
            notes.replaceChildren();
            [...data].sort((a, b) => b.date.localeCompare(a.date)).forEach(note => {
                const article = document.createElement('article');
                article.className = 'scrap-note';
                const date = document.createElement('time');
                date.dateTime = note.date;
                date.textContent = note.date;
                const title = document.createElement('h3');
                title.textContent = note.title || 'A passing thought';
                const content = document.createElement('div');
                content.className = 'scrap-content';
                content.innerHTML = note.content;
                content.querySelectorAll('a[target="_blank"]').forEach(link => {
                    link.rel = 'noopener noreferrer';
                });
                article.append(date, title, content);
                notes.appendChild(article);
            });
        })
        .catch(() => {
            notes.textContent = 'The notes couldn’t load. Please try refreshing.';
        })
        .finally(() => notes.setAttribute('aria-busy', 'false'));

});
