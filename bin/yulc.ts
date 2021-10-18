#!/usr/bin/env node

import { ArgumentParser } from 'argparse'
import child_process from 'child_process'
import fsPromises from 'fs/promises'
import path from 'path'

// https://docs.soliditylang.org/en/v0.8.6/yul.html#stand-alone-usage
const solcIn: any = {
  language: 'Yul',
  //sources: { 'input.yul': { content: '{ sstore(0, 1) }' } },
  settings: {
    /* outputSelection: { FILENAME: { CONTRACT_NAME: [ ... ] } } */
    outputSelection: { '*': { '*': ['metadata', 'evm.bytecode'] /*'': ['*'] */ } },
    optimizer: { enabled: true, details: { yul: true } },
  },
}

const processSolcJsonErrors = async (data: any): Promise<boolean> => {
  let hasErrors = false
  for (const e of data['errors']) {
    if (e['severity'] === 'error') {
      hasErrors = true
    }
    console.error(e.formattedMessage)
  }
  return hasErrors
}

const processSolcJsonOutput = async (data: any) => {
  /* hardhat output:
    "_format": "hh-sol-artifact-1",
    "contractName": "Buyer",
    "sourceName": "contracts/ShopAttack.sol",
    "abi": [ ... ],
    "bytecode": "...", "deployedBytecode": "...",
    "linkReferences": {}, "deployedLinkReferences": {},
  */
  const hasErrors = await processSolcJsonErrors(data)
  if (hasErrors) {
    return
  }

  for (let sourceName in data['contracts']) {
    if (path.isAbsolute(sourceName)) {
      sourceName = path.basename(sourceName)
    }
    for (const contractName in data['contracts'][sourceName]) {
      const c = data['contracts'][sourceName][contractName]
      const out = {
        sourceName: sourceName,
        contractName: contractName,
        bytecode: c['evm']['bytecode']['object'],
        linkReferences: c['evm']['bytecode']['linkReferences'],
        abi: [] /* make typechain happy */,
        deployedBytecode: undefined,
        deployedLinkReferences: undefined,
      }
      let d = c['evm']['deployedBytecode']
      if (d) {
        out['deployedBytecode'] = d['bytecode']
        out['deployedLinkReferences'] = d['linkReferences']
      }
      const outDir = path.join('artifacts', sourceName)
      await fsPromises.mkdir(outDir, { recursive: true })
      const outF = await fsPromises.open(path.join(outDir, contractName + '.json'), 'w')
      await outF.writeFile(JSON.stringify(out, null, 2))
    }
  }
}

const main = async (args0: Array<string>) => {
  const argsParser = new ArgumentParser()
  argsParser.add_argument('--output-dir', { type: String, default: 'artifacts' })
  argsParser.add_argument('input_file', { type: String })
  const args = argsParser.parse_args(args0)

  const inputF = await fsPromises.open(args['input_file'], 'r')
  const inputFileContent = await inputF.readFile({ encoding: 'utf-8' })

  const inputFilename = path.basename(args['input_file'])
  const inputJsonName = inputFilename + '.in.json'
  const inputJsonF = await fsPromises.open(inputJsonName, 'w+')
  solcIn['sources'] = {}
  solcIn['sources'][args['input_file']] = { content: inputFileContent }
  await inputJsonF.write(JSON.stringify(solcIn, null, 2))
  await inputJsonF.close()
  const outFilename = inputFilename + '.out.json'
  const outF = await fsPromises.open(outFilename, 'w+')

  child_process.execFileSync('solc', ['--standard-json', inputJsonName], { stdio: ['ignore', outF.fd, 'inherit'] })

  const outFileR = await fsPromises.open(outFilename, 'r')
  await processSolcJsonOutput(JSON.parse(await outFileR.readFile({ encoding: 'utf-8' })))
}

main(process.argv.slice(2))
  //.then(() => setTimeout(() => process.exit(0), 1000))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
