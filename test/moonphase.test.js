const test = require('node:test');
const assert = require('node:assert/strict');
const moonphase = require('../assets/js/moonphase.js');

function phaseDistance(actual, expected) {
    const direct = Math.abs(actual - expected);
    return Math.min(direct, 1 - direct);
}

const august2026Phases = [
    ['new moon', '2026-08-12T17:37:00Z', 0],
    ['first quarter', '2026-08-20T02:46:00Z', 0.25],
    ['full moon', '2026-08-28T04:18:00Z', 0.5],
    ['last quarter', '2026-09-04T07:51:00Z', 0.75]
];

for (const [name, timestamp, expected] of august2026Phases) {
    test(`phase calculation matches the ${name}`, () => {
        const actual = moonphase.getLunarPhase(new Date(timestamp));
        assert.ok(phaseDistance(actual, expected) < 0.01, `${actual} was not close to ${expected}`);
    });
}

test('illumination follows the normalized phase', () => {
    assert.ok(Math.abs(moonphase.getIllumination(0) - 0) < 1e-12);
    assert.ok(Math.abs(moonphase.getIllumination(0.25) - 0.5) < 1e-12);
    assert.ok(Math.abs(moonphase.getIllumination(0.5) - 1) < 1e-12);
});

test('the two-moon disc advances 180 degrees per lunar cycle', () => {
    assert.equal(moonphase.getDiscRotation(0), 90);
    assert.equal(moonphase.getDiscRotation(0.25), 135);
    assert.equal(moonphase.getDiscRotation(0.5), 180);
    assert.equal(moonphase.getDiscRotation(0.75), 225);
});

test('August 15, 2026 is a waxing crescent near ten percent illumination', () => {
    const phase = moonphase.getLunarPhase(new Date('2026-08-15T12:35:00Z'));
    const illumination = moonphase.getIllumination(phase);

    assert.equal(moonphase.getPhaseName(phase), 'Waxing Crescent');
    assert.ok(illumination > 0.08 && illumination < 0.13, `${illumination} was outside the expected range`);
});
