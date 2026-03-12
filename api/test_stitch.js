const turf = require('@turf/turf');
const fs = require('fs');

async function testSegmentStitching() {
    // 1. Read the raw geojson
    const rawData = fs.readFileSync('C:\\Study\\train-booking\\giaothong.geojson', 'utf8');
    const geojson = JSON.parse(rawData);

    // 2. Filter for Hai Phong route
    const segments = geojson.features.filter(f => {
        const name = f.properties?.ten || '';
        return name.includes('Hồ Chí Minh');
    });

    console.log(`Found ${segments.length} segments for HCM route.`);

    // Flatten MultiLineStrings and LineStrings
    let allSegments = [];
    for (const s of segments) {
        if (s.geometry.type === 'LineString') {
            allSegments.push(s.geometry.coordinates);
        } else if (s.geometry.type === 'MultiLineString') {
            allSegments.push(...s.geometry.coordinates);
        }
    }

    let mergedSegments = [...allSegments];
    const THRESHOLD = 1.0;

    let mergedAny;
    do {
        mergedAny = false;

        outer: for (let i = 0; i < mergedSegments.length; i++) {
            for (let j = i + 1; j < mergedSegments.length; j++) {
                const seg1 = mergedSegments[i];
                const seg2 = mergedSegments[j];

                if (!Array.isArray(seg1) || !Array.isArray(seg2) || seg1.length === 0 || seg2.length === 0) continue;
                if (!Array.isArray(seg1[0]) || !Array.isArray(seg2[0]) || isNaN(seg1[0][0]) || isNaN(seg2[0][0])) continue;

                const start1 = turf.point(seg1[0]);
                const end1 = turf.point(seg1[seg1.length - 1]);
                const start2 = turf.point(seg2[0]);
                const end2 = turf.point(seg2[seg2.length - 1]);

                if (turf.distance(end1, start2) < THRESHOLD) {
                    seg1.push(...seg2.slice(1));
                    mergedSegments.splice(j, 1);
                    mergedAny = true; break outer;
                } else if (turf.distance(end1, end2) < THRESHOLD) {
                    seg1.push(...[...seg2].reverse().slice(1));
                    mergedSegments.splice(j, 1);
                    mergedAny = true; break outer;
                } else if (turf.distance(start1, end2) < THRESHOLD) {
                    mergedSegments[i] = seg2.slice(0, -1).concat(seg1);
                    mergedSegments.splice(j, 1);
                    mergedAny = true; break outer;
                } else if (turf.distance(start1, start2) < THRESHOLD) {
                    mergedSegments[i] = [...seg2].reverse().slice(0, -1).concat(seg1);
                    mergedSegments.splice(j, 1);
                    mergedAny = true; break outer;
                }
            }
        }
    } while (mergedAny && mergedSegments.length > 1);

    // After all merges, pick the longest remaining segment as our primary route path
    mergedSegments.sort((a, b) => b.length - a.length);
    const orderedCoords = mergedSegments[0];

    console.log(`Successfully stitched into ${mergedSegments.length} fragments.`);
    console.log(`Primary path has ${orderedCoords.length} points.`);
    console.log(`Remaining unattached segments: ${mergedSegments.length - 1}`);

    fs.writeFileSync('C:\\Study\\train-booking\\api\\test_stitched.json', JSON.stringify(orderedCoords));
    console.log("Saved stitched coordinates to test_stitched.json");
}

testSegmentStitching().catch(console.error);
