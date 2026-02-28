document.addEventListener('DOMContentLoaded', () => {
    const angleSlider = document.getElementById('angleSlider');
    const angleValue = document.getElementById('angleValue');
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
        angleValue.textContent = angleDeg;
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

    // --- Exercises Logic ---
    const questionText = document.getElementById('questionText');
    const answerInput = document.getElementById('answerInput');
    const submitAnswerBtn = document.getElementById('submitAnswerBtn');
    const feedbackText = document.getElementById('feedbackText');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const scoreValue = document.getElementById('scoreValue');
    const progressFill = document.getElementById('progressFill');

    let currentAnswer = 0;
    let score = 0;
    let currentQuestionIndex = 0;
    const totalQuestions = 5;

    function generateQuestion() {
        if (currentQuestionIndex >= totalQuestions) {
            // End of session
            questionText.textContent = `Training beendet! Endstand: ${score} Punkte.`;
            answerInput.style.display = 'none';
            submitAnswerBtn.style.display = 'none';
            nextQuestionBtn.textContent = 'Neustart';
            nextQuestionBtn.style.display = 'inline-block';
            nextQuestionBtn.onclick = () => {
                score = 0;
                currentQuestionIndex = 0;
                scoreValue.textContent = score;
                progressFill.style.width = '0%';
                answerInput.style.display = 'inline-block';
                submitAnswerBtn.style.display = 'inline-block';
                nextQuestionBtn.textContent = 'Nächste Frage';
                nextQuestionBtn.onclick = null;
                generateQuestion();
            };
            return;
        }

        // Reset UI
        answerInput.value = '';
        feedbackText.textContent = '';
        feedbackText.className = 'feedback';
        nextQuestionBtn.style.display = 'none';
        answerInput.disabled = false;
        submitAnswerBtn.disabled = false;

        const types = ['sin', 'cos', 'tan'];
        const type = types[Math.floor(Math.random() * types.length)];

        // Generate nice angles: multiples of 30 or 45
        const angles = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];
        const angle = angles[Math.floor(Math.random() * angles.length)];

        const rad = (angle * Math.PI) / 180;

        questionText.textContent = `Frage ${currentQuestionIndex + 1}/${totalQuestions}: Was ist ${type}(${angle}°)?`;

        if (type === 'sin') {
            currentAnswer = Math.sin(rad);
        } else if (type === 'cos') {
            currentAnswer = Math.cos(rad);
        } else if (type === 'tan') {
            // Avoid infinity input for tan(90) and tan(270)
            if (angle === 90 || angle === 270) {
                return generateQuestion();
            }
            currentAnswer = Math.tan(rad);
        }
    }

    function checkAnswer() {
        const userVal = parseFloat(answerInput.value);
        if (isNaN(userVal)) {
            feedbackText.textContent = 'Bitte gib eine Zahl ein.';
            return;
        }

        currentQuestionIndex++;
        const progress = (currentQuestionIndex / totalQuestions) * 100;
        progressFill.style.width = `${progress}%`;

        // Check if within 0.05 tolerance
        if (Math.abs(userVal - currentAnswer) <= 0.05) {
            feedbackText.textContent = 'Richtig! 🎉';
            feedbackText.className = 'feedback correct';
            score += 10;
            scoreValue.textContent = score;
        } else {
            feedbackText.textContent = `Knapp daneben. Richtig wäre ca. ${currentAnswer.toFixed(2)}.`;
            feedbackText.className = 'feedback incorrect';
        }

        answerInput.disabled = true;
        submitAnswerBtn.disabled = true;
        nextQuestionBtn.style.display = 'inline-block';
    }

    if (submitAnswerBtn) {
        submitAnswerBtn.addEventListener('click', checkAnswer);
        nextQuestionBtn.addEventListener('click', generateQuestion);
        answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkAnswer();
        });
        // Start first question
        generateQuestion();
    }


    // --- Bottle Animation Logic ---
    const tiltSlider = document.getElementById('tiltSlider');
    const tiltValue = document.getElementById('tiltValue');
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

        tiltValue.textContent = tiltDeg;

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
        updateBottleAnimation();
    }

    // --- Sine Area Logic ---
    const sideASlider = document.getElementById('sideASlider');
    const sideBSlider = document.getElementById('sideBSlider');
    const gammaSlider = document.getElementById('gammaSlider');
    const sideAValue = document.getElementById('sideAValue');
    const sideBValue = document.getElementById('sideBValue');
    const gammaValue = document.getElementById('gammaValue');
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

        sideAValue.textContent = a;
        sideBValue.textContent = b;
        gammaValue.textContent = gDeg;

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
        updateSineAreaAnimation();
    }

    // Initialization
    drawStaticGraphs();
    angleSlider.addEventListener('input', updateTrigonometry);
    updateTrigonometry(); // call once to set initial state
});
