#!/usr/bin/env node --experimental-modules

import fs from 'fs'
import { EOL } from 'os'
import minimist from 'minimist'
import { fileExists, getPackageVersion } from './helpers.mjs'
import { toHex } from '../src/helpers.mjs'
import { findIndexOfFirstDeviation } from '../src/index.mjs'
import { when, has, clamp, repeat } from '../node_modules/ramda/src/index.mjs'

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

const miniDump = (firstDeviationIdx, file1, file2) => {
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

const args = minimist(process.argv.slice(2), {
  number: ['skip'],
  boolean: ['hex', 'version']
});

(async () => {
  if (args.version) {
    console.log(await getPackageVersion())
    process.exit(0)
  }

  let hasErrors = false

  let filename1 = args._[0]
  if (filename1) {
    if (!await fileExists(filename1)) {
      console.error('error: first filename does not exist')
      hasErrors = true
    }
  } else {
    console.error('error: first filename parameter missing')
    hasErrors = true
  }

  let filename2 = args._[1]
  if (filename2) {
    if (!await fileExists(filename2)) {
      console.error('error: second filename does not exist')
      hasErrors = true
    }
  } else {
    console.error('error: second filename parameter missing')
    hasErrors = true
  }

  const skip = clamp(0, Infinity, args.skip || 0)

  if (hasErrors) {
    process.exit(1)
  }

  const toHexIfNeeded = when(() => args.hex, toHex)

  const file1 = await fs.promises.readFile(filename1)
  const file2 = await fs.promises.readFile(filename2)

  console.log(EOL + 'length:')
  if (file1.length === file2.length) {
    console.log(`  the two files match, both are ${toHexIfNeeded(file1.length)} bytes`)
  } else {
    const sign = file2.length > file1.length ? '-' : '+'
    const diff = Math.abs(file2.length - file1.length)
    console.log(`  the two files differ: ${toHexIfNeeded(file1.length)} bytes <> ${toHexIfNeeded(file2.length)} bytes (${sign}${toHexIfNeeded(diff)})`)
  }

  console.log(EOL + 'deviance:')

  const firstDeviationIdx = findIndexOfFirstDeviation(file1, file2, skip)
  if (firstDeviationIdx === -1) {
    console.log('  the two files match')
  } else {
    const char1 = has(firstDeviationIdx, file1) ? toHexIfNeeded(file1[firstDeviationIdx]) : 'undefined'
    const char2 = has(firstDeviationIdx, file2) ? toHexIfNeeded(file2[firstDeviationIdx]) : 'undefined'
    console.log(`  the two files differ at ${toHexIfNeeded(firstDeviationIdx)}: ${char1} <> ${char2}`)

    miniDump(firstDeviationIdx, file1, file2)
  }
})()
