let loadedFontName = 'sans-serif';
let currentCharIndex = 0;
let previewInterval = null;
let splitterTags = [];

function initTextSplitter() {
    renderTags();
    updateSplitterPreview();
    startPreviewCycle();
}

function startPreviewCycle() {
    if (previewInterval) clearInterval(previewInterval);
    previewInterval = setInterval(() => {
        if (splitterTags.length > 0) {
            currentCharIndex = (currentCharIndex + 1) % splitterTags.length;
            updateSplitterPreview();
        }
    }, 1000);
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

function handleSplitterKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addSplitTag();
    } else if (e.altKey && e.key === '1') {
        e.preventDefault();
        splitBy('char');
    } else if (e.altKey && e.key === '2') {
        e.preventDefault();
        splitBy('word');
    } else if (e.altKey && e.key === '3') {
        e.preventDefault();
        splitBy('line');
    }
}

function addSplitTag() {
    const textarea = document.getElementById('splitter_text');
    const val = textarea.value.trim();
    if (val) {
        if (!splitterTags.includes(val)) {
            splitterTags.push(val);
            textarea.value = '';
            renderTags();
            updateSplitterPreview();
        } else {
            textarea.value = '';
        }
    }
}

function splitBy(mode) {
    const textarea = document.getElementById('splitter_text');
    const text = textarea.value;
    if (!text.trim()) return;

    let newTags = [];
    if (mode === 'char') {
        const clean = text.replace(/\s/g, '');
        newTags = clean.split('');
    } else if (mode === 'word') {
        newTags = text.split(/\s+/).filter(s => s.length > 0);
    } else if (mode === 'line') {
        newTags = text.split(/\n/).map(s => s.trim()).filter(s => s.length > 0);
    }

    if (newTags.length > 0) {
        const distinctNewTags = [...new Set(newTags)];
        const uniqueNewTags = distinctNewTags.filter(tag => !splitterTags.includes(tag));
        splitterTags = [...splitterTags, ...uniqueNewTags];
        textarea.value = '';
        renderTags();
        updateSplitterPreview();
    }
}

function removeTag(index, e) {
    e.stopPropagation();
    splitterTags.splice(index, 1);
    renderTags();
    updateSplitterPreview();
}

async function editTag(index) {
    const oldVal = splitterTags[index];
    const newVal = await showPrompt('Edit tag:', oldVal, true);
    if (newVal !== null) {
        const trimmed = newVal.trim();
        if (trimmed) {
            splitterTags[index] = trimmed;
        } else {
            splitterTags.splice(index, 1);
        }
        renderTags();
        updateSplitterPreview();
    }
}

async function clearAllTags() {
    if (splitterTags.length === 0) return;
    const count = splitterTags.length;
    const confirmed = await showConfirm(`Are you sure you want to clear all ${count} texts?`);
    if (confirmed) {
        splitterTags = [];
        renderTags();
        updateSplitterPreview();
    }
}

function renderTags() {
    const container = document.getElementById('splitter_tags_container');
    if (!container) return;

    if (splitterTags.length === 0) {
        container.innerHTML = '<span class="placeholder-text">No tags added yet.</span>';
        return;
    }

    container.innerHTML = '';
    splitterTags.forEach((tag, index) => {
        const tagEl = document.createElement('div');
        tagEl.className = 'text-tag';
        tagEl.onclick = () => editTag(index);

        tagEl.oncontextmenu = (e) => {
            e.preventDefault();
            removeTag(index, e);
        };

        const textSpan = document.createElement('span');
        textSpan.innerText = tag;

        const removeSpan = document.createElement('span');
        removeSpan.className = 'remove-tag';
        removeSpan.innerHTML = '&times;';
        removeSpan.onclick = (e) => removeTag(index, e);

        tagEl.appendChild(textSpan);
        tagEl.appendChild(removeSpan);
        container.appendChild(tagEl);
    });
}

function updateSplitterPreview() {
    const width = parseInt(document.getElementById('splitter_width').value) || 500;
    const height = parseInt(document.getElementById('splitter_height').value) || 500;
    const color = document.getElementById('splitter_color').value;

    const scale = parseFloat(document.getElementById('splitter_scale_num').value) || 0;
    const xOffset = parseFloat(document.getElementById('splitter_x_num').value) || 0;
    const yOffset = parseFloat(document.getElementById('splitter_y_num').value) || 0;
    const prefix = document.getElementById('splitter_prefix').value;

    document.getElementById('color_value_display').innerText = color.toUpperCase();

    const canvas = document.getElementById('splitterCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;

    const previewTag = splitterTags.length > 0 ? splitterTags[currentCharIndex % splitterTags.length] : "";

    if (previewTag) {
        document.getElementById('preview_filename').innerText = `${prefix}${previewTag}.png`;
    } else {
        document.getElementById('preview_filename').innerText = "-";
    }

    ctx.clearRect(0, 0, width, height);

    const fontSize = height * 0.8 * scale;
    ctx.font = `${fontSize}px "${loadedFontName}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const truncatedIndices = [];
    const centerX = width / 2 + xOffset;
    const centerY = height / 2 + yOffset;

    splitterTags.forEach((tag, index) => {
        const metrics = ctx.measureText(tag);

        const left = centerX - metrics.actualBoundingBoxLeft;
        const right = centerX + metrics.actualBoundingBoxRight;
        const top = centerY - metrics.actualBoundingBoxAscent;
        const bottom = centerY + metrics.actualBoundingBoxDescent;

        if (left < 0 || right > width || top < 0 || bottom > height) {
            truncatedIndices.push(index);
        }
    });

    const warningEl = document.getElementById('preview_warning');
    if (truncatedIndices.length > 0) {
        warningEl.style.display = 'block';
        warningEl.innerText = `⚠️ ${truncatedIndices.length}개의 텍스트가 잘렸습니다! (클릭하여 확인)`;
        warningEl.style.cursor = 'pointer';
        warningEl.onclick = () => {
            let nextIndex = truncatedIndices.find(i => i > currentCharIndex);
            if (nextIndex === undefined) nextIndex = truncatedIndices[0];

            currentCharIndex = nextIndex;
            startPreviewCycle();
            updateSplitterPreview();
        };
    } else {
        warningEl.style.display = 'none';
        warningEl.onclick = null;
    }

    if (previewTag) {
        ctx.fillStyle = color;

        ctx.fillText(previewTag, centerX, centerY);
    }
}

async function generateSplitterZip() {
    const width = parseInt(document.getElementById('splitter_width').value) || 500;
    const height = parseInt(document.getElementById('splitter_height').value) || 500;
    const color = document.getElementById('splitter_color').value;
    const scale = parseFloat(document.getElementById('splitter_scale_num').value) || 1;
    const xOffset = parseFloat(document.getElementById('splitter_x_num').value) || 0;
    const yOffset = parseFloat(document.getElementById('splitter_y_num').value) || 0;
    const prefix = document.getElementById('splitter_prefix').value;
    const status = document.getElementById('splitter_status');

    if (splitterTags.length === 0) {
        status.innerText = "Please add some tags first.";
        status.style.color = "#ef4444";
        return;
    }

    status.innerText = "Generating ZIP...";
    status.style.color = "var(--accent-color)";

    try {
        const zip = new JSZip();
        const offCanvas = document.createElement('canvas');
        const offCtx = offCanvas.getContext('2d');
        offCanvas.width = width;
        offCanvas.height = height;

        for (const tag of splitterTags) {
            offCtx.clearRect(0, 0, width, height);
            offCtx.fillStyle = color;
            offCtx.font = `${height * 0.8 * scale}px "${loadedFontName}"`;
            offCtx.textAlign = 'center';
            offCtx.textBaseline = 'middle';
            offCtx.fillText(tag, width / 2 + xOffset, height / 2 + yOffset);

            const blob = await new Promise(resolve => offCanvas.toBlob(resolve, 'image/png'));
            zip.file(`${prefix}${tag}.png`, blob);
        }

        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "split_texts.zip";
        link.click();

        status.innerText = "Download ready!";
        status.style.color = "#10b981";
    } catch (err) {
        console.error(err);
        status.innerText = "Error generating ZIP.";
        status.style.color = "#ef4444";
    }
}
