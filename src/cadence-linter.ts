import path from 'path'
import { readFileSync } from 'fs'
import { ChildProcess } from 'child_process'
import chalk from 'chalk'
import {
  StreamMessageReader,
  StreamMessageWriter,
  createProtocolConnection,
  InitializeRequest,
  InitializeParams,
  DidOpenTextDocumentNotification,
  DidOpenTextDocumentParams,
  Logger,
  PublishDiagnosticsNotification,
  TextDocumentItem,
  ProtocolConnection,
  RegistrationRequest,
} from 'vscode-languageserver-protocol/node'
import { DiagnosticSeverity } from 'vscode-languageserver-types'
import { runLanguageServer } from './language-server'

const noop = () => ({})

const defaultLogger = {
  log: noop,
  error: noop,
  warn: noop,
  info: noop,
  debug: noop,
}

export interface CadenceLinterOptions {
  logger?: Logger
  failOnWarning: boolean
  failOnHint: boolean
  configPath: string
}

export interface CadenceLinterResult {
  warningCount: number
  errorCount: number
  hintCount: number
  failOnWarning: boolean
  failOnHint: boolean
}

// Helper for multiple runner workaround
export function logLinterResult(result: CadenceLinterResult): boolean {
  const { warningCount, errorCount, hintCount, failOnWarning, failOnHint } = result
  console.log(
    `\nResult: ${errorCount} errors, ${warningCount} warnings, and ${hintCount} hints`,
  )
  let success = errorCount === 0
  if (failOnWarning) {
    success = success && warningCount === 0
  }
  if (failOnHint) {
    success = success && hintCount === 1
  }
  if (success) {
    console.log(chalk.green('SUCCESS\n'))
  } else {
    console.log(chalk.red('FAIL\n'))
  }
  return success
}

export class CadenceLinter {
  errorCount = 0
  warningCount = 0
  hintCount = 0
  server!: ChildProcess
  logger: Logger
  configPath: string
  failOnWarning: boolean
  failOnHint: boolean
  clientConnection!: ProtocolConnection

  constructor(options: CadenceLinterOptions) {
    this.logger = options.logger ?? defaultLogger
    this.configPath = options.configPath
    this.failOnWarning = options.failOnWarning
    this.failOnHint = options.failOnHint
  }

  async init() {
    const server = await runLanguageServer({
      configPath: this.configPath,
      output: 'json',
    })
    if (!server || !server.stdout || !server.stdin) {
      throw new Error('Failed to start language server')
    }
    this.server = server

    this.clientConnection = createProtocolConnection(
      new StreamMessageReader(server.stdout),
      new StreamMessageWriter(server.stdin),
      this.logger,
    )
    // serverConnection.listen()
    this.clientConnection.listen()

    this.clientConnection.onError((e) => {
      console.log(chalk.red('ERROR:'), e)
    })
    this.clientConnection.onUnhandledNotification((_e) => {
      // console.log('UNHANDLED', _e)
      // Currently unhandled: 'window/logMessage', 'cadence/checkCompleted'
    })

    this.clientConnection.onRequest(RegistrationRequest.type, (_params) => {
      console.log(chalk.green('Cadence Language Server Initialized\n'))
    })

    const init: InitializeParams = {
      rootUri: process.cwd(),
      workspaceFolders: [{ uri: process.cwd(), name: '' }],
      processId: 1,
      initializationOptions: {
        accessCheckMode: false,
        emulatorState: 0, // stopped
        activeAccountName: '',
        activeAccountAddress: '',
        // path to flow.json
        configPath: this.configPath,
      },
      capabilities: {
        textDocument: {
          moniker: {
            dynamicRegistration: false,
          },
          publishDiagnostics: {
            relatedInformation: true,
            versionSupport: true,
            codeDescriptionSupport: true,
            dataSupport: true,
          },
        },
      },
    }
    await this.clientConnection.sendRequest(InitializeRequest.type, init)
  }

  fileDiagnostics = async (contractPaths: string[]): Promise<void[]> => {
    return Promise.all(
      contractPaths.map(async (contractPath: string) => {
        const text = readFileSync(contractPath, 'utf-8')
        await this.checkFile({
          uri: path.resolve(contractPath),
          languageId: 'cadence',
          version: 1,
          text,
        })
      }),
    )
  }

  checkFile = async (doc: TextDocumentItem) => {
    const severityMessage = (severity?: DiagnosticSeverity): string => {
      switch (severity) {
        case DiagnosticSeverity.Error:
          this.errorCount += 1
          return chalk.red('error:')
        case DiagnosticSeverity.Warning:
          this.warningCount += 1
          return chalk.yellow('warning:')
        case DiagnosticSeverity.Hint:
          this.hintCount += 1
        case DiagnosticSeverity.Information:
        default:
          return chalk.grey('')
      }
    }

    this.clientConnection.onNotification(
      PublishDiagnosticsNotification.type,
      (params) => {
        const fileName = path.basename(params.uri)
        console.log(chalk.grey.underline(fileName))

        if (params.diagnostics.length === 0) {
          console.log(chalk.blue('  ✓ ok'))
        }
        for (const issue of params.diagnostics) {
          const { severity, range, message } = issue
          let rangeText = ' '
          if (range?.start) {
            rangeText = chalk.grey(`  ${range.start.line}:${range.start.character}`)
          }
          console.log(`${rangeText} ${severityMessage(severity)} ${message}`)
        }
      },
    )

    const params: DidOpenTextDocumentParams = {
      textDocument: doc,
    }
    await this.clientConnection.sendRequest(
      DidOpenTextDocumentNotification.method,
      params,
    )
  }

  logResult(): boolean {
    return logLinterResult({
      warningCount: this.warningCount,
      errorCount: this.errorCount,
      hintCount: this.hintCount,
      failOnWarning: this.failOnWarning,
      failOnHint: this.failOnHint,
    })
  }

  async close() {
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        this.clientConnection.onClose(() => {
          this.server.kill()
          resolve()
        })
        this.clientConnection.end()
      }, 500)
    })
  }
}
