import { has } from '../node_modules/ramda/src/index.mjs'

export const findIndexOfFirstDeviation = (buffer1, buffer2) => {
  let idx = 0

  while (has(idx, buffer1) && has(idx, buffer2) && buffer1[idx] === buffer2[idx]) {
    idx++
  }

  return idx > Math.max(buffer1.length, buffer2.length) ? -1 : idx
}
