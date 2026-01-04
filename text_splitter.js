let loadedFontName = 'sans-serif';
let currentCharIndex = 0;
let previewInterval = null;
let splitterTags = [];

let selectedIndices = new Set();
let lastSelectedIndex = -1;
let isEditing = false;
let splitterInitialized = false;

function initTextSplitter() {
    renderTags();
    updateSplitterPreview();
    startPreviewCycle();

    if (splitterInitialized) return;
    splitterInitialized = true;

    document.addEventListener('keydown', (e) => {
        const splitterTab = document.getElementById('tab-splitter');
        if (!splitterTab || splitterTab.style.display === 'none') return;

        if (e.target.tagName === 'TEXTAREA' || (e.target.tagName === 'INPUT' && !e.target.classList.contains('inline-editor'))) return;

        if (e.key === 'Delete') {
            deleteSelectedTags();
        } else if (e.key === 'F2') {
            if (selectedIndices.size === 1) {
                const idx = selectedIndices.values().next().value;
                startInlineEdit(idx);
            }
        }
    });

    const container = document.getElementById('splitter_tags_container');
    if (container) {
        container.addEventListener('click', (e) => {
            if (!isEditing) {
                selectedIndices.clear();
                lastSelectedIndex = -1;
                renderTags();
                updateSplitterPreview();
            }
        });
    }

}


function startPreviewCycle() {
    if (previewInterval) clearInterval(previewInterval);
    previewInterval = setInterval(() => {
        let targets = Array.from(selectedIndices).sort((a, b) => a - b);
        if (targets.length === 0) {
            if (splitterTags.length > 0) {
                currentCharIndex = (currentCharIndex + 1) % splitterTags.length;
                updateSplitterPreview();
            }
        } else {
            let currentPos = targets.indexOf(currentCharIndex);
            if (currentPos === -1) {
                currentCharIndex = targets[0];
            } else {
                let nextPos = (currentPos + 1) % targets.length;
                currentCharIndex = targets[nextPos];
            }
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
                showAlert(t('text_splitter.error_font_load'));
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
        selectedIndices.clear();

        const distinctNewTags = [...new Set(newTags)];
        const uniqueNewTags = distinctNewTags.filter(tag => !splitterTags.includes(tag));
        splitterTags = [...splitterTags, ...uniqueNewTags];
        textarea.value = '';
        renderTags();
        updateSplitterPreview();
    }
}

function deleteSelectedTags() {
    if (isEditing) return;
    if (selectedIndices.size === 0) return;

    const indices = Array.from(selectedIndices).sort((a, b) => b - a);

    indices.forEach(idx => {
        splitterTags.splice(idx, 1);
    });

    selectedIndices.clear();
    lastSelectedIndex = -1;
    currentCharIndex = 0;

    renderTags();
    updateSplitterPreview();
}

async function clearAllTags() {
    if (splitterTags.length === 0) return;
    const confirmed = await showConfirm(t('text_splitter.confirm_clear'));
    if (confirmed) {
        splitterTags = [];
        selectedIndices.clear();
        lastSelectedIndex = -1;
        currentCharIndex = 0;
        renderTags();
        updateSplitterPreview();
    }
}

function renderTags() {
    const container = document.getElementById('splitter_tags_container');
    if (!container) return;

    if (splitterTags.length === 0) {
        container.innerHTML = `<span class="placeholder-text">${t('text_splitter.no_tags')}</span>`;
        return;
    }

    container.innerHTML = '';
    splitterTags.forEach((tag, index) => {
        const tagEl = document.createElement('div');
        tagEl.className = 'text-tag';
        if (selectedIndices.has(index)) {
            tagEl.classList.add('selected');
        }

        tagEl.onclick = (e) => handleTagClick(index, e);

        tagEl.oncontextmenu = (e) => {
            e.preventDefault();
            handleTagClick(index, e);
        };

        const textSpan = document.createElement('span');
        textSpan.innerText = tag;

        const removeSpan = document.createElement('span');
        removeSpan.className = 'remove-tag';
        removeSpan.innerHTML = '&times;';
        removeSpan.onclick = (e) => {
            e.stopPropagation();
            splitterTags.splice(index, 1);
            selectedIndices.clear();
            renderTags();
            updateSplitterPreview();
        };

        tagEl.appendChild(textSpan);
        tagEl.appendChild(removeSpan);
        container.appendChild(tagEl);
    });
}

function handleTagClick(index, e) {
    e.stopPropagation();
    if (isEditing) return;

    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        document.activeElement.blur();
    }

    if (e.ctrlKey) {
        if (selectedIndices.has(index)) {
            selectedIndices.delete(index);
        } else {
            selectedIndices.add(index);
            lastSelectedIndex = index;
        }
    } else if (e.shiftKey && lastSelectedIndex !== -1) {
        selectedIndices.clear();
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        for (let i = start; i <= end; i++) {
            selectedIndices.add(i);
        }
    } else {
        if (selectedIndices.has(index) && selectedIndices.size === 1) {
            startInlineEdit(index);
            return;
        } else {
            selectedIndices.clear();
            selectedIndices.add(index);
            lastSelectedIndex = index;
        }
    }

    if (selectedIndices.size > 0 && selectedIndices.has(index)) {
        currentCharIndex = index;
    }

    renderTags();
    updateSplitterPreview();
}

function startInlineEdit(index) {
    if (isEditing) return;

    const container = document.getElementById('splitter_tags_container');
    const tagEl = container.children[index];
    if (!tagEl) return;

    const span = tagEl.querySelector('span:not(.remove-tag)');
    if (span.isContentEditable) return;

    isEditing = true;

    span.contentEditable = true;
    span.focus();

    const range = document.createRange();
    range.selectNodeContents(span);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    span.onclick = (e) => e.stopPropagation();

    const finish = (save) => {
        if (!isEditing) return;

        span.onblur = null;
        span.onkeydown = null;
        span.onclick = null;

        const newVal = span.innerText;
        isEditing = false;
        span.contentEditable = false;

        if (save) {
            if (newVal.trim()) {
                splitterTags[index] = newVal.trim();
            } else {
                splitterTags.splice(index, 1);
                selectedIndices.clear();
            }
        }

        renderTags();
        updateSplitterPreview();
    };

    span.onblur = () => finish(true);
    span.onkeydown = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            finish(false);
        }
        e.stopPropagation();
    };
}



function updateSplitterPreview() {
    const width = parseInt(document.getElementById('splitter_width').value) || 500;
    const height = parseInt(document.getElementById('splitter_height').value) || 500;

    const textColorHex = document.getElementById('splitter_color').value;
    const textOpacity = document.getElementById('splitter_text_opacity').value;
    document.getElementById('text_opacity_display').innerText = `${textOpacity}%`;

    const bgColorHex = document.getElementById('splitter_bg_color').value;
    const bgOpacity = document.getElementById('splitter_bg_opacity').value;
    document.getElementById('bg_opacity_display').innerText = `${bgOpacity}%`;

    const scale = parseFloat(document.getElementById('splitter_scale_num').value) || 0;
    const xOffset = parseFloat(document.getElementById('splitter_x_num').value) || 0;
    const yOffset = parseFloat(document.getElementById('splitter_y_num').value) || 0;
    const prefix = document.getElementById('splitter_prefix').value;
    const format = document.getElementById('splitter_format').value;
    let ext = '.png';
    if (format === 'image/jpeg') ext = '.jpg';
    if (format === 'image/webp') ext = '.webp';

    const canvas = document.getElementById('splitterCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;

    const previewTag = splitterTags.length > 0 ? splitterTags[currentCharIndex % splitterTags.length] : "";

    if (previewTag) {
        document.getElementById('preview_filename').innerText = `${prefix}${previewTag}${ext}`;
    } else {
        document.getElementById('preview_filename').innerText = "-";
    }

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = hexToRgba(bgColorHex, bgOpacity / 100);
    ctx.fillRect(0, 0, width, height);

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
        warningEl.innerText = t('text_splitter.warning_clipped', { count: truncatedIndices.length });
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
        ctx.save();
        // 1. Punch a hole in the background (make it transparent)
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.fillText(previewTag, centerX, centerY);
        ctx.restore();

        // 2. Draw the text with its intended opacity on top
        // If opacity is 0, the hole remains transparent
        ctx.fillStyle = hexToRgba(textColorHex, textOpacity / 100);
        ctx.fillText(previewTag, centerX, centerY);
    }
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

async function generateSplitterZip() {
    const width = parseInt(document.getElementById('splitter_width').value) || 500;
    const height = parseInt(document.getElementById('splitter_height').value) || 500;

    const textColorHex = document.getElementById('splitter_color').value;
    const textOpacity = document.getElementById('splitter_text_opacity').value / 100;

    const bgColorHex = document.getElementById('splitter_bg_color').value;
    const bgOpacity = document.getElementById('splitter_bg_opacity').value / 100;

    const scale = parseFloat(document.getElementById('splitter_scale_num').value) || 1;
    const xOffset = parseFloat(document.getElementById('splitter_x_num').value) || 0;
    const yOffset = parseFloat(document.getElementById('splitter_y_num').value) || 0;
    const prefix = document.getElementById('splitter_prefix').value;

    const format = document.getElementById('splitter_format').value;
    const zipNameInput = document.getElementById('splitter_zip_filename').value.trim();
    const zipName = zipNameInput || "split_texts";

    let ext = '.png';
    if (format === 'image/jpeg') ext = '.jpg';
    if (format === 'image/webp') ext = '.webp';

    const status = document.getElementById('splitter_status');

    if (splitterTags.length === 0) {
        status.innerText = t('text_splitter.status_add_tags');
        status.style.color = "#ef4444";
        return;
    }

    status.innerText = t('text_splitter.status_generating');
    status.style.color = "var(--accent-color)";

    try {
        const zip = new JSZip();
        const offCanvas = document.createElement('canvas');
        const offCtx = offCanvas.getContext('2d');
        offCanvas.width = width;
        offCanvas.height = height;

        for (const tag of splitterTags) {
            offCtx.clearRect(0, 0, width, height);

            // 1. Draw background
            offCtx.globalCompositeOperation = 'source-over';
            offCtx.fillStyle = hexToRgba(bgColorHex, bgOpacity);
            offCtx.fillRect(0, 0, width, height);

            // 2. Punch a hole (destination-out)
            offCtx.globalCompositeOperation = 'destination-out';
            offCtx.fillStyle = 'rgba(0,0,0,1)';
            offCtx.font = `${height * 0.8 * scale}px "${loadedFontName}"`;
            offCtx.textAlign = 'center';
            offCtx.textBaseline = 'middle';
            offCtx.fillText(tag, width / 2 + xOffset, height / 2 + yOffset);

            // 3. Draw text color/opacity on top
            offCtx.globalCompositeOperation = 'source-over';
            offCtx.fillStyle = hexToRgba(textColorHex, textOpacity);
            offCtx.fillText(tag, width / 2 + xOffset, height / 2 + yOffset);

            const blob = await new Promise(resolve => offCanvas.toBlob(resolve, format));
            zip.file(`${prefix}${tag}${ext}`, blob);
        }

        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${zipName}.zip`;
        link.click();

        status.innerText = "";
    } catch (err) {
        console.error(err);
        status.innerText = t('text_splitter.status_error');
        status.style.color = "#ef4444";
    }
}

async function autoFitWidth() {
    if (splitterTags.length === 0) {
        return;
    }

    const height = parseInt(document.getElementById('splitter_height').value) || 500;
    const scale = parseFloat(document.getElementById('splitter_scale_num').value) || 1;

    const canvas = document.getElementById('splitterCanvas');
    const ctx = canvas.getContext('2d');

    const fontSize = height * 0.8 * scale;
    ctx.font = `${fontSize}px "${loadedFontName}"`;

    let maxW = 0;
    splitterTags.forEach(tag => {
        const metrics = ctx.measureText(tag);
        const w = Math.abs(metrics.actualBoundingBoxLeft) + Math.abs(metrics.actualBoundingBoxRight);
        const currentW = Math.max(w, metrics.width);
        if (currentW > maxW) maxW = currentW;
    });

    if (maxW > 0) {
        const newWidth = Math.ceil(maxW * 1.1);
        document.getElementById('splitter_width').value = newWidth;
        updateSplitterPreview();
    }
}
