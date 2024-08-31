import * as url from 'node:url'
import { downloadRelease } from '@terascope/fetch-github-release'
import { resolve } from 'pathe'
import fse from 'fs-extra'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export async function getDll(version = 'v39.2.4') {
  const sdk = resolve(__dirname, '../sdk/sdk.dll')
  if (fse.existsSync(sdk))
    return
  return downloadRelease('lich0821', 'WeChatFerry', resolve(__dirname, '../sdk'), undefined, r => r.name === `${version}.zip`)
}
