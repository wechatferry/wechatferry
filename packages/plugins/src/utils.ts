import type {
  WechatyPlugin,
} from 'wechaty'

type WechatyPluginFactory<T> = (opts: T) => WechatyPlugin
export function defineWechatyPlugin<T = any>(factory: WechatyPluginFactory<T>): WechatyPluginFactory<T> {
  return factory
}
