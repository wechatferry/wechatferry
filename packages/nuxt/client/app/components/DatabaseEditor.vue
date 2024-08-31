<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { languages } from 'monaco-editor/esm/vs/editor/editor.api'
import 'monaco-sql-languages/esm/languages/mysql/mysql.contribution'
import MySQLWorker from 'monaco-sql-languages/esm/languages/mysql/mysql.worker?worker'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

import type {
  CompletionService,
  ICompletionItem,
} from 'monaco-sql-languages'
import {
  EntityContextType,
  LanguageIdEnum,
  setupLanguageFeatures,
} from 'monaco-sql-languages'
import type { DatabaseListItem } from '~~/types/database'
import type { MonacoEditor } from '#components'

(globalThis as any).MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === LanguageIdEnum.MYSQL) {
      return new MySQLWorker()
    }
    return new EditorWorker()
  },
}

const { code, sql, execute } = useSql()
const { current } = useDatabase()
const editorRef = ref<InstanceType<typeof MonacoEditor>>()
const editor = computed(() => editorRef.value?.$editor)

const completionService: CompletionService = function (
  model,
  position,
  completionContext,
  suggestions,
  entities,
) {
  return new Promise((resolve) => {
    if (!suggestions) {
      return resolve([])
    }
    const { keywords, syntax } = suggestions
    const keywordsCompletionItems: ICompletionItem[] = keywords.map(kw => ({
      label: kw,
      kind: languages.CompletionItemKind.Keyword,
      detail: 'keyword',
      sortText: `2${kw}`,
    }))

    let syntaxCompletionItems: ICompletionItem[] = []

    syntax.forEach((item) => {
      if (item.syntaxContextType === EntityContextType.TABLE) {
        const tables = current.value?.items?.map(v => v.name) ?? []
        const tableCompletions: ICompletionItem[] = tables.map(t => ({
          label: t,
          kind: languages.CompletionItemKind.Class,
          detail: 'table',
          sortText: `1${t}`,
        }))
        syntaxCompletionItems = [...syntaxCompletionItems, ...tableCompletions]
      }

      if (item.syntaxContextType === EntityContextType.COLUMN) {
        const tables = entities?.filter(e => e.entityContextType === EntityContextType.TABLE).map(({ text: tableName }) => {
          return current.value?.items?.find(v => v.name === tableName) as DatabaseListItem
        }).filter(v => v) ?? []
        const columns = tables.map(v => v.items?.map(v => v.name) ?? '').flat().filter(v => v)
        const columnCompletions: ICompletionItem[] = columns.map((col) => {
          return {
            label: col,
            kind: languages.CompletionItemKind.Field,
            detail: 'column',
            sortText: `0${col}`,
          }
        })
        syntaxCompletionItems = [...syntaxCompletionItems, ...columnCompletions]
      }
    })

    resolve([...syntaxCompletionItems, ...keywordsCompletionItems])
  })
}

setupLanguageFeatures(LanguageIdEnum.MYSQL, {
  completionItems: {
    triggerCharacters: [' ', '.'],
    enable: true,
    completionService,
  },
})

function run() {
  sql.value = code.value
  if (!editor.value)
    return
  const selection = editor.value.getSelection()
  if (selection) {
    const selectedText = editor.value?.getModel()?.getValueInRange(selection)
    if (selectedText) {
      sql.value = selectedText
    }
  }

  else {
    const position = editor.value?.getPosition()
    const lineNumber = position?.lineNumber
    if (lineNumber) {
      const lineContent = editor.value?.getModel()?.getLineContent(lineNumber)
      sql.value = lineContent ?? code.value
    }
  }
  execute()
}
</script>

<template>
  <div class="n-border-base border-b p-2 flex items-center justify-between">
    <div>{{ current?.name }}</div>
    <div class="flex gap-2 items-center">
      <NButton
        n="xs"
        icon="i-carbon:play"
        @click="run"
      >
        运行
      </NButton>
    </div>
  </div>
  <MonacoEditor
    ref="editorRef"
    v-model:model-value="code"
    class="h-full"
    :lang="LanguageIdEnum.MYSQL"
    :options="{ theme: 'vs-dark' }"
  />
</template>
