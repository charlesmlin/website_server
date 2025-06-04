// Permuted Congruential Generator, that allows random number generation with jump-ahead ability
// It works by calculating x(n + 1) = (x(n) * A + C) % M, followed by shifting
import stringHash from "string-hash";

// Number used in Mult and Inc are popular and are from MMIX by Donald Knuth:
// https://en.wikipedia.org/wiki/Linear_congruential_generator#Parameters_in_common_use
const MULT = 6364136223846793005n;
const INC = 1442695040888963407n;
const MASK64 = (1n << 64n) - 1n;

// PCG32 output transform: state → 32-bit unsigned int
const pcg32Output = (state) => {
  const xorshifted = Number(((state >> 18n) ^ state) >> 27n) & 0xffffffff;
  const rot = Number(state >> 59n) & 31;
  return ((xorshifted >>> rot) | (xorshifted << (-rot & 31))) >>> 0;
};

// Jump-ahead math applied to seed
// Return a 32-bit unsigned int starting with 0
const getRandomNumber = (idString, n) => {
  let state = BigInt(stringHash(idString));
  let accMult = 1n;
  let accInc = 0n;
  let curMult = MULT;
  let curInc = INC;
  let delta = BigInt(n);

  while (delta > 0n) {
    if (delta & 1n) {
      accMult = (accMult * curMult) & MASK64;
      accInc = (accInc * curMult + curInc) & MASK64;
    }
    curInc = ((curMult + 1n) * curInc) & MASK64;
    curMult = (curMult * curMult) & MASK64;
    delta >>= 1n;
  }

  state = (accMult * state + accInc) & MASK64;
  return pcg32Output(state);
};

export default getRandomNumber;
