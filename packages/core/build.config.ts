import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['./src/index'],
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: true,
    output: {
      preserveModules: true,
      preserveModulesRoot: './src',
    },
  },
})
