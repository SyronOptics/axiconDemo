// Axicon Bessel Beam Visualizer
const svg = d3.select('#axicon-viz');
const width = +svg.attr('width');
const height = +svg.attr('height');

// Add preview SVG
const previewSvg = d3.select('#bessel-preview-viz');
const previewWidth = +previewSvg.attr('width');
const previewHeight = +previewSvg.attr('height');

// Layout constants
const margin = { left: 60, right: 60, top: 40, bottom: 40 };
const axiconX = width / 2;
const axiconY = height / 2;
const axiconHeight = 180;
const axiconBase = 40;
const axiconThickness = 24;
const inputBeamX = margin.left;
const outputScreenX = width - margin.right;
const numRays = 9;
const outputDistance = 220; // px from axicon to output screen

// Initial apex angle (degrees)
let apexAngle = 170;

function deg2rad(deg) { return deg * Math.PI / 180; }

function draw() {
    svg.selectAll('*').remove();

    // --- Static Geometry Calculation ---
    // Use a fixed angle for a stable ray-tracing layout, as requested.
    const fixedApexForGeometry = 172; 
    const staticConeAngle = (180 - fixedApexForGeometry) / 2;
    const staticAlpha = deg2rad(staticConeAngle);
    const n = 1.5;
    const staticBeta = Math.asin(n * Math.sin(staticAlpha)) - staticAlpha;

    // --- Dynamic Axicon Shape Calculation ---
    // The visual shape of the axicon WILL change with the slider.
    const dynamicConeAngle = (180 - apexAngle) / 2;

    // Layout constants
    const raySpacing = axiconHeight / (numRays - 1);
    const axiconTipX = axiconX + axiconThickness / 2; // Tip of the cone
    const axiconTop = axiconY - axiconHeight / 2;
    const axiconBottom = axiconY + axiconHeight / 2;

    // Calculate the focus distance based on the STATIC angle
    const h_max = axiconHeight / 2;
    const focusDist = h_max / Math.tan(Math.abs(staticBeta));
    const focusX = axiconX + axiconThickness / 2 + focusDist;

    // Bessel zone & Stop Position
    const besselZoneLength = 120; // px
    const besselZoneEndX = focusX + besselZoneLength;
    const stopX = besselZoneEndX + 40; // Position the stop after the Bessel Zone

    // Calculate scale factor to fit everything
    const maxX = stopX + 20;
    const minX = margin.left;
    const availableWidth = width - margin.right;
    const scale = (availableWidth - minX) / (maxX - minX);

    function sx(x) {
        return minX + (x - minX) * scale;
    }

    // Draw input rays
    for (let i = 0; i < numRays; i++) {
        const y = axiconY - axiconHeight / 2 + i * raySpacing;
        svg.append('line')
            .attr('x1', sx(inputBeamX))
            .attr('y1', y)
            .attr('x2', sx(axiconX - axiconThickness / 2))
            .attr('y2', y)
            .attr('stroke', '#ff851b')
            .attr('stroke-width', 1.5);
    }

    // Draw axicon - its shape is DYNAMIC, but its size (height) is CONSTANT.
    const axiconBackX = axiconX - 12; // A fixed position for the back of the visual axicon
    const dynamicConeWidth = h_max * Math.tan(deg2rad(dynamicConeAngle));
    const dynamicTipX = axiconBackX + dynamicConeWidth;
    
    svg.append('polygon')
        .attr('points', [
            [sx(axiconBackX), axiconTop],
            [sx(dynamicTipX), axiconY],
            [sx(axiconBackX), axiconBottom]
        ].map(p => p.join(',')).join(' '))
        .attr('fill', '#4fa3f7')
        .attr('fill-opacity', 0.5)
        .attr('stroke', '#2176bd')
        .attr('stroke-width', 2);

    // Draw output rays (based on STATIC geometry) - DRAWN LAST TO BE ON TOP
    for (let i = 0; i < numRays; i++) {
        const y = axiconY - axiconHeight / 2 + i * raySpacing;
        const x0 = axiconX + axiconThickness / 2;
        const y0 = y;
        
        if (Math.abs(y - axiconY) < 1e-6) { // Central ray
            svg.append('line')
                .attr('x1', sx(x0))
                .attr('y1', y0)
                .attr('x2', sx(stopX))
                .attr('y2', y0)
                .attr('stroke', '#ff4136')
                .attr('stroke-width', 1.5);
        } else { // Other rays
            // Ray to focus
            svg.append('line')
                .attr('x1', sx(x0))
                .attr('y1', y0)
                .attr('x2', sx(focusX))
                .attr('y2', axiconY)
                .attr('stroke', '#ff4136')
                .attr('stroke-width', 1.5);
            // Ray from focus to stop (dashed)
            const theta = Math.atan2(axiconY - y0, focusX - x0);
            const x2 = stopX;
            const y2 = axiconY + Math.tan(theta) * (stopX - focusX);
            svg.append('line')
                .attr('x1', sx(focusX))
                .attr('y1', axiconY)
                .attr('x2', sx(x2))
                .attr('y2', y2)
                .attr('stroke', '#ff4136')
                .attr('stroke-width', 1.5)
                .attr('stroke-dasharray', '4,3');
        }
    }

    // Draw Stop and label it "Screen"
    svg.append('line')
        .attr('x1', sx(stopX))
        .attr('y1', axiconY - h_max * 1.2)
        .attr('x2', sx(stopX))
        .attr('y2', axiconY + h_max * 1.2)
        .attr('stroke', '#ff4136')
        .attr('stroke-width', 5);
    svg.append('text')
        .attr('x', sx(stopX))
        .attr('y', axiconY - h_max * 1.2 - 10) // Positioned above the line
        .attr('font-size', 14)
        .attr('fill', '#444')
        .attr('text-anchor', 'middle')
        .text('Screen');

    // Labels... (Input Beam above, Axicon below)
    svg.append('text')
        .attr('x', sx(inputBeamX))
        .attr('y', axiconY - h_max - 28)
        .attr('font-size', 14)
        .attr('fill', '#444')
        .text('Input Beam');
    svg.append('text')
        .attr('x', sx(axiconX))
        .attr('y', axiconY + h_max + 35)
        .attr('font-size', 14)
        .attr('fill', '#444')
        .attr('text-anchor', 'middle')
        .text('Axicon');

    // Calculate beta for the preview based on the DYNAMIC angle
    const dynamicBeta = Math.asin(n * Math.sin(deg2rad(dynamicConeAngle))) - deg2rad(dynamicConeAngle);
    drawBesselPreview(dynamicBeta);
}

function drawBesselPreview(beta) {
    previewSvg.selectAll('*').remove();
    const centerX = previewWidth / 2;
    const centerY = previewHeight / 2;

    // Central spot
    previewSvg.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', 3)
        .attr('fill', '#ff4136');

    // Rings
    const numRings = 5;
    // The core radius of the Bessel beam is proportional to 1/sin(beta). We'll fake the spacing.
    const ringScale = 3 / Math.tan(Math.abs(beta));
    for (let i = 1; i <= numRings; i++) {
        previewSvg.append('circle')
            .attr('cx', centerX)
            .attr('cy', centerY)
            .attr('r', 10 + i * ringScale)
            .attr('stroke', '#ff4136')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('opacity', 0.8 - i * 0.15);
    }
}

draw();

d3.select('#apex-slider').on('input', function() {
    apexAngle = +this.value;
    d3.select('#apex-value').text(apexAngle);
    draw();
}); 