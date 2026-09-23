// Plain text only: separate paragraphs with blank lines in data/sop.txt.
const statement = document.getElementById('sop-content');

fetch('../data/sop.txt', { cache: 'no-store' })
    .then(response => {
        if (!response.ok) throw new Error('Statement could not be loaded');
        return response.text();
    })
    .then(text => {
        const body = text.trim();
        if (!body) {
            statement.querySelector('.sop-status').textContent = 'Statement coming soon.';
            return;
        }
        const paragraphs = body.split(/\r?\n\s*\r?\n/).map(paragraph => {
            const element = document.createElement('p');
            element.textContent = paragraph.trim();
            return element;
        });
        statement.replaceChildren(...paragraphs);
    })
    .catch(() => {
        statement.querySelector('.sop-status').textContent = 'The statement couldn’t load. Please try refreshing.';
    })
    .finally(() => statement.setAttribute('aria-busy', 'false'));
