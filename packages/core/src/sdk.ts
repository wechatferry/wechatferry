import { fileURLToPath } from 'node:url'
import EventEmitter from 'node:events'
import type { Buffer } from 'node:buffer'
import koffi from 'koffi'
import { dirname, join, resolve } from 'pathe'
import type { MessageRecvDisposable } from '@rustup/nng'
import { Socket } from '@rustup/nng'
import type { WechatferrySDKOptions, WechatferrySDKUserOptions } from './types'
import { logger } from './utils'
import { wcf } from './proto/wcf'

const _dirname = typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(import.meta.url))

export function resolvedWechatferrySDKOptions(options: WechatferrySDKUserOptions): WechatferrySDKOptions {
  return {
    debug: false,
    sdkRoot: resolve(_dirname, '../sdk'),
    port: 10086,
    host: '127.0.0.1',
    ...options,
  }
}

export interface WechatferrySDKEventMap {
  message: [wcf.WxMsg]
}

export class WechatferrySDK extends EventEmitter<WechatferrySDKEventMap> {
  lib: koffi.IKoffiLib
  options: WechatferrySDKOptions
  private messageRecvDisposable?: MessageRecvDisposable
  constructor(options: WechatferrySDKUserOptions = {}) {
    super()
    this.options = resolvedWechatferrySDKOptions(options)
    this.lib = koffi.load(join(this.options.sdkRoot, 'sdk.dll'))
  }

  private get WxInitSDK(): (debug: boolean, port: number) => number {
    return this.lib.func('WxInitSDK', 'int', ['bool', 'int'])
  }

  private get WxDestroySDK(): () => void {
    return this.lib.func('WxDestroySDK', 'void', [])
  }

  private get tcpBaseUrl() {
    return `tcp://${this.options.host}`
  }

  get cmdUrl() {
    return `${this.tcpBaseUrl}:${this.options.port}`
  }

  get msgUrl() {
    return `${this.tcpBaseUrl}:${this.options.port + 1}`
  }

  init(debug = this.options.debug, port = this.options.port): boolean {
    return this.WxInitSDK(debug, port) === 0
  }

  destroy(): void {
    this.stopRecvMessage()
    return this.WxDestroySDK()
  }

  get isReceiving() {
    return !!this.messageRecvDisposable
  }

  startRecvMessage() {
    this.messageRecvDisposable = Socket.recvMessage(this.msgUrl, undefined, (err: unknown | undefined, buf: Buffer) => {
      if (err) {
        return logger.error(err)
      }
      const rsp = wcf.Response.deserialize(buf)
      this.emit('message', rsp.wxmsg)
    })
  }

  stopRecvMessage() {
    this.messageRecvDisposable?.dispose()
    this.messageRecvDisposable = undefined
  }
}
