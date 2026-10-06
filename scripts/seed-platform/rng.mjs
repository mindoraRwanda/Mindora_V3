// Deterministic PRNG (mulberry32) so SEED=<n> npm run seed produces the
// exact same 10,000-user dataset every time — useful for reproducing a bug
// against a known dataset, or for CI. Not cryptographic; seed data has no
// need for that.
export function createRng(seed) {
  let state = seed >>> 0;

  function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    // [0, 1)
    float: next,
    // integer in [min, max], inclusive
    int(min, max) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    // true with the given probability (0-1)
    chance(probability) {
      return next() < probability;
    },
    // one random element of a non-empty array
    pick(arr) {
      return arr[Math.floor(next() * arr.length)];
    },
    // `count` distinct elements of arr, order preserved from arr
    pickMany(arr, count) {
      const indices = arr.map((_, i) => i);
      const chosen = [];
      for (let i = 0; i < count && indices.length > 0; i++) {
        const idx = Math.floor(next() * indices.length);
        chosen.push(indices[idx]);
        indices.splice(idx, 1);
      }
      return chosen.sort((a, b) => a - b).map((i) => arr[i]);
    },
    // pick one key from a { key: weight } map, weighted by value
    weighted(weightMap) {
      const entries = Object.entries(weightMap);
      const total = entries.reduce((sum, [, w]) => sum + w, 0);
      let roll = next() * total;
      for (const [key, weight] of entries) {
        roll -= weight;
        if (roll <= 0) return key;
      }
      return entries[entries.length - 1][0];
    },
  };
}
