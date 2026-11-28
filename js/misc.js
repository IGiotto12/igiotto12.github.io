/* Misc: a small model of me.
   The map traces every piece back to me (me → how I made it → the piece); dotted lines join pieces
   that share an idea. The timeline underneath rewinds the map to any point; it rests at "Now".
   Clicking a piece opens it in a small window.
   Pieces come from data/misc.json (photos, art, writing, idea links) and data/thoughts.json. */
document.addEventListener('DOMContentLoaded', () => {
    const ROOT = '../';
    const KINDS = {
        see: { label: 'See', plural: 'photos' },
        make: { label: 'Make', plural: 'art pieces' },
        write: { label: 'Write', plural: 'pieces of writing' },
        think: { label: 'Think', plural: 'thoughts' },
    };
    const KIND_ORDER = ['see', 'make', 'write', 'think'];

    // The map is drawn in a 1000 × 560 space. Positions are node centres.
    const W = 1000;
    const H = 560;
    const LAYOUT = {
        me: [500, 285],
        hubs: { see: [345, 190], make: [345, 386], think: [640, 182], write: [630, 400] },
        items: {
            'see-moon': [362, 64],
            'see-sunset': [205, 88],
            'see-paraglider': [122, 230],
            'make-fine-tune': [172, 418],
            'think-2025-12-11': [745, 42],
            'think-2026-02-03': [870, 112],
            'think-2026-02-04': [875, 186],
            'think-2026-01-02': [790, 262],
            'think-2025-11-19': [672, 330],
            'write-world-models': [870, 414],
            'write-deeper-learning': [705, 512],
        },
        tilt: { 'see-moon': 2, 'see-sunset': -2.5, 'see-paraglider': 1.5 },
        // How far a shared-idea line bows outward (default 0.2), keyed by the two ids in sorted order.
        bend: { 'think-2026-02-04|write-world-models': 0.34 },
    };

    const narrow = window.matchMedia('(max-width: 899px)');
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const $ = id => document.getElementById(id);

    const map = $('mind-map');
    const status = $('twin-status');
    const timelineEl = $('timeline');
    const track = $('tl-track');
    const marks = $('tl-marks');
    const handle = $('tl-handle');
    const label = $('tl-label');
    const past = $('tl-past');
    const tip = $('tl-tip');
    const dialog = $('piece-window');
    const pwBody = $('pw-body');

    // hover: what the pointer is on; open: the piece in the window; pinned: a clicked hub; cut: timeline 0..1
    const state = { hover: null, open: null, pinned: null, cut: 1 };
    const byId = new Map();
    const neighbours = new Map();
    const placed = new Map();
    const nodes = new Map();
    const markEls = new Map();
    const edges = [];
    let items = [];
    let timeline = [];
    let stops = [];

    const getJSON = url => fetch(url).then(response => {
        if (!response.ok) throw new Error(url);
        return response.json();
    });

    Promise.all([getJSON(ROOT + 'data/misc.json'), getJSON(ROOT + 'data/thoughts.json')])
        .then(([misc, thoughts]) => {
            items = [...misc.works, ...fromThoughts(thoughts)];
            items.forEach(item => byId.set(item.id, item));
            timeline = [...items].sort((a, b) => a.date.localeCompare(b.date));
            (misc.links || []).forEach(link => {
                if (!byId.has(link.a) || !byId.has(link.b)) return;
                addNeighbour(link.a, link.b, link.idea);
                addNeighbour(link.b, link.a, link.idea);
            });
            // The line key only means something once there are shared-idea lines to tell apart.
            if (neighbours.size) document.querySelectorAll('.legend-line').forEach(li => { li.hidden = false; });

            placeOnTime();
            buildMap();
            buildTimeline();
            status.hidden = true;
            if (narrow.matches) centreMap();

            const hash = decodeURIComponent(location.hash.slice(1));
            if (byId.has(hash)) {
                setCut(1);
                openPiece(hash, nodes.get(hash));
            } else {
                intro();
            }
        })
        .catch(() => {
            status.textContent = 'This page couldn’t load. Please try refreshing.';
        });

    function fromThoughts(thoughts) {
        const seen = new Map();
        return thoughts.map(thought => {
            let id = thought.id || 'think-' + thought.date;
            const count = (seen.get(id) || 0) + 1;
            seen.set(id, count);
            if (count > 1) id += '-' + count;
            return {
                id,
                modality: 'think',
                date: thought.date,
                title: thought.title || 'A passing thought',
                tag: thought.tag,
                html: thought.content,
            };
        });
    }

    function addNeighbour(from, to, idea) {
        if (!neighbours.has(from)) neighbours.set(from, []);
        neighbours.get(from).push({ id: to, idea });
    }

    /* ---------------- helpers ---------------- */

    function el(tag, className, attrs = {}) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
        return node;
    }

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const round = value => Math.round(value * 10) / 10;
    const distance = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
    const isShown = item => item.t <= state.cut + 1e-6;
    const monthYear = date => new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const icon = kind => `<svg aria-hidden="true" focusable="false"><use href="#i-${kind}"></use></svg>`;

    function pos(key) {
        if (key === 'me') return LAYOUT.me;
        if (key.startsWith('hub:')) return LAYOUT.hubs[key.slice(4)];
        return placed.get(key);
    }

    // A quadratic curve from p to q that bows away from "me", so lines fan outward.
    function curve(p, q, bend) {
        const [x1, y1] = p;
        const [x2, y2] = q;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const len = Math.hypot(x2 - x1, y2 - y1) || 1;
        let nx = -(y2 - y1) / len;
        let ny = (x2 - x1) / len;
        const [cx0, cy0] = LAYOUT.me;
        if (Math.hypot(mx + nx - cx0, my + ny - cy0) < Math.hypot(mx - nx - cx0, my - ny - cy0)) {
            nx = -nx;
            ny = -ny;
        }
        const cx = mx + nx * len * bend;
        const cy = my + ny * len * bend;
        return `M${round(x1)} ${round(y1)} Q${round(cx)} ${round(cy)} ${round(x2)} ${round(y2)}`;
    }

    function placeItems() {
        KIND_ORDER.forEach(kind => {
            const hub = LAYOUT.hubs[kind];
            const loose = [];
            items.filter(item => item.modality === kind).forEach(item => {
                if (LAYOUT.items[item.id]) placed.set(item.id, LAYOUT.items[item.id]);
                else loose.push(item);
            });
            // Pieces without a hand-set spot fan out from their hub, away from me.
            const outward = Math.atan2(hub[1] - LAYOUT.me[1], hub[0] - LAYOUT.me[0]);
            loose.forEach((item, k) => {
                const angle = outward + (k - (loose.length - 1) / 2) * 0.5;
                const radius = 150 + (k % 2) * 60;
                placed.set(item.id, [
                    clamp(hub[0] + Math.cos(angle) * radius, 90, W - 90),
                    clamp(hub[1] + Math.sin(angle) * radius, 40, H - 40),
                ]);
            });
        });
    }

    function setAt(node, key) {
        const [x, y] = pos(key);
        node.style.left = (x / W) * 100 + '%';
        node.style.top = (y / H) * 100 + '%';
    }

    /* ---------------- the map ---------------- */

    function buildMap() {
        placeItems();
        const NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'mind-lines');
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        svg.setAttribute('aria-hidden', 'true');

        const addEdge = (a, b, kind, bend) => {
            const path = document.createElementNS(NS, 'path');
            path.setAttribute('d', curve(pos(a), pos(b), bend));
            path.setAttribute('class', `edge edge-${kind}`);
            if (kind === 'spine') path.setAttribute('pathLength', '1');
            svg.appendChild(path);
            edges.push({ el: path, a, b, kind });
        };

        KIND_ORDER.forEach(kind => addEdge('me', 'hub:' + kind, 'spine', 0));
        items.forEach(item => addEdge('hub:' + item.modality, item.id, 'tree', 0.1));
        const drawn = new Set();
        items.forEach(item => (neighbours.get(item.id) || []).forEach(n => {
            const key = [item.id, n.id].sort().join('|');
            if (drawn.has(key)) return;
            drawn.add(key);
            addEdge(item.id, n.id, 'idea', LAYOUT.bend[key] ?? 0.2);
        }));
        map.appendChild(svg);

        // me
        const me = el('button', 'node node-me', { type: 'button', 'aria-label': 'Me. Clear the highlight' });
        me.innerHTML = '<span class="me-label" aria-hidden="true">me</span>';
        setAt(me, 'me');
        me.addEventListener('click', () => pin(null));
        map.appendChild(me);
        nodes.set('me', me);

        // how I make things
        KIND_ORDER.forEach(kind => {
            const key = 'hub:' + kind;
            const hub = el('button', 'node node-hub', { type: 'button', 'aria-pressed': 'false' });
            hub.innerHTML = `${icon(kind)}<span class="hub-label" aria-hidden="true">${KINDS[kind].label}<span class="hub-count"></span></span>`;
            setAt(hub, key);
            trackHover(hub, key);
            hub.addEventListener('click', () => pin(state.pinned === key ? null : key));
            map.appendChild(hub);
            nodes.set(key, hub);
        });

        // the pieces
        items.forEach(item => {
            const node = pieceNode(item);
            node.insertAdjacentHTML('beforeend', '<span class="node-why" aria-hidden="true"></span>');
            setAt(node, item.id);
            trackHover(node, item.id);
            node.addEventListener('click', () => openPiece(item.id, node));
            map.appendChild(node);
            nodes.set(item.id, node);
        });

        map.addEventListener('pointerleave', () => {
            state.hover = null;
            trace();
        });
        map.addEventListener('click', event => {
            if (event.target === map || event.target.closest('.mind-lines')) pin(null);
        });
    }

    function pieceNode(item) {
        const node = el('button', 'node', { type: 'button', 'aria-label': `${KINDS[item.modality].label}: ${item.title}, ${item.date}` });

        if (item.modality === 'see') {
            node.classList.add('node-photo');
            if (item.height > item.width) node.classList.add('is-portrait');
            node.style.setProperty('--tilt', (LAYOUT.tilt[item.id] || 0) + 'deg');
            node.appendChild(el('img', '', { src: ROOT + item.thumb, alt: '', width: item.width, height: item.height, decoding: 'async' }));
            // Start fetching the full print as soon as someone shows interest.
            node.addEventListener('pointerenter', () => { new Image().src = ROOT + item.image; }, { once: true });
        } else if (item.modality === 'make') {
            node.classList.add('node-art');
            node.innerHTML = '<span class="art-frame"><img alt="" decoding="async"><video muted loop playsinline preload="none"></video><span class="play-glyph" aria-hidden="true">▶</span></span><span class="node-title"></span>';
            node.querySelector('img').src = ROOT + item.thumb;
            const video = node.querySelector('video');
            video.muted = true;
            if (item.preview) video.src = ROOT + item.preview;
            node.querySelector('.node-title').textContent = item.title;
            node.addEventListener('pointerenter', event => {
                if (event.pointerType === 'touch' || calm.matches || !item.preview) return;
                video.play().then(() => node.classList.add('is-playing')).catch(() => {});
            });
            node.addEventListener('pointerleave', () => {
                video.pause();
                node.classList.remove('is-playing');
            });
        } else if (item.modality === 'write') {
            node.classList.add('node-write');
            const meta = el('span', 'node-meta');
            meta.textContent = (item.venue || '').split(' · ')[0];
            node.append(meta, document.createTextNode(item.title));
        } else {
            node.classList.add('node-thought');
            node.textContent = item.title;
        }
        return node;
    }

    function trackHover(node, key) {
        const enter = () => {
            state.hover = key;
            trace();
        };
        const leave = () => {
            if (state.hover !== key) return;
            state.hover = null;
            trace();
        };
        node.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') enter(); });
        node.addEventListener('pointerleave', leave);
        node.addEventListener('focus', enter);
        node.addEventListener('blur', leave);
    }

    function pin(key) {
        state.pinned = key;
        KIND_ORDER.forEach(kind => {
            const hub = nodes.get('hub:' + kind);
            const on = key === 'hub:' + kind;
            hub.classList.toggle('is-pinned', on);
            hub.setAttribute('aria-pressed', String(on));
        });
        trace();
    }

    // Light up the path from a piece back to me, and the pieces it shares an idea with.
    function trace() {
        const shownKey = key => key && (key.startsWith('hub:') || (byId.has(key) && isShown(byId.get(key))));
        const key = [state.hover, state.open, state.pinned].find(shownKey) || null;
        const on = new Set();
        const why = new Map();
        const lit = new Set();

        if (key) {
            on.add('me');
            if (key.startsWith('hub:')) {
                const kind = key.slice(4);
                on.add(key);
                items.forEach(item => { if (item.modality === kind && isShown(item)) on.add(item.id); });
                edges.forEach((edge, i) => {
                    if ((edge.a === 'me' && edge.b === key) || (edge.a === key && on.has(edge.b))) lit.add(i);
                });
            } else {
                const hub = 'hub:' + byId.get(key).modality;
                on.add(hub);
                on.add(key);
                const linked = (neighbours.get(key) || []).filter(n => isShown(byId.get(n.id)));
                linked.forEach(n => why.set(n.id, n.idea));
                edges.forEach((edge, i) => {
                    if ((edge.a === 'me' && edge.b === hub) || (edge.a === hub && edge.b === key)) lit.add(i);
                    if (edge.kind === 'idea' && (edge.a === key || edge.b === key) && (why.has(edge.a) || why.has(edge.b))) lit.add(i);
                });
            }
        }

        map.classList.toggle('is-tracing', Boolean(key));
        nodes.forEach((node, k) => {
            node.classList.toggle('is-on', on.has(k));
            node.classList.toggle('is-linked', why.has(k) && !on.has(k));
            node.classList.toggle('is-open', k === state.open);
            const tag = node.querySelector('.node-why');
            if (tag && why.has(k)) tag.textContent = why.get(k);
        });
        edges.forEach((edge, i) => edge.el.classList.toggle('is-on', lit.has(i)));
        markEls.forEach((mark, id) => mark.classList.toggle('is-on', id === key || id === state.open));
    }

    function centreMap() {
        const scroller = map.parentElement;
        requestAnimationFrame(() => {
            scroller.scrollLeft = map.offsetLeft - scroller.offsetLeft + map.offsetWidth / 2 - scroller.clientWidth / 2;
        });
    }

    /* ---------------- the timeline ---------------- */

    // Pieces sit in date order. Gaps between them grow with the time that passed, but are capped,
    // so a quiet year does not push everything else into a corner.
    function placeOnTime() {
        const days = (a, b) => (Date.parse(b) - Date.parse(a)) / 864e5;
        const step = (a, b) => 1 + Math.min(Math.max(days(a, b), 0) / 30, 8) * 0.18;
        const today = new Date().toISOString().slice(0, 10);
        let total = 0;
        const raw = timeline.map((item, i) => {
            if (i) total += step(timeline[i - 1].date, item.date);
            return total;
        });
        const last = timeline[timeline.length - 1].date;
        total += step(last, today > last ? today : last);
        timeline.forEach((item, i) => { item.t = raw[i] / total; });
        stops = [...timeline.map(item => item.t), 1];
    }

    function buildTimeline() {
        let year = '';
        timeline.forEach(item => {
            const mark = el('button', 'tl-mark', { type: 'button', 'aria-label': `${KINDS[item.modality].label}: ${item.title}, ${item.date}` });
            mark.innerHTML = icon(item.modality);
            mark.style.left = item.t * 100 + '%';
            mark.addEventListener('click', () => openPiece(item.id, mark));
            const enter = () => {
                showTip(item, mark);
                if (isShown(item)) {
                    state.hover = item.id;
                    trace();
                }
            };
            const leave = () => {
                tip.hidden = true;
                if (state.hover !== item.id) return;
                state.hover = null;
                trace();
            };
            mark.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') enter(); });
            mark.addEventListener('pointerleave', leave);
            mark.addEventListener('focus', enter);
            mark.addEventListener('blur', leave);
            marks.appendChild(mark);
            markEls.set(item.id, mark);

            const itemYear = item.date.slice(0, 4);
            if (itemYear !== year) {
                year = itemYear;
                const yearLabel = el('span', 'tl-year', { 'aria-hidden': 'true' });
                yearLabel.textContent = year;
                yearLabel.style.left = item.t * 100 + '%';
                marks.appendChild(yearLabel);
            }
        });
        marks.insertAdjacentHTML('beforeend', '<span class="tl-end" aria-hidden="true"></span><span class="tl-now" aria-hidden="true">now</span>');
        handle.setAttribute('aria-valuemin', '0');
        handle.setAttribute('aria-valuemax', String(stops.length - 1));
    }

    function shiftWithin(width, x) {
        const room = track.offsetLeft - 4;
        const left = clamp(x - width / 2, -room, track.clientWidth + room - width);
        return left - x + 'px';
    }

    function showTip(item, mark) {
        tip.innerHTML = '<span></span><time></time>';
        tip.firstChild.textContent = item.title;
        tip.lastChild.textContent = item.date;
        tip.hidden = false;
        const x = mark.offsetLeft;
        tip.style.left = x + 'px';
        tip.style.setProperty('--tip-shift', shiftWithin(tip.offsetWidth, x));
    }

    let snapTimer = 0;
    function setCut(cut, { snap = false } = {}) {
        state.cut = cut;
        if (snap) {
            timelineEl.classList.add('is-snapping');
            clearTimeout(snapTimer);
            snapTimer = setTimeout(() => timelineEl.classList.remove('is-snapping'), 240);
        }
        const shownCut = clamp(cut, 0, 1);
        handle.style.left = shownCut * 100 + '%';
        past.style.width = shownCut * 100 + '%';
        applyTime();
    }

    function applyTime() {
        let latest = null;
        let count = 0;
        timeline.forEach(item => {
            const on = isShown(item);
            if (on) {
                latest = item;
                count += 1;
            }
            nodes.get(item.id).classList.toggle('is-future', !on);
            markEls.get(item.id).classList.toggle('is-future', !on);
        });
        edges.forEach(edge => {
            const hidden = [edge.a, edge.b].some(key => byId.has(key) && !isShown(byId.get(key)));
            edge.el.classList.toggle('is-future', hidden);
        });
        KIND_ORDER.forEach(kind => {
            const n = items.filter(item => item.modality === kind && isShown(item)).length;
            const hub = nodes.get('hub:' + kind);
            hub.querySelector('.hub-count').textContent = n;
            hub.classList.toggle('is-empty', n === 0);
            hub.setAttribute('aria-label', `${KINDS[kind].label}: ${n} ${KINDS[kind].plural}. Highlight them`);
        });

        const now = state.cut >= 1 - 1e-6;
        const text = now ? 'Now' : latest ? monthYear(latest.date) : '…';
        label.textContent = text;
        label.style.setProperty('--label-shift', shiftWithin(label.offsetWidth, clamp(state.cut, 0, 1) * track.clientWidth));
        const index = stops.findIndex(stop => Math.abs(stop - state.cut) < 1e-6);
        handle.setAttribute('aria-valuenow', String(index >= 0 ? index : Math.max(0, count - 1)));
        handle.setAttribute('aria-valuetext', `${now ? 'Now' : text}: ${count} of ${items.length} pieces`);
        trace();
    }

    const nearestStop = cut => stops.reduce((best, stop) => (Math.abs(stop - cut) < Math.abs(best - cut) ? stop : best), stops[0]);
    const touched = () => timelineEl.classList.add('is-touched');
    let dragging = false;

    const cutAt = clientX => {
        const box = track.getBoundingClientRect();
        return clamp((clientX - box.left) / box.width, 0, 1);
    };

    track.addEventListener('pointerdown', event => {
        if (event.button !== 0 || event.target.closest('.tl-mark')) return;
        event.preventDefault();
        stopSweep();
        touched();
        dragging = true;
        timelineEl.classList.add('is-dragging');
        track.setPointerCapture(event.pointerId);
        if (event.pointerType === 'mouse') handle.focus({ preventScroll: true });
        setCut(cutAt(event.clientX));
    });
    track.addEventListener('pointermove', event => {
        if (dragging) setCut(cutAt(event.clientX));
    });
    const endDrag = () => {
        if (!dragging) return;
        dragging = false;
        timelineEl.classList.remove('is-dragging');
        setCut(nearestStop(state.cut), { snap: true });
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);

    handle.addEventListener('keydown', event => {
        const current = stops.indexOf(nearestStop(state.cut));
        const moves = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -3, PageUp: 3 };
        let next = null;
        if (event.key in moves) next = current + moves[event.key];
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = stops.length - 1;
        if (next === null) return;
        event.preventDefault();
        stopSweep();
        touched();
        setCut(stops[clamp(next, 0, stops.length - 1)], { snap: true });
    });

    // First visit: the map grows in the order things were made, then rests at Now.
    let sweeping = false;
    let sweepFrame = 0;
    function intro() {
        if (calm.matches) {
            setCut(1);
            return;
        }
        map.classList.add('is-drawing');
        setTimeout(() => map.classList.remove('is-drawing'), 1200);
        sweeping = true;
        timelineEl.classList.add('is-sweeping');
        setCut(-0.02);
        const start = performance.now() + 650;
        const duration = 2100;
        const frame = now => {
            if (!sweeping) return;
            const p = clamp((now - start) / duration, 0, 1);
            const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
            setCut(-0.02 + 1.02 * eased);
            if (p < 1) sweepFrame = requestAnimationFrame(frame);
            else stopSweep();
        };
        sweepFrame = requestAnimationFrame(frame);
    }

    function stopSweep() {
        if (!sweeping) return;
        sweeping = false;
        cancelAnimationFrame(sweepFrame);
        timelineEl.classList.remove('is-sweeping');
        if (state.cut < 0) setCut(1);
    }

    /* ---------------- the window ---------------- */

    function fitPhoto(item) {
        const maxW = Math.min(window.innerWidth * 0.88, 980);
        const maxH = Math.min(window.innerHeight * (narrow.matches ? 0.7 : 0.74), 760);
        const scale = Math.min(maxW / item.width, maxH / item.height, 1);
        return [Math.round(item.width * scale), Math.round(item.height * scale)];
    }

    function windowFor(item) {
        const frame = el('div', `pw-frame pw-${item.modality}`);
        const close = el('button', 'pw-close', { type: 'button', 'aria-label': 'Close' });
        close.textContent = '×';
        close.addEventListener('click', closePiece);
        const date = el('time', 'pw-date', { datetime: item.date });
        date.textContent = item.date;
        const title = el('h2', '', { id: 'pw-title' });
        frame.appendChild(close);

        if (item.modality === 'see') {
            const [w, h] = fitPhoto(item);
            const img = el('img', '', { src: ROOT + item.image, alt: item.alt, width: item.width, height: item.height });
            img.style.width = w + 'px';
            img.style.height = h + 'px';
            frame.append(img, date);
        } else if (item.modality === 'think') {
            title.textContent = item.title;
            const text = el('div', 'pw-text');
            text.innerHTML = item.html;
            text.querySelectorAll('a[target="_blank"]').forEach(link => { link.rel = 'noopener noreferrer'; });
            frame.append(date, title, text);
        } else if (item.modality === 'make') {
            const video = el('video', '', {
                controls: '',
                playsinline: '',
                preload: 'metadata',
                poster: ROOT + item.poster,
                src: ROOT + item.video,
                'aria-label': item.title,
            });
            const caption = el('div', 'pw-caption');
            title.textContent = item.title;
            const text = el('p');
            text.textContent = item.text;
            caption.append(date, title, text);
            frame.append(video, caption);
        } else {
            date.textContent = `${item.venue} · ${item.date}`;
            const link = el('a', '', { href: item.url, target: '_blank', rel: 'noopener noreferrer' });
            link.textContent = item.title;
            title.appendChild(link);
            const more = el('a', 'pw-link', { href: item.url, target: '_blank', rel: 'noopener noreferrer' });
            more.textContent = 'Read on Medium ↗';
            frame.append(date, title, more);
        }
        return frame;
    }

    function openPiece(id, origin) {
        const item = byId.get(id);
        if (!item) return;
        closing = null;
        state.open = id;
        pwBody.replaceChildren(windowFor(item));
        dialog.setAttribute('aria-label', `${KINDS[item.modality].label}: ${item.title}`);
        if (!dialog.open) {
            dialog.showModal();
            document.documentElement.style.overflow = 'hidden';
        } else {
            // Stepping to another piece replaces the content, so keep focus inside the window.
            pwBody.querySelector('.pw-close').focus({ preventScroll: true });
        }
        grow(origin);
        history.replaceState(null, '', '#' + id);
        trace();
    }

    // The window grows out of the piece that was clicked.
    function grow(origin) {
        const frame = pwBody.firstElementChild;
        if (calm.matches || !frame || !frame.animate) return;
        const from = origin && origin.getBoundingClientRect();
        if (!from || !from.width) {
            frame.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
            return;
        }
        const to = frame.getBoundingClientRect();
        const dx = from.left + from.width / 2 - (to.left + to.width / 2);
        const dy = from.top + from.height / 2 - (to.top + to.height / 2);
        const scale = clamp(from.width / to.width, 0.12, 0.6);
        frame.animate(
            [{ transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0 }, { transform: 'none', opacity: 1 }],
            { duration: 340, easing: 'cubic-bezier(.2, .8, .2, 1)' },
        );
    }

    let closing = null;
    function closePiece() {
        if (!dialog.open) return;
        const frame = pwBody.firstElementChild;
        if (calm.matches || !frame || !frame.animate) {
            dialog.close();
            return;
        }
        const token = {};
        closing = token;
        frame.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.96)' }], { duration: 140, easing: 'ease-in' })
            .onfinish = () => { if (closing === token) dialog.close(); };
    }

    dialog.addEventListener('cancel', event => {
        event.preventDefault();
        closePiece();
    });
    dialog.addEventListener('click', event => {
        if (event.target === dialog) closePiece();
    });
    dialog.addEventListener('close', () => {
        state.open = null;
        closing = null;
        pwBody.replaceChildren();
        document.documentElement.style.overflow = '';
        history.replaceState(null, '', location.pathname + location.search);
        trace();
    });

    // In the window, ← and → step through what was made before and after.
    document.addEventListener('keydown', event => {
        if (!dialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        if (event.target.closest('video')) return;
        const shown = timeline.filter(isShown);
        const index = shown.findIndex(item => item.id === state.open);
        const next = shown[index + (event.key === 'ArrowRight' ? 1 : -1)];
        if (!next) return;
        event.preventDefault();
        openPiece(next.id, null);
    });

    window.addEventListener('resize', () => {
        if (!timeline.length) return;
        applyTime();
        const img = dialog.open && pwBody.querySelector('.pw-see img');
        if (img) {
            const [w, h] = fitPhoto(byId.get(state.open));
            img.style.width = w + 'px';
            img.style.height = h + 'px';
        }
    });

    window.addEventListener('hashchange', () => {
        const hash = decodeURIComponent(location.hash.slice(1));
        if (byId.has(hash) && hash !== state.open) openPiece(hash, nodes.get(hash));
    });
});
