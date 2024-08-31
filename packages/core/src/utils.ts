import { tmpdir } from 'node:os'
import { Buffer } from 'node:buffer'
import { createConsola } from 'consola'
import type { FileBoxInterface } from 'file-box'
import { join } from 'pathe'

export const logger = createConsola({
  defaults: {
    tag: 'wechatferry',
  },
})

export async function saveFileBox(file: FileBoxInterface, dir = tmpdir()) {
  const filePath = join(dir, 'wechatferry', `${new Date().getTime()}-${file.name}`)
  await file.toFile(filePath)
  return filePath
}

export function parseDbField(type: number, content: Uint8Array) {
  // self._SQL_TYPES = {1: int, 2: float, 3: lambda x: x.decode("utf-8"), 4: bytes, 5: lambda x: None}
  switch (type) {
    case 1:
      return Number.parseInt(uint8Array2str(content), 10)
    case 2:
      return Number.parseFloat(uint8Array2str(content))
    case 3:
    case 4:
      return Buffer.from(content)
    case 5:
      return undefined
    default:
      return uint8Array2str(content)
  }
}

export function uint8Array2str(arr: Uint8Array) {
  return Buffer.from(arr).toString()
}
