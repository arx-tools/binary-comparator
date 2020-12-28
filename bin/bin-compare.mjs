#!/usr/bin/env node --experimental-modules

import fs from 'fs'
import minimist from 'minimist'
import { fileExists, getPackageVersion } from './helpers.mjs'
import binCompare, { miniDump } from '../src/index.mjs'
import { clamp } from '../node_modules/ramda/src/index.mjs'
import { EOL } from 'os'

const toHex = (n, padSize = 0, raw = false) => {
  return typeof n === 'number' ? ((raw ? '' : '0x') + n.toString(16).padStart(padSize, '0')) : n
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

  if (hasErrors) {
    process.exit(1)
  }

  const skip = clamp(0, Infinity, args.skip || 0)

  const file1 = await fs.promises.readFile(filename1)
  const file2 = await fs.promises.readFile(filename2)

  const toHexIfNeeded = (...params) => {
    return args.hex ? toHex(...params) : params[0]
  }

  const { size, deviation } = binCompare(file1, file2, skip)

  console.log(EOL + 'length:')
  if (size.equals) {
    console.log(`  the two files match, both are ${toHexIfNeeded(file1.length)} bytes`)
  } else {
    const { sign, diff } = size
    console.log(`  the two files differ: ${toHexIfNeeded(file1.length)} bytes <> ${toHexIfNeeded(file2.length)} bytes (${sign}${toHexIfNeeded(diff)})`)
  }

  console.log(EOL + 'deviance:')
  if (deviation.equals) {
    console.log('  the two files match')
  } else {
    const { firstDeviationIdx, char1, char2 } = deviation
    console.log(`  the two files differ at ${toHexIfNeeded(firstDeviationIdx)}: ${toHexIfNeeded(char1, 2)} <> ${toHexIfNeeded(char2, 2)}`)

    miniDump(firstDeviationIdx, file1, file2)
  }
})()
