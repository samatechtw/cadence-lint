import chalk from 'chalk'
import fg from 'fast-glob'
import path from 'path'
import yargs from 'yargs'
import { CadenceLinter } from './cadence-linter'

interface CadenceLinterCliArguments {
  s: boolean
  c: string
  p: string
  h: boolean
  v: boolean
}

export class CadenceLinterCli {
  async run() {
    const argv = yargs(process.argv.slice(2)).options({
      s: {
        type: 'boolean',
        default: false,
        alias: 'strict',
        description: 'Fail on warnings',
      },
      c: {
        type: 'string',
        default: './**/*.cdc',
        alias: 'contracts',
        description: 'Contracts glob. Defaults to "./**/*.cdc". Uses fast-glob.',
      },
      p: {
        type: 'string',
        default: path.resolve('flow.json'),
        alias: 'configPath',
        description: 'Path to flow.json. Defaults to current directory',
      },
      h: { type: 'boolean', default: false },
      v: { type: 'boolean', default: false },
    }).argv as CadenceLinterCliArguments

    const contractsGlob = argv.c
    const configPath = argv.p
    const strict = argv.s
    try {
      const contracts = await fg(contractsGlob)
      const linter = new CadenceLinter({
        strict,
        configPath,
      })
      await linter.init()
      await linter.fileDiagnostics(contracts)
      const success = linter.logResult()
      linter.close(success)
    } catch (e: any) {
      if (typeof e === 'string' || e.message) {
        console.log(chalk.red(e.message || e))
      } else {
        console.error(chalk.red('Unknown error:', e))
      }
      process.exit(1)
    }
  }
}
