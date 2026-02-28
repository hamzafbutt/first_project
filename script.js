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
                if (Math.abs(t) < 500) { // Scaled limit
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
        if (tanY < -5) tanY = -5;
        if (tanY > 5) tanY = 5;

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

    // Initialization
    drawStaticGraphs();
    angleSlider.addEventListener('input', updateTrigonometry);
    updateTrigonometry(); // call once to set initial state
});
