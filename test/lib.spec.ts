import path from 'path'
import { lintMany } from '../src/cli'

const resolve = (p: string) => path.resolve(__dirname, p)

describe('Linter programmatic interface', () => {
  const configPath = resolve('../flow.json')

  afterEach(async () => {
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 1000)
    })
  })

  it('single contract', async () => {
    const { success, warningCount, hintCount, errorCount } = await lintMany({
      fileGlobs: [resolve('./test-app/contracts/FungibleToken.cdc')],
      configPath,
      failOnWarning: false,
      failOnHint: false,
    })
    expect(warningCount).toEqual(0)
    expect(errorCount).toEqual(0)
    expect(hintCount).toEqual(0)
    expect(success).toBe(true)
  })

  it('multiple contracts and transaction', async () => {
    const { success, warningCount, hintCount, errorCount } = await lintMany({
      fileGlobs: [resolve('./test-app/**/*.cdc')],
      configPath,
      failOnWarning: false,
      failOnHint: false,
    })
    expect(warningCount).toEqual(0)
    expect(errorCount).toEqual(0)
    expect(hintCount).toEqual(1)
    expect(success).toBe(true)
  })

  it('fails due to a hint', async () => {
    const { success, errorCount } = await lintMany({
      fileGlobs: [resolve('./test-app/**/*.cdc')],
      configPath,
      failOnWarning: false,
      failOnHint: true,
    })
    expect(errorCount).toEqual(0)
    expect(success).toBe(false)
  })
})
