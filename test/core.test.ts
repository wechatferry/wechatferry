import { beforeAll, expect, it } from 'vitest'
import { Wechatferry } from '../packages/core/src'

const wcf = new Wechatferry()

beforeAll(() => {
  wcf.start()
})

it('isLogin', () => {
  const isLogin = wcf.isLogin()
  expect(isLogin).toBeTypeOf('boolean')
})
