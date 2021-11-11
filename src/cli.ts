import chalk from 'chalk'
import fg from 'fast-glob'
import path from 'path'
import yargs from 'yargs'
import { CadenceLinter, logLinterResult } from './cadence-linter'
import pkg from '../package.json'

interface CadenceLinterCliArguments {
  s: boolean
  f: string
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
        f: {
          type: 'string',
          default: './**/*.cdc',
          alias: 'files',
          description:
            'Defaults to "./**/*.cdc". Comma separated globs are parse separately. Uses fast-glob.',
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

    const fileGlobs = argv.f
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
      // TODO -- this is a hack for working around an issue where imports fail.
      // Maybe we need to communicate the root directory to the language server?
      // Multiple linters/language servers is probably fine, but a little slow
      let warningCount = 0
      let errorCount = 0
      for (const fileGlob of fileGlobs.split(',')) {
        const linter = new CadenceLinter({
          strict,
          configPath,
        })
        await linter.init()
        console.log('Running diagnostics on', fileGlob)
        const files = await fg(fileGlob)
        await linter.fileDiagnostics(files)
        linter.close()
        warningCount += linter.warningCount
        errorCount += linter.errorCount
      }
      logLinterResult(warningCount, errorCount, strict)
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
