function stepValue(id, delta) {
    const input = document.getElementById(id);
    let val = parseFloat(input.value) || 0;
    val += delta;
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    if (!isNaN(min) && val < min) val = min;
    if (!isNaN(max) && val > max) val = max;
    input.value = val;
    calculate();
}

function toggleReverse(isReverse) {

    const checkbox = document.getElementById('pseudo_reverse');
    if (checkbox) checkbox.checked = isReverse;


    const buttons = document.querySelectorAll('.segment-btn');
    buttons.forEach(btn => {
        const btnReverse = btn.getAttribute('data-reverse') === 'true';
        if (btnReverse === isReverse) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });


    calculate();
}

function calculate() {
    const pCountInput = document.getElementById('pseudo_count');
    const pIntervalInput = document.getElementById('pseudo_interval');
    const pAngleInput = document.getElementById('pseudo_angle');
    const pReverseInput = document.getElementById('pseudo_reverse');

    if (!pCountInput || !pIntervalInput || !pAngleInput || !pReverseInput) return;

    let pCount = parseFloat(pCountInput.value);
    let pInterval = parseFloat(pIntervalInput.value);
    let pAngle = parseFloat(pAngleInput.value);
    let pReverse = pReverseInput.checked;

    if (pCount < 0) pCount = 0;
    if (pCount > 100) pCount = 100;
    pCountInput.value = pCount;

    if (pInterval < 1) pInterval = 1;
    if (pInterval > 100) pInterval = 100;
    pInterval = Math.floor(pInterval);
    pIntervalInput.value = pInterval;

    if (isNaN(pCount) || isNaN(pInterval) || isNaN(pAngle)) {
        document.getElementById('result').innerText = "Please enter valid numbers.";
        return;
    }

    let beatAngle = 180 + (180 - 180 / (pCount / 2)) / pInterval;
    if (pReverse) beatAngle = 360 - beatAngle;

    const totalBeat = pCount * pInterval;
    let angles = new Array(Math.round(totalBeat)).fill(beatAngle);
    let finalAngles = [];

    for (let i = 0; i < angles.length; i++) {
        if (i % pInterval === 0) {
            finalAngles.push(pAngle);
            finalAngles.push(beatAngle - pAngle);
        } else {
            finalAngles.push(angles[i]);
        }
    }


    drawVisualization([...finalAngles], pReverse);


    const beatAngleText = Number.isInteger(beatAngle) ? beatAngle : parseFloat(beatAngle.toFixed(6));
    const beatAngleElement = document.getElementById('beat-angle-display');
    if (beatAngleElement) beatAngleElement.innerText = beatAngleText;

    const formattedResult = finalAngles.map(a => Number.isInteger(a) ? a : parseFloat(a.toFixed(6))).join(', ');
    document.getElementById('result').innerText = formattedResult;


    let adofaiAngles = [];
    let cumulativeSum = 0;
    for (let i = 0; i < finalAngles.length; i++) {
        cumulativeSum += finalAngles[i];
        let val = 180 * (i + 1) - cumulativeSum;
        adofaiAngles.push(val);
    }
    const formattedAdofai = adofaiAngles.map(a => Number.isInteger(a) ? a : parseFloat(a.toFixed(6))).join(', ');
    const adofaiElement = document.getElementById('result-adofai');
    if (adofaiElement) adofaiElement.innerText = formattedAdofai;
}

function copyResult(id) {
    const text = document.getElementById(id).innerText;
    const iconCopy = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>`;
    const iconCheck = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;

    const container = document.getElementById(id).closest('.result-area');
    const btn = container.querySelector('.copy-btn');

    const copyAction = () => {
        btn.innerHTML = iconCheck;
        setTimeout(() => {
            btn.innerHTML = iconCopy;
        }, 1000);
    };

    navigator.clipboard.writeText(text).then(copyAction).catch(err => {
        console.error(err);
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            copyAction();
        } catch (err) {
            console.error(err);
        }
        document.body.removeChild(textArea);
    });
}

function copyValue(val) {
    navigator.clipboard.writeText(val).then(() => {

    });
}

function drawVisualization(angles, isReverse) {
    const canvas = document.getElementById('visualCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    const lineColor = isReverse ? '#ef4444' : '#38bdf8';
    const shadowColor = isReverse ? 'rgba(239, 68, 68, 0.8)' : 'rgba(56, 189, 248, 0.8)';
    const pointColor = isReverse ? '#fca5a5' : '#9CDEFC';


    const beatAngleElement = document.getElementById('beat-angle-display');
    if (beatAngleElement) {
        beatAngleElement.style.color = '#ffffff'; // Pure white for clarity
        beatAngleElement.style.opacity = '0.95';
        beatAngleElement.style.textShadow = '0 0 30px rgba(255, 255, 255, 0.5), 0 0 10px rgba(255, 255, 255, 0.3)';
    }

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 10;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    let points = [];
    let simX = 0;
    let simY = 0;
    let currentDirection = 0;
    const lineLength = 100;

    points.push({ x: simX, y: simY });
    simX += Math.cos(currentDirection * Math.PI / 180) * lineLength;
    simY += Math.sin(currentDirection * Math.PI / 180) * lineLength;
    points.push({ x: simX, y: simY });

    for (let i = 0; i < angles.length; i++) {
        const angle = angles[i];
        const rotation = 180 - angle;
        currentDirection -= rotation;
        simX += Math.cos(currentDirection * Math.PI / 180) * lineLength;
        simY += Math.sin(currentDirection * Math.PI / 180) * lineLength;
        points.push({ x: simX, y: simY });
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    points.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    });

    const padding = 60;
    const pathWidth = maxX - minX;
    const pathHeight = maxY - minY;
    if (pathWidth === 0 && pathHeight === 0) return;

    const scaleX = (canvas.width - padding * 2) / pathWidth;
    const scaleY = (canvas.height - padding * 2) / pathHeight;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (canvas.width - pathWidth * scale) / 2 - minX * scale;
    const offsetY = (canvas.height - pathHeight * scale) / 2 - minY * scale;

    ctx.beginPath();
    const startP = points[0];
    ctx.moveTo(startP.x * scale + offsetX, startP.y * scale + offsetY);

    for (let i = 1; i < points.length; i++) {
        const p = points[i];
        ctx.lineTo(p.x * scale + offsetX, p.y * scale + offsetY);
    }
    ctx.stroke();

    ctx.fillStyle = pointColor;
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        ctx.beginPath();
        ctx.arc(p.x * scale + offsetX, p.y * scale + offsetY, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}
