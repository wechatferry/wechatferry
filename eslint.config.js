import antfu from '@antfu/eslint-config'

export default antfu({}, {
  ignores: [
    '**/packages/core/src/proto/**',
  ],
})
