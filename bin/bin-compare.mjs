#!/usr/bin/env node --experimental-modules

import fs from 'fs'
import { EOL } from 'os'
import minimist from 'minimist'
import { fileExists, getPackageVersion } from './helpers.mjs'
import { toHex } from '../src/helpers.mjs'
import { findIndexOfFirstDeviation } from '../src/index.mjs'
import { when, has, clamp } from '../node_modules/ramda/src/index.mjs'

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
    console.log(`  the two files differ: ${toHexIfNeeded(file1.length)} bytes <> ${toHexIfNeeded(file2.length)} bytes`)
  }

  console.log(EOL + 'deviance:')

  const firstDeviationIdx = findIndexOfFirstDeviation(file1, file2, skip)
  if (firstDeviationIdx === -1) {
    console.log('  the two files match')
  } else {
    const char1 = has(firstDeviationIdx, file1) ? toHexIfNeeded(file1[firstDeviationIdx]) : 'undefined'
    const char2 = has(firstDeviationIdx, file2) ? toHexIfNeeded(file2[firstDeviationIdx]) : 'undefined'
    console.log(`  the two files differ at ${toHexIfNeeded(firstDeviationIdx)}: ${char1} <> ${char2}`)
  }
})()
