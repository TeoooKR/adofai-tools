function openTab(tabName) {
    const contents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < contents.length; i++) {
        contents[i].classList.remove('active');
    }

    const tabs = document.getElementsByClassName('nav-tab');
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }

    document.getElementById('tab-' + tabName).classList.add('active');

    if (tabName === 'new') {
        tabs[0].classList.add('active');
        setTimeout(calculate, 10);
    } else if (tabName === 'splitter') {
        tabs[1].classList.add('active');
        initTextSplitter();
    } else if (tabName === 'pseudo') {
        tabs[2].classList.add('active');
    }
}

window.onload = function () {
    if (typeof calculate === 'function') {
        calculate();
    }

    const ggInput = document.getElementById('gg');
    const tufInput = document.getElementById('tuf');
    const legacyInput = document.getElementById('tuf_legacy');

    if (ggInput && typeof updateFromGG === 'function') {
        ggInput.addEventListener('input', updateFromGG);
    }
    if (tufInput && typeof updateFromTUF === 'function') {
        tufInput.addEventListener('input', updateFromTUF);
    }
    if (legacyInput && typeof updateFromLegacy === 'function') {
        legacyInput.addEventListener('input', updateFromLegacy);
    }
};
