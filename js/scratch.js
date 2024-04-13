document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.querySelector('.top-layer');
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    // Set canvas size
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Fill the canvas (this represents the scratchable layer)
    ctx.fillStyle = '#CCCCCC'; // Color of the scratchable layer
    ctx.fillRect(0,
    0, canvas.width, canvas.height);

    let isScratching = false;

    const scratch = (e) => {
        if (!isScratching) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.globalCompositeOperation = 'destination-out'; // Set to scratch out
        ctx.arc(x, y,
        10,
        0, Math.PI * 2, true); // Scratch circle size
        ctx.fill();
    };

    canvas.addEventListener('mousedown', () => { isScratching = true;
    });
    canvas.addEventListener('mouseup', () => { isScratching = false;
    });
    canvas.addEventListener('mouseout', () => { isScratching = false;
    });
    canvas.addEventListener('mousemove', scratch);
});
