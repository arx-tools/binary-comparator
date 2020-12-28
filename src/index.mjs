import { has, repeat } from '../node_modules/ramda/src/index.mjs'
import { EOL } from 'os'

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

  const lines = [
    `           ${repeat('   ', deviantByte1Idx + 1).join('')}vv`,
    `     left: ${generateEllipsis(firstDeviationIdx, file1, bytes1)}`,
    `    right: ${generateEllipsis(firstDeviationIdx, file2, bytes2)}`,
    `           ${repeat('   ', deviantByte2Idx + 1).join('')}^^`
  ]

  return lines.join(EOL)
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
    result.size.sign = file2.length > file1.length ? '+' : '-'
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

const toHex = (n, padSize = 0, raw = false) => {
  return typeof n === 'number' ? ((raw ? '' : '0x') + n.toString(16).padStart(padSize, '0')) : n
}

export const report = (file1, file2, { size, deviation }, displayAsHex = false) => {
  const toHexIfNeeded = (...params) => {
    return displayAsHex ? toHex(...params) : params[0]
  }

  const lines = []

  lines.push(EOL + 'size:')
  if (size.equals) {
    lines.push(`  the two files match, both are ${toHexIfNeeded(file1.length)} bytes`)
  } else {
    const { sign, diff } = size
    lines.push(`  the two files differ: ${toHexIfNeeded(file1.length)} bytes <> ${toHexIfNeeded(file2.length)} bytes (${sign}${toHexIfNeeded(diff)})`)
  }

  lines.push(EOL + 'deviance:')
  if (deviation.equals) {
    lines.push('  the two files match')
  } else {
    const { firstDeviationIdx, char1, char2 } = deviation
    lines.push(`  the two files differ at ${toHexIfNeeded(firstDeviationIdx)}: ${toHexIfNeeded(char1, 2)} <> ${toHexIfNeeded(char2, 2)}`)

    lines.push(miniDump(firstDeviationIdx, file1, file2))
  }

  return lines.join(EOL)
}
