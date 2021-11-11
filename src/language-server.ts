import { ChildProcess, spawn } from 'child_process'

export interface LanguageServerArgs {
  configPath?: string
  output?: 'text' | 'json' | 'inline'
}

export async function runLanguageServer(
  args: LanguageServerArgs,
): Promise<ChildProcess | undefined> {
  const argList = ['cadence', 'language-server']
  if (args.configPath) {
    argList.push('--config-path', args.configPath)
  }
  const output = args.output ?? 'json'
  argList.push('--output', output)
  console.info(`Running: ${argList.join(' ')}`)

  const child = spawn('flow', argList)
  return new Promise((resolve, reject) => {
    child.on('error', (e: any) => {
      if (e.code === 'ENOENT') {
        reject(new Error('Flow CLI must be installed'))
      }
      reject(new Error('Unknown error starting the cadence language server'))
    })
    child.on('spawn', () => {
      resolve(child)
    })
  })
}
