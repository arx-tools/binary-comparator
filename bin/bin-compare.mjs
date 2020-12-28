#!/usr/bin/env node --experimental-modules

import fs from 'fs'
import minimist from 'minimist'
import { fileExists, getPackageVersion } from './helpers.mjs'
import binCompare, { report } from '../src/index.mjs'
import { clamp } from '../node_modules/ramda/src/index.mjs'

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

  console.log(report(file1, file2, binCompare(file1, file2, skip), args.hex))
})()
