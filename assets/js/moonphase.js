/**
 * Lunar phase calculations for the watch-style header complication.
 *
 * The phase is derived from the difference between the Moon's and Sun's
 * ecliptic longitudes. This avoids the drift introduced by advancing a fixed
 * average synodic month from one reference new moon.
 */
(function(root, factory) {
    var api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else {
        root.CPJMoonphase = api;
    }
})(typeof window !== 'undefined' ? window : this, function() {
    'use strict';

    var RAD = Math.PI / 180;
    var DAY_MS = 86400000;
    var JULIAN_UNIX_EPOCH = 2440588;
    var JULIAN_J2000 = 2451545;

    function normalizeTurns(turns) {
        return turns - Math.floor(turns);
    }

    function daysSinceJ2000(date) {
        return (date.valueOf() / DAY_MS - 0.5 + JULIAN_UNIX_EPOCH) - JULIAN_J2000;
    }

    function sunEclipticLongitude(days) {
        var meanAnomaly = RAD * (357.5291 + 0.98560028 * days);
        var equationOfCenter = RAD * (
            1.9148 * Math.sin(meanAnomaly) +
            0.02 * Math.sin(2 * meanAnomaly) +
            0.0003 * Math.sin(3 * meanAnomaly)
        );

        return meanAnomaly + equationOfCenter + RAD * 102.9372 + Math.PI;
    }

    function moonEclipticLongitude(days) {
        var meanLongitude = RAD * (218.316 + 13.176396 * days);
        var meanAnomaly = RAD * (134.963 + 13.064993 * days);

        return meanLongitude + RAD * 6.289 * Math.sin(meanAnomaly);
    }

    /**
     * Return a normalized lunar phase:
     * 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter.
     */
    function getLunarPhase(date) {
        if (!(date instanceof Date) || !Number.isFinite(date.valueOf())) return NaN;

        var days = daysSinceJ2000(date);
        var elongation = moonEclipticLongitude(days) - sunEclipticLongitude(days);
        return normalizeTurns(elongation / (2 * Math.PI));
    }

    function getIllumination(phase) {
        if (!Number.isFinite(phase)) return NaN;
        return (1 - Math.cos(2 * Math.PI * normalizeTurns(phase))) / 2;
    }

    /**
     * The existing disc contains two moons opposite one another. It therefore
     * advances 180 degrees—not 360—during one lunar cycle. At 90 degrees both
     * moons are hidden by the mask (new moon); at 180 degrees one is centered
     * in the aperture (full moon).
     */
    function getDiscRotation(phase) {
        if (!Number.isFinite(phase)) return NaN;
        return 90 + normalizeTurns(phase) * 180;
    }

    function getPhaseName(phase) {
        phase = normalizeTurns(phase);
        if (phase < 0.03 || phase > 0.97) return 'New Moon';
        if (phase < 0.22) return 'Waxing Crescent';
        if (phase < 0.28) return 'First Quarter';
        if (phase < 0.47) return 'Waxing Gibbous';
        if (phase < 0.53) return 'Full Moon';
        if (phase < 0.72) return 'Waning Gibbous';
        if (phase < 0.78) return 'Last Quarter';
        return 'Waning Crescent';
    }

    return {
        getLunarPhase: getLunarPhase,
        getIllumination: getIllumination,
        getDiscRotation: getDiscRotation,
        getPhaseName: getPhaseName
    };
});
