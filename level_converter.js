const ggData = [];
const tufData = [];
const legacyData = [];

function initConverter() {

    for (let i = 1; i <= 18; i++) {
        ggData.push({ label: i.toString(), value: i });
    }
    ggData.push({ label: "18+", value: 18.5 });
    ggData.push({ label: "19", value: 19 });
    ggData.push({ label: "19+", value: 19.5 });
    for (let i = 200; i <= 226; i++) {
        let val = i / 10;
        ggData.push({ label: val.toFixed(1), value: val });
    }


    const prefixes = ['P', 'G', 'U'];
    prefixes.forEach(p => {
        for (let i = 1; i <= 20; i++) {
            tufData.push({ label: p + i, value: p + i });
        }
    });


    for (let i = 1; i <= 18; i++) {
        legacyData.push({ label: i.toString(), value: i });
    }
    legacyData.push({ label: "18+", value: 18.5 });
    legacyData.push({ label: "19", value: 19 });
    legacyData.push({ label: "19+", value: 19.5 });
    for (let i = 200; i <= 213; i++) {
        let base = i / 10;
        legacyData.push({ label: base.toFixed(1), value: base });
        legacyData.push({ label: base.toFixed(1) + "+", value: parseFloat((base + 0.05).toFixed(6)) });
    }


    populateSelect('gg_list', ggData);


    populateCustomSelect('tuf', tufData);
    populateCustomSelect('legacy', legacyData);


    document.getElementById('gg_list').addEventListener('change', (e) => onListChange('gg', e.target.value));


    document.addEventListener('click', function (event) {
        if (!event.target.closest('.custom-select')) {
            document.querySelectorAll('.options-container.show').forEach(el => el.classList.remove('show'));
        }
    });
}

function getTufImageUrl(val) {

    return `assets/TUF_PGU/${val}.png`;
}

function getLegacyImageUrl(valLabel) {

    if (/^[1-9]$/.test(valLabel)) {
        return `assets/TUF_Legacy/lv0${valLabel}.png`;
    }


    if (/^(1[0-9])$/.test(valLabel)) {
        return `assets/TUF_Legacy/${valLabel}.png`;
    }


    if (valLabel === '18+' || valLabel === '19+') {
        return `assets/TUF_Legacy/${valLabel}.png`;
    }


    const m20 = valLabel.match(/^20\.([0-4])(\+)?$/);
    if (m20) {
        const decimal = m20[1];
        const plus = m20[2];
        if (!plus) {
            if (decimal === '0') return `assets/TUF_Legacy/lvl20_0.png`;
            return `assets/TUF_Legacy/lv20__${decimal}.png`;
        } else {
            return `assets/TUF_Legacy/lv20__${decimal}p.png`;
        }
    }


    const m20high = valLabel.match(/^20\.([5-9])(\+)?$/);
    if (m20high) {
        const decimal = m20high[1];
        const plus = m20high[2];
        return `assets/TUF_Legacy/20.${decimal}${plus ? 'p' : ''}.png`;
    }


    const m21 = valLabel.match(/^21\.?([0-9])?(\+)?$/);
    if (m21) {
        if (valLabel === '21.0') return `assets/TUF_Legacy/21.png`;
        if (valLabel === '21.0+') return `assets/TUF_Legacy/21p.png`;
        if (valLabel === '21.3+') return `assets/TUF_Legacy/21.3+.png`;

        if (valLabel.endsWith('+')) {
            return `assets/TUF_Legacy/${valLabel.replace('+', 'p')}.png`;
        }
        return `assets/TUF_Legacy/${valLabel}.png`;
    }

    return `assets/TUF_Legacy/${valLabel}.png`;
}

function populateSelect(id, data) {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = "";
    data.forEach(item => {
        const opt = document.createElement('option');
        opt.text = item.label;
        opt.value = item.value;
        sel.add(opt);
    });
    sel.selectedIndex = -1;
}

function populateCustomSelect(type, data) {
    const containerId = type + '_options';
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'option-item';
        div.onclick = (e) => {
            e.stopPropagation();
            selectCustomOption(type, item);
            toggleDropdown(type + '_custom_select', e);
        };

        const img = document.createElement('img');
        if (type === 'tuf') {
            img.src = getTufImageUrl(item.label);
        } else {
            img.src = getLegacyImageUrl(item.label);
        }
        img.onerror = function () { this.style.display = 'none'; this.parentNode.innerText = item.label; };

        div.appendChild(img);
        container.appendChild(div);
    });
}

function toggleDropdown(id, event) {
    const dropdown = document.getElementById(id);
    const options = dropdown.querySelector('.options-container');

    document.querySelectorAll('.options-container.show').forEach(el => {
        if (el !== options) {
            el.classList.remove('show');
            el.style.top = '';
            el.style.left = '';
        }
    });

    const isShowing = options.classList.contains('show');

    if (!isShowing) {
        options.classList.add('show');

        const parentRect = dropdown.parentElement.getBoundingClientRect();
        const optionsRect = options.getBoundingClientRect();
        const padding = 20;

        const clickX = event.clientX;
        const clickY = event.clientY;

        let leftOffset = clickX - parentRect.left;
        if (clickX + optionsRect.width > window.innerWidth - padding) {
            leftOffset = (window.innerWidth - padding - optionsRect.width) - parentRect.left;
        }
        options.style.left = leftOffset + 'px';

        let topOffset = clickY - parentRect.top;
        if (clickY + optionsRect.height > window.innerHeight - padding) {
            topOffset = (window.innerHeight - padding - optionsRect.height) - parentRect.top;
        }
        options.style.top = topOffset + 'px';
    } else {
        options.classList.remove('show');
        options.style.top = '';
        options.style.left = '';
    }
}

function selectCustomOption(type, item) {
    if (type === 'tuf') {
        const input = document.getElementById('tuf');
        input.value = item.value;
        updateFromTUF();
    } else if (type === 'legacy') {
        const input = document.getElementById('tuf_legacy');

        input.value = typeof item.value === 'number' ? parseFloat(item.value.toFixed(6)) : item.value;
        updateFromLegacy();
    }
}

function updateCustomSelectDisplay(type, valLabel) {
    const displayId = type + '_selected_img';
    const displayDiv = document.getElementById(displayId);
    if (!displayDiv) return;

    displayDiv.innerHTML = "";

    if (!valLabel) {
        displayDiv.innerHTML = "<span>-</span>";
        return;
    }

    const img = document.createElement('img');
    if (type === 'tuf') {
        img.src = getTufImageUrl(valLabel);
    } else {
        img.src = getLegacyImageUrl(valLabel);
    }
    img.onerror = function () { this.style.display = 'none'; this.parentNode.innerText = valLabel; };
    displayDiv.appendChild(img);
}

function onListChange(type, val) {
    if (!val) return;
    if (type === 'gg') {
        const input = document.getElementById('gg');
        input.value = val;
        updateFromGG();
    }
}

function syncList(type, val) {
    let data = [];
    if (type === 'gg') {
        data = ggData;
        let bestVal = "";
        for (let i = 0; i < data.length; i++) {
            if (data[i].value <= val + 0.0001) {
                bestVal = data[i].value;
            } else { break; }
        }
        const sel = document.getElementById('gg_list');
        if (bestVal !== "") sel.value = bestVal.toString();
        else sel.selectedIndex = -1;

    } else if (type === 'tuf') {
        data = tufData;
        let targetLabel = "";

        const match = val.match(/^([PGU])\s*([\d.]+)$/);
        if (match) {
            const prefix = match[1];
            let num = Math.floor(parseFloat(match[2]));
            if (num > 20) num = 20;
            targetLabel = prefix + num;
        } else {
            if (data.find(d => d.value === val)) targetLabel = val;
        }

        updateCustomSelectDisplay('tuf', targetLabel);

    } else if (type === 'legacy') {
        data = legacyData;
        let bestLabel = "";
        for (let i = 0; i < data.length; i++) {
            if (data[i].value <= val + 0.0001) {
                bestLabel = data[i].label;
            } else { break; }
        }
        updateCustomSelectDisplay('legacy', bestLabel);
    }
}

function updateFromGG() {
    const ggInput = document.getElementById('gg');
    const tufInput = document.getElementById('tuf');
    const legacyInput = document.getElementById('tuf_legacy');

    let gg = parseFloat(ggInput.value);
    if (isNaN(gg)) return;

    syncList('gg', gg);

    let tuf = "";
    if (gg < 20) {
        let val;
        if (gg <= 3) {
            val = 1 + (gg - 1) * 0.5;
        } else if (gg <= 18) {
            val = gg - 1;
        } else {
            val = 17 + (gg - 18) * 2;
        }
        tuf = "P" + parseFloat(val.toFixed(6));
    } else if (gg < 21) {
        let val = 1 + (gg - 20) * 20;
        tuf = "G" + parseFloat(val.toFixed(6));
    } else {
        let val = 1 + (gg - 21) * 8;
        tuf = "U" + parseFloat(val.toFixed(6));
    }
    tufInput.value = tuf;
    syncList('tuf', tuf);

    let legacy = 0;
    if (gg <= 21) {
        legacy = gg;
    } else {
        legacy = 21 + (gg - 21) / 5;
    }
    legacyInput.value = parseFloat(legacy.toFixed(6));
    syncList('legacy', legacy);
}

function updateFromTUF() {
    const ggInput = document.getElementById('gg');
    const tufInput = document.getElementById('tuf');
    const legacyInput = document.getElementById('tuf_legacy');

    let tufStr = tufInput.value.trim().toUpperCase();
    syncList('tuf', tufStr);

    if (!tufStr) return;

    const match = tufStr.match(/^([PGU])\s*([\d.]+)$/);
    if (!match) return;

    const prefix = match[1];
    const val = parseFloat(match[2]);
    if (isNaN(val)) return;

    let gg = 0;
    if (prefix === 'P') {
        if (val <= 2) {
            gg = 1 + (val - 1) / 0.5;
        } else if (val <= 17) {
            gg = val + 1;
        } else {
            gg = 18 + (val - 17) / 2;
        }
    } else if (prefix === 'G') {
        gg = 20 + (val - 1) / 20;
    } else if (prefix === 'U') {
        gg = 21 + (val - 1) / 8;
    }

    gg = parseFloat(gg.toFixed(6));
    ggInput.value = gg;
    syncList('gg', gg);

    let legacy = 0;
    if (gg <= 21) {
        legacy = gg;
    } else {
        legacy = 21 + (gg - 21) / 5;
    }
    legacyInput.value = parseFloat(legacy.toFixed(6));
    syncList('legacy', legacy);
}

function updateFromLegacy() {
    const ggInput = document.getElementById('gg');
    const tufInput = document.getElementById('tuf');
    const legacyInput = document.getElementById('tuf_legacy');

    let legacy = parseFloat(legacyInput.value);
    if (isNaN(legacy)) return;

    syncList('legacy', legacy);

    let gg = 0;
    if (legacy <= 21) {
        gg = legacy;
    } else {
        gg = 21 + (legacy - 21) * 5;
    }
    gg = parseFloat(gg.toFixed(6));
    ggInput.value = gg;
    syncList('gg', gg);

    let tuf = "";
    if (gg < 20) {
        let val;
        if (gg <= 3) {
            val = 1 + (gg - 1) * 0.5;
        } else if (gg <= 18) {
            val = gg - 1;
        } else {
            val = 17 + (gg - 18) * 2;
        }
        tuf = "P" + parseFloat(val.toFixed(6));
    } else if (gg < 21) {
        let val = 1 + (gg - 20) * 20;
        tuf = "G" + parseFloat(val.toFixed(6));
    } else {
        let val = 1 + (gg - 21) * 8;
        tuf = "U" + parseFloat(val.toFixed(6));
    }
    tufInput.value = tuf;
    syncList('tuf', tuf);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConverter);
} else {
    initConverter();
}
