let loadedFontName = 'sans-serif';

let currentCharIndex = 0;
let previewInterval = null;

function initTextSplitter() {
    updateSplitterPreview();
    startPreviewCycle();
}

function startPreviewCycle() {
    if (previewInterval) clearInterval(previewInterval);
    previewInterval = setInterval(() => {
        const text = document.getElementById('splitter_text').value.replace(/\s/g, '');
        if (text.length > 0) {
            currentCharIndex = (currentCharIndex + 1) % text.length;
            updateSplitterPreview();
        }
    }, 1000); // 1초마다 글자 전환
}

function handleFontUpload(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const fontName = 'customFont_' + Date.now();
            const fontFace = new FontFace(fontName, e.target.result);
            fontFace.load().then(function (loadedFace) {
                document.fonts.add(loadedFace);
                loadedFontName = fontName;
                document.getElementById('font_name_display').innerText = file.name;
                updateSplitterPreview();
            }).catch(function (error) {
                console.error('Font loading failed:', error);
                alert('Font loading failed.');
            });
        };
        reader.readAsArrayBuffer(file);
    }
}

function syncSplitterScale(el, type) {
    const val = el.value;
    if (type === 'range-scale') {
        document.getElementById('splitter_scale_num').value = val;
    } else if (type === 'range-x') {
        document.getElementById('splitter_x_num').value = val;
    } else if (type === 'range-y') {
        document.getElementById('splitter_y_num').value = val;
    } else if (type === 'num-scale') {
        document.getElementById('splitter_scale').value = val;
    } else if (type === 'num-x') {
        document.getElementById('splitter_x').value = val;
    } else if (type === 'num-y') {
        document.getElementById('splitter_y').value = val;
    }
    updateSplitterPreview();
}

function updateSplitterPreview() {
    const text = document.getElementById('splitter_text').value.replace(/\s/g, '');
    const width = parseInt(document.getElementById('splitter_width').value) || 500;
    const height = parseInt(document.getElementById('splitter_height').value) || 500;
    const color = document.getElementById('splitter_color').value;

    // Read from Number inputs as primary source (allows values beyond range limits)
    const scale = parseFloat(document.getElementById('splitter_scale_num').value) || 0;
    const xOffset = parseFloat(document.getElementById('splitter_x_num').value) || 0;
    const yOffset = parseFloat(document.getElementById('splitter_y_num').value) || 0;
    const prefix = document.getElementById('splitter_prefix').value;

    // Sync label
    document.getElementById('color_value_display').innerText = color.toUpperCase();

    const canvas = document.getElementById('splitterCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;

    const uniqueChars = [...new Set(text)];
    const previewChar = uniqueChars.length > 0 ? uniqueChars[currentCharIndex % uniqueChars.length] : "";

    if (previewChar) {
        document.getElementById('preview_filename').innerText = `${prefix}${previewChar}.png`;
    } else {
        document.getElementById('preview_filename').innerText = "-";
    }

    ctx.clearRect(0, 0, width, height);

    if (previewChar) {
        ctx.fillStyle = color;
        ctx.font = `${height * 0.8 * scale}px "${loadedFontName}"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(previewChar, width / 2 + xOffset, height / 2 + yOffset);
    }
}

async function generateSplitterZip() {
    const text = document.getElementById('splitter_text').value;
    const width = parseInt(document.getElementById('splitter_width').value) || 500;
    const height = parseInt(document.getElementById('splitter_height').value) || 500;
    const color = document.getElementById('splitter_color').value;
    const scale = parseFloat(document.getElementById('splitter_scale').value) || 1;
    const xOffset = parseFloat(document.getElementById('splitter_x').value) || 0;
    const yOffset = parseFloat(document.getElementById('splitter_y').value) || 0;
    const prefix = document.getElementById('splitter_prefix').value;
    const status = document.getElementById('splitter_status');

    const uniqueChars = [...new Set(text.replace(/\s/g, ''))];

    if (uniqueChars.length === 0) {
        status.innerText = "Please enter some text.";
        status.style.color = "#ef4444";
        return;
    }

    status.innerText = "Generating ZIP...";
    status.style.color = "var(--accent-color)";

    const zip = new JSZip();
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');
    offCanvas.width = width;
    offCanvas.height = height;

    for (const char of uniqueChars) {
        offCtx.clearRect(0, 0, width, height);
        offCtx.fillStyle = color;
        offCtx.font = `${height * 0.8 * scale}px "${loadedFontName}"`;
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillText(char, width / 2 + xOffset, height / 2 + yOffset);

        const blob = await new Promise(resolve => offCanvas.toBlob(resolve, 'image/png'));
        zip.file(`${prefix}${char}.png`, blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = "typography_images.zip";
    link.click();

    status.innerText = "Download ready!";
    status.style.color = "#10b981";
}
