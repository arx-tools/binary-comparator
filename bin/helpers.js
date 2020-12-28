const fs = require('fs')
const path = require('path')

const fileExists = async filename => {
  try {
    await fs.promises.access(filename, fs.constants.R_OK)
    return true
  } catch (error) {
    return false
  }
}

const getPackageVersion = () => {
  const { version } = require('../package.json')
  return version
}

module.exports = {
  fileExists,
  getPackageVersion
}
