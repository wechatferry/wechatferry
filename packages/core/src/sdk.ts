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

export interface WechatferrySDKImpl extends EventEmitter<WechatferrySDKEventMap> {
  init: (debug?: boolean, port?: number) => boolean
  destroy: () => void
  startRecvMessage: () => void
  stopRecvMessage: () => void
  get isReceiving(): boolean
  get cmdUrl(): string
  get msgUrl(): string
}

export class WechatferrySDK extends EventEmitter<WechatferrySDKEventMap> implements WechatferrySDKImpl {
  private lib: koffi.IKoffiLib
  private options: WechatferrySDKOptions
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

  /** 用于发送指令的地址 */
  get cmdUrl() {
    return `${this.tcpBaseUrl}:${this.options.port}`
  }

  /** 用于接收消息的地址 */
  get msgUrl() {
    return `${this.tcpBaseUrl}:${this.options.port + 1}`
  }

  /**
   * 初始化 sdk
   * @param debug 是否开启调试
   * @param port 启动的端口
   */
  init(debug = this.options.debug, port = this.options.port): boolean {
    return this.WxInitSDK(debug, port) === 0
  }

  /**
   * 销毁 sdk
   */
  destroy(): void {
    this.stopRecvMessage()
    return this.WxDestroySDK()
  }

  get isReceiving() {
    return !!this.messageRecvDisposable
  }

  /**
   * 启用消息接收
   */
  startRecvMessage() {
    this.messageRecvDisposable = Socket.recvMessage(this.msgUrl, undefined, (err: unknown | undefined, buf: Buffer) => {
      if (err) {
        return logger.error(err)
      }
      const rsp = wcf.Response.deserialize(buf)
      this.emit('message', rsp.wxmsg)
    })
  }

  /**
   * 停止接收消息
   */
  stopRecvMessage() {
    this.messageRecvDisposable?.dispose()
    this.messageRecvDisposable = undefined
  }
}
