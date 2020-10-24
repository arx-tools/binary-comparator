#!/usr/bin/env node --experimental-modules

import fs from 'fs'
import { EOL } from 'os'
import minimist from 'minimist'
import { fileExists, getPackageVersion } from './helpers.mjs'
import { toHex } from '../src/helpers.mjs'
import { findIndexOfFirstDeviation } from '../src/index.mjs'
import { when, has, clamp, repeat } from '../node_modules/ramda/src/index.mjs'

const args = minimist(process.argv.slice(2), {
  number: ['skip'],
  boolean: ['hex', 'version']
});

(async () => {
  if (args.version) {
    console.log(await getPackageVersion())
    process.exit(0)
  }

  let filename1 = args._[0]
  let filename2 = args._[1]

  let hasErrors = false

  if (filename1) {
    if (!await fileExists(filename1)) {
      console.error('error: first filename does not exist')
      hasErrors = true
    }
  } else {
    console.error('error: first filename parameter missing')
    hasErrors = true
  }

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
      if (has(firstDeviationIdx + i, file1)) {
        bytes1.push(file1[firstDeviationIdx + i])
      }
      if (has(firstDeviationIdx + i, file2)) {
        bytes2.push(file2[firstDeviationIdx + i])
      }
    }
    bytes1 = Buffer.from(bytes1).toString('hex')
    if (bytes1.length > 2) {
      bytes1 = bytes1.match(/../g).join(' ')
    }
    bytes2 = Buffer.from(bytes2).toString('hex')
    if (bytes2.length > 2) {
      bytes2 = bytes2.match(/../g).join(' ')
    }
    const ellipsis1 = firstDeviationIdx >= 6 && has(firstDeviationIdx, file1) && file1.length >= firstDeviationIdx ? '..' : '  '
    const ellipsis2 = firstDeviationIdx >= 6 && has(firstDeviationIdx, file2) && file2.length >= firstDeviationIdx ? '..' : '  '
    const ellipsis3 = has(firstDeviationIdx, file1) && file1.length >= firstDeviationIdx + 7 ? '..' : '  '
    const ellipsis4 = has(firstDeviationIdx, file2) && file2.length >= firstDeviationIdx + 7 ? '..' : '  '
    console.log(`           ${repeat('   ', deviantByte1Idx + 1).join('')}vv`)
    console.log(`     left: ${ellipsis1} ${bytes1} ${ellipsis3} `)
    console.log(`    right: ${ellipsis2} ${bytes2} ${ellipsis4} `)
    console.log(`           ${repeat('   ', deviantByte2Idx + 1).join('')}^^`)
  }
})()
