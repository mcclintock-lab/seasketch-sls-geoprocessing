import area from './index.js';
import sketch from '../../examples/sketch.json';

test('Accurately calculates the area of a sketch', async () => {
  const result = await area(sketch);
  expect(Math.round(result.area)).toBe(10409407);
});
