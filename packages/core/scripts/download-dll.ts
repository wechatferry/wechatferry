import * as url from 'node:url'
import { downloadRelease } from '@terascope/fetch-github-release'
import { resolve } from 'pathe'
import fse from 'fs-extra'
import { wcferry } from '../package.json'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export async function downloadDll(version = `v${wcferry.version}`) {
  const sdk = resolve(__dirname, `../sdk/${version}/sdk.dll`)
  if (fse.existsSync(sdk))
    return
  return downloadRelease('lich0821', 'WeChatFerry', resolve(__dirname, `../sdk/${version}`), undefined, r => r.name === `${version}.zip`)
}
