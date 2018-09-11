import getTin from './index.js';
import sketch from '../../examples/sketch.json';

test('getTin creates a geojson FeatureCollection', async () => {
  const output = getTin(sketch);
  expect(output.results.type).toBe('FeatureCollection');
});
