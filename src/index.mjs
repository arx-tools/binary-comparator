export const findIndexOfFirstDeviation = (buffer1, buffer2) => {
  let idx = 0

  while (buffer1[idx] === buffer2[idx]) {
    idx++
  }

  return idx > Math.max(buffer1.length, buffer2.length) ? -1 : idx
}
