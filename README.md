# binary-comparator

Compares two binary files and tells some info on where they differ

## installation

`npm i -g binary-comparator`

## usage

`bin-compare --version`

`bin-compare <file1> <file2>`

`bin-compare <file1> <file2> --hex`

`bin-compare <file1> <file2> --hex --skip=4`

## output in the console

### when two files differ

![example on the output when two files do not match](./docs/output.png)

### when two files differ and --hex is set

![example on the output with the hex flag](./docs/output-hex.png)
