import chalk from 'chalk'
import fg from 'fast-glob'
import path from 'path'
import yargs from 'yargs'
import { CadenceLinter } from './cadence-linter'
import pkg from '../package.json'

interface CadenceLinterCliArguments {
  s: boolean
  c: string
  p: string
  h: boolean
  v: boolean
}

export class CadenceLinterCli {
  async run() {
    const argv = yargs(process.argv.slice(2))
      .version(false)
      .usage('\n$0 <options>')
      .options({
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
        h: { type: 'boolean', alias: 'help', default: false },
        v: { type: 'boolean', alias: 'version', default: false },
      }).argv as CadenceLinterCliArguments

    const contractsGlob = argv.c
    const configPath = argv.p
    const strict = argv.s

    if (argv.h) {
      yargs.showHelp()
      process.exit(0)
    }
    if (argv.v) {
      console.log(`${pkg.name} ${pkg.version}\n`)
      process.exit(0)
    }
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
