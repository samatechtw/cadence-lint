import chalk from 'chalk'
import fg from 'fast-glob'
import path from 'path'
import yargs from 'yargs'
import { CadenceLinter, logLinterResult } from './cadence-linter'
import pkg from '../package.json'

interface CadenceLinterCliArguments {
  failOnWarning: boolean
  failOnHint: boolean
  f: string
  p: string
  h: boolean
  v: boolean
}

export interface CadenceLinterOptions {
  failOnWarning: boolean
  failOnHint: boolean
  fileGlobs: string[]
  configPath: string
}

export interface CadenceCliResult {
  warningCount: number
  errorCount: number
  hintCount: number
  success: boolean
}

export const lintMany = async (
  options: CadenceLinterOptions,
): Promise<CadenceCliResult> => {
  const { fileGlobs, failOnWarning, failOnHint, configPath } = options
  // TODO -- this is a hack for working around an issue where imports fail.
  // Maybe we need to communicate the root directory to the language server?
  // Multiple linters/language servers is probably fine, but a little slow
  let warningCount = 0
  let errorCount = 0
  let hintCount = 0
  for (const fileGlob of fileGlobs) {
    const linter = new CadenceLinter({
      failOnWarning,
      failOnHint,
      configPath,
    })
    await linter.init()
    console.log('Running diagnostics on', fileGlob)
    const files = await fg(fileGlob)
    await linter.fileDiagnostics(files)
    await linter.close()
    warningCount += linter.warningCount
    errorCount += linter.errorCount
    hintCount += linter.hintCount
  }
  const success = logLinterResult({
    warningCount,
    errorCount,
    hintCount,
    failOnWarning,
    failOnHint,
  })
  return {
    success,
    warningCount,
    errorCount,
    hintCount,
  }
}

export class CadenceLinterCli {
  async run() {
    const argv = yargs(process.argv.slice(2))
      .version(false)
      .usage('\n$0 <options>')
      .options({
        failOnWarning: {
          type: 'boolean',
          default: false,
          description: 'Fail on warnings',
        },
        failOnHint: {
          type: 'boolean',
          default: false,
          description: 'Fail on hints',
        },
        f: {
          type: 'string',
          default: './**/*.cdc',
          alias: 'files',
          description:
            'Defaults to "./**/*.cdc". Comma separated globs are parse separately. Uses fast-glob.',
        },
        p: {
          type: 'string',
          default: 'flow.json',
          alias: 'configPath',
          description: 'Path to flow.json. Defaults to current directory',
        },
        h: { type: 'boolean', alias: 'help', default: false },
        v: { type: 'boolean', alias: 'version', default: false },
      }).argv as CadenceLinterCliArguments

    const fileGlobs = argv.f
    const configPath = path.resolve(process.cwd(), argv.p)
    const failOnWarning = argv.failOnWarning
    const failOnHint = argv.failOnHint

    if (argv.h) {
      yargs.showHelp()
      process.exit(0)
    }
    if (argv.v) {
      console.log(`${pkg.name} ${pkg.version}\n`)
      process.exit(0)
    }
    try {
      await lintMany({
        fileGlobs: fileGlobs.split(','),
        configPath,
        failOnHint,
        failOnWarning,
      })
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
