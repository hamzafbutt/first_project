document.addEventListener('DOMContentLoaded', () => {
    const angleSlider = document.getElementById('angleSlider');
    const angleInput = document.getElementById('angleInput');
    const dynamicAngles = document.querySelectorAll('.dynamic-angle');

    // SVG Elements
    const hypotenuse = document.getElementById('hypotenuse');
    const sinLine = document.getElementById('sinLine');
    const cosLine = document.getElementById('cosLine');
    const tanLine = document.getElementById('tanLine');
    const point = document.getElementById('point');
    const angleArc = document.getElementById('angleArc');

    // Value Elements
    const valSin = document.getElementById('valSin');
    const valCos = document.getElementById('valCos');
    const valTan = document.getElementById('valTan');

    // Graph Elements
    const sinPath = document.getElementById('sinPath');
    const cosPath = document.getElementById('cosPath');
    const tanPath = document.getElementById('tanPath');
    const currentLine = document.getElementById('currentLine');
    const pointSin = document.getElementById('pointSin');
    const pointCos = document.getElementById('pointCos');

    function drawStaticGraphs() {
        let sinD = "M 0 0";
        let cosD = "M 0 -100";
        let tanD = "";

        for (let x = 0; x <= 360; x += 1) {
            let rad = (x * Math.PI) / 180;
            let s = -Math.sin(rad) * 100; // Scaled for new viewBox
            let c = -Math.cos(rad) * 100;

            sinD += ` L ${x} ${s}`;
            cosD += ` L ${x} ${c}`;

            if (x % 2 === 0) { // Optimize tan drawing
                let t = -Math.tan(rad) * 100;
                if (Math.abs(t) < 150) { // Scaled limit (ViewBox is 120 high)
                    if (tanD === "" || Math.abs(Math.tan(((x - 2) * Math.PI) / 180)) > 5) {
                        tanD += ` M ${x} ${t}`;
                    } else {
                        tanD += ` L ${x} ${t}`;
                    }
                }
            }
        }
        sinPath.setAttribute('d', sinD);
        cosPath.setAttribute('d', cosD);
        tanPath.setAttribute('d', tanD);
    }

    function updateTrigonometry() {
        // Read angle from slider (0 to 360)
        let angleDeg = parseInt(angleSlider.value);

        // Convert angle for correct SVG coordinate system (standard math: 0 right, CCW)
        // Note: In SVG, y axis goes DOWN. So math positive Y means SVG negative Y.
        // So we negate the angle for SVG calculations.
        let angleRad = (angleDeg * Math.PI) / 180;

        // Math coordinates
        let cosVal = Math.cos(angleRad);
        let sinVal = Math.sin(angleRad);
        let tanVal = Math.tan(angleRad);

        // Update Text Values
        angleInput.value = angleDeg;
        dynamicAngles.forEach(el => el.textContent = angleDeg);

        valSin.textContent = sinVal.toFixed(3);
        valCos.textContent = cosVal.toFixed(3);

        // Handle Tangent infinity visually
        if (Math.abs(cosVal) < 0.0001) {
            valTan.innerHTML = "&infin;";
        } else {
            valTan.textContent = tanVal.toFixed(3);
        }

        // --- Update SVG ---
        // SVG coordinates: x is same, y is inverted
        let svgX = cosVal;
        let svgY = -sinVal;

        // Hypotenuse (from center to point on circle)
        hypotenuse.setAttribute('x2', svgX);
        hypotenuse.setAttribute('y2', svgY);

        // Sin Line (vertical, from x axis to point)
        sinLine.setAttribute('x1', svgX);
        sinLine.setAttribute('y1', 0);
        sinLine.setAttribute('x2', svgX);
        sinLine.setAttribute('y2', svgY);

        // Cos Line (horizontal, from center to x component)
        cosLine.setAttribute('x1', 0);
        cosLine.setAttribute('y1', 0);
        cosLine.setAttribute('x2', svgX);
        cosLine.setAttribute('y2', 0);

        // Tan Line (tangent line on x=1 or x=-1)
        // For visualization, simple tangent line from standard (1,0) going vertical
        // To be correct visually, we draw it from (1,0) to (1, -tan(angle))
        // But only if angle is on right side. If left side, draw from (-1,0) to (-1, -tan)
        let tanBaseX = cosVal >= 0 ? 1 : -1;
        let tanY = -tanVal * tanBaseX;

        // Limit tan line length so it doesn't break SVG viewBox completely
        if (tanY < -1.5) tanY = -1.5;
        if (tanY > 1.5) tanY = 1.5;

        tanLine.setAttribute('x1', tanBaseX);
        tanLine.setAttribute('y1', 0);
        tanLine.setAttribute('x2', tanBaseX);
        tanLine.setAttribute('y2', tanY);

        // Hide tan line if it gets too crazy close to 90/270
        if (Math.abs(cosVal) < 0.05) {
            tanLine.style.opacity = '0';
        } else {
            tanLine.style.opacity = '1';
        }

        // Point
        point.setAttribute('cx', svgX);
        point.setAttribute('cy', svgY);

        // Angle Arc
        let r = 0.2; // arc radius
        let startX = r;
        let startY = 0;
        let endX = r * cosVal;
        let endY = -r * sinVal; // inverted y

        let largeArcFlag = angleDeg > 180 ? 1 : 0;
        // sweep flag is 0 because we go CCW in math, but SVG y points down, so we actually go negative Y, which is CCW in SVG
        let sweepFlag = 0;

        let d = `M 0 0 L ${startX} ${startY} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY} Z`;
        if (angleDeg === 0) {
            d = "";
        } else if (angleDeg === 360) {
            d = `M 0 0 L ${r} 0 A ${r} ${r} 0 1 0 ${r} -0.01 Z`;
        }
        angleArc.setAttribute('d', d);

        // --- Update Graph Position ---
        currentLine.setAttribute('x1', angleDeg);
        currentLine.setAttribute('x2', angleDeg);
        pointSin.setAttribute('cx', angleDeg);
        pointSin.setAttribute('cy', -sinVal * 100);
        pointCos.setAttribute('cx', angleDeg);
        pointCos.setAttribute('cy', -cosVal * 100);
    }

    angleInput.addEventListener('input', () => {
        let val = parseInt(angleInput.value);
        if (!isNaN(val)) {
            if (val < 0) val = 0;
            if (val > 360) val = 360;
            angleSlider.value = val;
            updateTrigonometry();
        }
    });

    // --- Exercises Logic ---
    const questionText = document.getElementById('questionText');
    const answerInput = document.getElementById('answerInput');
    const submitAnswerBtn = document.getElementById('submitAnswerBtn');
    const feedbackText = document.getElementById('feedbackText');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const scoreValue = document.getElementById('scoreValue');
    const streakValue = document.getElementById('streakValue');
    const streakDisplay = document.getElementById('streakDisplay');
    const progressFill = document.getElementById('progressFill');
    const exerciseVisual = document.getElementById('exerciseVisual');

    let currentAnswer = 0;
    let score = 0;
    let currentQuestionIndex = 1;
    let totalQuestions = 5;
    let streak = 0;

    function updateStreakDisplay() {
        if (streak > 1) {
            streakDisplay.style.display = 'inline-block';
            streakValue.textContent = streak;
        } else {
            streakDisplay.style.display = 'none';
        }
    }

    function drawExerciseVisual(type, data) {
        if (!exerciseVisual) return;
        exerciseVisual.innerHTML = '';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 200 120');
        svg.classList.add('exercise-svg');

        if (type === 'triangle') {
            const { a, b, gamma, highlight } = data;
            const drawA = typeof a === 'number' ? a : 8;
            const drawB = typeof b === 'number' ? b : 8;
            const rad = (gamma * Math.PI) / 180;
            const cx = 50, cy = 100;
            const ax = cx + drawB * 10, ay = cy;
            const bx = cx + drawA * 10 * Math.cos(rad), by = cy - drawA * 10 * Math.sin(rad);

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M ${cx} ${cy} L ${ax} ${ay} L ${bx} ${by} Z`);
            path.setAttribute('fill', 'rgba(124, 58, 237, 0.2)');
            path.setAttribute('stroke', 'var(--primary)');
            path.setAttribute('stroke-width', '2');
            svg.appendChild(path);

            const addText = (tx, ty, content, color) => {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', tx);
                text.setAttribute('y', ty);
                text.setAttribute('fill', color || 'var(--text-primary)');
                text.setAttribute('font-size', '10');
                text.setAttribute('text-anchor', 'middle');
                text.textContent = content;
                svg.appendChild(text);
            };

            addText((cx + ax) / 2, cy + 15, `b = ${b}`, highlight === 'b' ? 'var(--secondary)' : null);
            addText((cx + bx) / 2 - 10, (cy + by) / 2, `a = ${a}`, highlight === 'a' ? 'var(--secondary)' : null);
            addText(cx + 20, cy - 5, `${gamma}°`, highlight === 'gamma' ? 'var(--secondary)' : 'var(--accent)');
        } else if (type === 'unitCircle') {
            const angle = data.angle;
            const rad = (angle * Math.PI) / 180;
            const cx = 100, cy = 60, r = 45;

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', cx); circle.setAttribute('cy', cy); circle.setAttribute('r', r);
            circle.setAttribute('fill', 'none'); circle.setAttribute('stroke', 'rgba(255,255,255,0.2)');
            svg.appendChild(circle);

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', cx); line.setAttribute('y1', cy);
            line.setAttribute('x2', cx + r * Math.cos(rad)); line.setAttribute('y2', cy - r * Math.sin(rad));
            line.setAttribute('stroke', 'var(--primary)');
            svg.appendChild(line);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', cx); text.setAttribute('y', cy + r + 15);
            text.setAttribute('text-anchor', 'middle'); text.setAttribute('fill', 'var(--primary)');
            text.textContent = `Winkel: ${angle}°`;
            svg.appendChild(text);
        }
        exerciseVisual.appendChild(svg);
    }

    function generateQuestion() {
        if (currentQuestionIndex > totalQuestions) {
            questionText.textContent = `Übung abgeschlossen! Punktzahl: ${score}`;
            exerciseVisual.innerHTML = '<div style="font-size: 3rem;">🏆</div>';
            answerInput.style.display = 'none';
            submitAnswerBtn.style.display = 'none';
            nextQuestionBtn.textContent = 'Neuer Durchlauf';
            nextQuestionBtn.style.display = 'inline-block';
            nextQuestionBtn.onclick = () => location.reload();
            return;
        }

        answerInput.value = '';
        answerInput.disabled = false;
        submitAnswerBtn.disabled = false;
        nextQuestionBtn.style.display = 'none';
        feedbackText.textContent = '';
        feedbackText.className = 'feedback';
        updateStreakDisplay();

        const types = ['sin', 'cos', 'tan', 'area', 'bottle', 'sinussatz', 'kosinussatz'];
        const type = types[Math.floor(Math.random() * types.length)];

        if (type === 'sinussatz') {
            const a = Math.floor(Math.random() * 6) + 4; // 4-10
            const alpha = [30, 45, 60][Math.floor(Math.random() * 3)];
            const beta = [30, 45, 60][Math.floor(Math.random() * 3)];
            const radA = (alpha * Math.PI) / 180;
            const radB = (beta * Math.PI) / 180;
            // a / sin(alpha) = b / sin(beta) => b = (a * sin(beta)) / sin(alpha)
            currentAnswer = (a * Math.sin(radB)) / Math.sin(radA);
            questionText.textContent = `Finde b: Gegeben a = ${a}, \u03B1 = ${alpha}° und \u03B2 = ${beta}°.`;
            drawExerciseVisual('triangle', { a, b: '?', gamma: 180 - alpha - beta, highlight: 'b' });
        } else if (type === 'kosinussatz') {
            const a = 5, b = 7, gamma = 60;
            const rad = (gamma * Math.PI) / 180;
            // c^2 = a^2 + b^2 - 2ab * cos(gamma)
            currentAnswer = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(rad));
            questionText.textContent = `Berechne c: Gegeben a = ${a}, b = ${b} und \u03B3 = ${gamma}°.`;
            drawExerciseVisual('triangle', { a, b, gamma, highlight: 'c' });
        } else if (type === 'area') {
            const a = 8, b = 10, gamma = 30;
            currentAnswer = 0.5 * a * b * Math.sin((gamma * Math.PI) / 180);
            questionText.textContent = `Flächeninhalt: a = ${a}, b = ${b}, \u03B3 = ${gamma}°.`;
            drawExerciseVisual('triangle', { a, b, gamma, highlight: 'area' });
        } else if (type === 'bottle') {
            const d = 10, alpha = 30;
            currentAnswer = d * Math.tan((alpha * Math.PI) / 180);
            questionText.textContent = `Flasche (h): d = ${d}, Neigung \u03B1 = ${alpha}°.`;
            exerciseVisual.innerHTML = '<div style="font-size: 3rem;">🍾</div>';
        } else {
            const angle = [0, 30, 45, 60, 90, 180, 270][Math.floor(Math.random() * 7)];
            const rad = (angle * Math.PI) / 180;
            if (type === 'sin') currentAnswer = Math.sin(rad);
            else if (type === 'cos') currentAnswer = Math.cos(rad);
            else if (type === 'tan') {
                if (angle === 90 || angle === 270) return generateQuestion();
                currentAnswer = Math.tan(rad);
            }
            questionText.textContent = `Was ist ${type}(${angle}°)?`;
            drawExerciseVisual('unitCircle', { angle });
        }
    }

    function checkAnswer() {
        const userVal = parseFloat(answerInput.value.replace(',', '.'));
        if (isNaN(userVal)) return;

        const isCorrect = Math.abs(userVal - currentAnswer) < 0.1;

        if (isCorrect) {
            feedbackText.textContent = 'Hervorragend! Richtig.';
            feedbackText.className = 'feedback correct';
            streak++;
            score += 10 + streak * 2;
            updateStreakDisplay();
        } else {
            feedbackText.textContent = `Nicht ganz. Richtig ist ${currentAnswer.toFixed(2)}.`;
            feedbackText.className = 'feedback incorrect';
            streak = 0;
            updateStreakDisplay();
        }

        scoreValue.textContent = score;
        progressFill.style.width = `${(currentQuestionIndex / totalQuestions) * 100}%`;
        currentQuestionIndex++;

        answerInput.disabled = true;
        submitAnswerBtn.disabled = true;
        nextQuestionBtn.style.display = 'inline-block';
    }

    if (submitAnswerBtn) {
        submitAnswerBtn.onclick = checkAnswer;
        nextQuestionBtn.onclick = generateQuestion;
        answerInput.onkeypress = (e) => { if (e.key === 'Enter') checkAnswer(); };
        generateQuestion();
    }


    // --- Bottle Animation Logic ---
    const tiltSlider = document.getElementById('tiltSlider');
    const tiltInput = document.getElementById('tiltInput');
    const waterLayer = document.getElementById('waterLayer');
    const heightDiffLine = document.getElementById('heightDiffLine');
    const heightDiffText = document.getElementById('heightDiffText');
    const valBottleH = document.getElementById('valBottleH');

    // Auxiliary Triangle Elements
    const triHyp = document.getElementById('triHyp');
    const triAnk = document.getElementById('triAnk');
    const triGeg = document.getElementById('triGeg');
    const lblAnk = document.getElementById('lblAnk');
    const lblHyp = document.getElementById('lblHyp');
    const valBottleA = document.getElementById('valBottleA');

    function updateBottleAnimation() {
        const tiltDeg = parseInt(tiltSlider.value);
        const tiltRad = (tiltDeg * Math.PI) / 180;

        tiltInput.value = tiltDeg;

        const diameter = 150; // Bottle width in SVG
        const h = diameter * Math.tan(tiltRad);
        const diameterSVG = 150; // Bottle width in pixels for SVG
        const dNorm = 1.0;       // Normalized diameter for math
        const hNorm = dNorm * Math.tan(tiltRad);
        const areaNorm = 0.5 * dNorm * hNorm;
        const hypNorm = Math.sqrt(dNorm * dNorm + hNorm * hNorm);

        const hSVG = diameterSVG * Math.tan(tiltRad);

        valBottleH.textContent = hNorm.toFixed(3);
        valBottleA.textContent = areaNorm.toFixed(3);

        // Update Water Path
        // Initial path: M 25 200 L 175 200 L 175 350 Q 175 350 155 350 L 45 350 Q 25 350 25 330 Z
        // We tilt the surface from (25, 200) to (175, 200)
        // Point A: (25, 200 + h/2)
        // Point B: (175, 200 - h/2)
        // This keeps the volume roughly constant while tilting

        const yBase = 200;
        const yStart = yBase + (hSVG / 2);
        const yEnd = yBase - (hSVG / 2);

        const newPath = `M 25 ${yStart} L 175 ${yEnd} L 175 330 Q 175 350 155 350 L 45 350 Q 25 350 25 330 Z`;
        waterLayer.setAttribute('d', newPath);

        // Update Auxiliary Triangle
        // Triangle is formed by: (25, yStart), (175, yStart), (175, yEnd)
        triAnk.setAttribute('x1', 25);
        triAnk.setAttribute('y1', yStart);
        triAnk.setAttribute('x2', 175);
        triAnk.setAttribute('y2', yStart);

        triGeg.setAttribute('x1', 175);
        triGeg.setAttribute('y1', yStart);
        triGeg.setAttribute('x2', 175);
        triGeg.setAttribute('y2', yEnd);

        triHyp.setAttribute('x1', 25);
        triHyp.setAttribute('y1', yStart);
        triHyp.setAttribute('x2', 175);
        triHyp.setAttribute('y2', yEnd);

        // Update Labels
        lblAnk.textContent = `Ankathete (d = 1.000)`;
        lblAnk.setAttribute('x', 100);
        lblAnk.setAttribute('y', yStart + 15);

        lblHyp.textContent = `Hypotenuse (c = ${hypNorm.toFixed(3)})`;
        lblHyp.setAttribute('x', 100);
        lblHyp.setAttribute('y', (yStart + yEnd) / 2 - 10);
        const hypRotation = -tiltDeg;
        lblHyp.setAttribute('transform', `rotate(${hypRotation}, 100, ${(yStart + yEnd) / 2 - 10})`);

        // Visibility & Measurement Lines
        if (tiltDeg === 0) {
            heightDiffLine.style.opacity = '0';
            heightDiffText.style.opacity = '0';
            [triHyp, triAnk, triGeg, lblAnk, lblHyp].forEach(el => el.style.opacity = '0');
        } else {
            heightDiffLine.style.opacity = '1';
            heightDiffText.style.opacity = '1';
            [triHyp, triAnk, triGeg, lblAnk, lblHyp].forEach(el => el.style.opacity = '1');
            heightDiffText.textContent = `Gegenkathete (h = ${hNorm.toFixed(3)})`;
        }

        // Update Measurement Height Line
        // Vertical line on the right side showing h
        heightDiffLine.setAttribute('x1', 185);
        heightDiffLine.setAttribute('y1', yEnd);
        heightDiffLine.setAttribute('x2', 185);
        heightDiffLine.setAttribute('y2', yStart);

        // Update Text Position
        heightDiffText.setAttribute('y', (yStart + yEnd) / 2);
        heightDiffText.setAttribute('transform', `rotate(90, 195, ${(yStart + yEnd) / 2})`);
    }

    if (tiltSlider) {
        tiltSlider.addEventListener('input', updateBottleAnimation);
        tiltInput.addEventListener('input', () => {
            let val = parseInt(tiltInput.value);
            if (!isNaN(val)) {
                if (val < 0) val = 0;
                if (val > 45) val = 45;
                tiltSlider.value = val;
                updateBottleAnimation();
            }
        });
        updateBottleAnimation();
    }

    // --- Sine Area Logic ---
    const sideASlider = document.getElementById('sideASlider');
    const sideBSlider = document.getElementById('sideBSlider');
    const gammaSlider = document.getElementById('gammaSlider');
    const sideAInput = document.getElementById('sideAInput');
    const sideBInput = document.getElementById('sideBInput');
    const gammaInput = document.getElementById('gammaInput');
    const valTriA = document.getElementById('valTriA');
    const triPath = document.getElementById('triPath');
    const gammaArc = document.getElementById('gammaArc');
    const pA = document.getElementById('pA');
    const pB = document.getElementById('pB');
    const pC = document.getElementById('pC');
    const lblSideA = document.getElementById('lblSideA');
    const lblSideB = document.getElementById('lblSideB');
    const lblAngleGamma = document.getElementById('lblAngleGamma');

    function updateSineAreaAnimation() {
        const a = parseFloat(sideASlider.value);
        const b = parseFloat(sideBSlider.value);
        const gDeg = parseFloat(gammaSlider.value);
        const gRad = (gDeg * Math.PI) / 180;

        sideAInput.value = a;
        sideBInput.value = b;
        gammaInput.value = gDeg;

        // Coordinates:
        // C is origin (0,0)
        // A is on x-axis (b, 0)
        // B is at (a*cos(g), -a*sin(g)) -- Negative Y because SVG Y is down
        const cx = 0, cy = 0;
        const ax = b, ay = 0;
        const bx = a * Math.cos(gRad);
        const by = -a * Math.sin(gRad);

        // Update Points
        pC.setAttribute('cx', cx);
        pC.setAttribute('cy', cy);
        pA.setAttribute('cx', ax);
        pA.setAttribute('cy', ay);
        pB.setAttribute('cx', bx);
        pB.setAttribute('cy', by);

        // Update Triangle Path
        triPath.setAttribute('d', `M ${cx} ${cy} L ${ax} ${ay} L ${bx} ${by} Z`);

        // Update Gamma Arc
        const r = 30;
        const startX = r;
        const startY = 0;
        const endX = r * Math.cos(gRad);
        const endY = -r * Math.sin(gRad);
        const largeArc = gDeg > 180 ? 1 : 0;
        gammaArc.setAttribute('d', `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 0 ${endX} ${endY}`);

        // Update Labels (Midpoints for sides)
        // Label b (Base C-A)
        lblSideB.setAttribute('x', b / 2);
        lblSideB.setAttribute('y', 20);

        // Label a (Side C-B)
        lblSideA.setAttribute('x', bx / 2 - 15);
        lblSideA.setAttribute('y', by / 2 - 5);

        // Label Gamma
        lblAngleGamma.setAttribute('x', 35);
        lblAngleGamma.setAttribute('y', -10);

        // Calculate and Update Area
        // Formula: A = 0.5 * a * b * sin(gamma)
        // Since a and b are SVG units, let's normalize them for the display (e.g. / 100)
        const aNorm = a / 100;
        const bNorm = b / 100;
        const area = 0.5 * aNorm * bNorm * Math.sin(gRad);
        valTriA.textContent = area.toFixed(3);
    }

    if (sideASlider) {
        [sideASlider, sideBSlider, gammaSlider].forEach(slider => {
            slider.addEventListener('input', updateSineAreaAnimation);
        });

        [sideAInput, sideBInput, gammaInput].forEach((input, idx) => {
            const sliders = [sideASlider, sideBSlider, gammaSlider];
            input.addEventListener('input', () => {
                let val = parseFloat(input.value);
                if (!isNaN(val)) {
                    const slider = sliders[idx];
                    if (val < parseFloat(slider.min)) val = parseFloat(slider.min);
                    if (val > parseFloat(slider.max)) val = parseFloat(slider.max);
                    slider.value = val;
                    updateSineAreaAnimation();
                }
            });
        });

        updateSineAreaAnimation();
    }

    // Initialization
    drawStaticGraphs();
    angleSlider.addEventListener('input', updateTrigonometry);
    updateTrigonometry(); // call once to set initial state
});
