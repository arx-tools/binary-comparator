import { has, repeat } from '../node_modules/ramda/src/index.mjs'

const findIndexOfFirstDeviation = (buffer1, buffer2, skip) => {
  let idx = 0
  let skipsLeft = skip

  while ((has(idx, buffer1) && has(idx, buffer2) && buffer1[idx] === buffer2[idx]) || skipsLeft-- > 0) {
    idx++
  }

  return idx >= Math.max(buffer1.length, buffer2.length) ? -1 : idx
}

const stringifyBytes = bytes => {
  let dump = Buffer.from(bytes).toString('hex')
  if (dump.length > 2) {
    dump = dump.match(/../g).join(' ')
  }
  return dump
}

const generateEllipsis = (firstDeviationIdx, file, bytes) => {
  const preEllipsis = firstDeviationIdx >= 6 && has(firstDeviationIdx, file) && file.length >= firstDeviationIdx ? '..' : '  '
  const postEllipsis = has(firstDeviationIdx, file) && file.length >= firstDeviationIdx + 7 ? '..' : '  '
  return `${preEllipsis} ${stringifyBytes(bytes)} ${postEllipsis}`
}

export const miniDump = (firstDeviationIdx, file1, file2) => {
  let bytes1 = []
  let bytes2 = []
  let deviantByte1Idx = 0
  let deviantByte2Idx = 0
  const minus = firstDeviationIdx > 5 ? -5 : -firstDeviationIdx

  for (let i = minus; i <= 5; i++) {
    if (i === 0) {
      deviantByte1Idx = bytes1.length
      deviantByte2Idx = bytes2.length
    }
    const idx = firstDeviationIdx + i
    if (has(idx, file1)) {
      bytes1.push(file1[idx])
    }
    if (has(idx, file2)) {
      bytes2.push(file2[idx])
    }
  }

  console.log(`           ${repeat('   ', deviantByte1Idx + 1).join('')}vv`)
  console.log(`     left: ${generateEllipsis(firstDeviationIdx, file1, bytes1)}`)
  console.log(`    right: ${generateEllipsis(firstDeviationIdx, file2, bytes2)}`)
  console.log(`           ${repeat('   ', deviantByte2Idx + 1).join('')}^^`)
}

export default (file1, file2, skip = 0) => {
  const result = {
    size: {
      equals: true
    },
    deviation: {
      equals: true
    }
  }

  if (file1.length === file2.length) {
    result.size.equals = true
  } else {
    result.size.equals = false
    result.size.sign = file2.length > file1.length ? '-' : '+'
    result.size.diff = Math.abs(file2.length - file1.length)
  }

  const firstDeviationIdx = findIndexOfFirstDeviation(file1, file2, skip)
  if (firstDeviationIdx === -1) {
    result.deviation.equals = true
  } else {
    result.deviation.equals = false
    result.deviation.char1 = has(firstDeviationIdx, file1) ? file1[firstDeviationIdx] : '?'
    result.deviation.char2 = has(firstDeviationIdx, file2) ? file2[firstDeviationIdx] : '?'
    result.deviation.firstDeviationIdx = firstDeviationIdx
  }

  return result
}

