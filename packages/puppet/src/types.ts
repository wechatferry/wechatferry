import type { Storage, StorageValue } from 'unstorage'
import type {
  Contact,
  Room,
  RoomMember,
} from 'wechaty-puppet/payloads'
import type { WechatferryAgent } from '@wechatferry/agent'

export interface PuppetRoom extends Room {
  announce: string
  members: RoomMember[]
}

export interface PuppetContact extends Contact {
  tags: string[]
}

export interface PuppetWcferryUserOptions {
  agent?: WechatferryAgent
  storage?: Storage
}

export interface PuppetWcferryOptions extends Required<PuppetWcferryUserOptions> { }

export interface PrefixStorage<T extends StorageValue> extends Storage<T> {
  getItemsMap: (base?: string) => Promise<{
    key: string
    value: T
  }[]>
  getItemsList: (base?: string) => Promise<T[]>
}
