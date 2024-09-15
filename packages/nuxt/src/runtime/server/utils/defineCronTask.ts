import type { Task, TaskContext, TaskPayload } from 'nitropack/runtime'
import { Cron } from 'croner'
import { defineTask, useNitroApp } from 'nitropack/runtime'

export interface CronTask<RT> extends Task<RT> {
  pattern?: string | Date
}

export function defineCronTask<RT = unknown>(def: CronTask<RT>) {
  const { pattern, ...taskDef } = def
  const nitroApp = useNitroApp()
  const task = defineTask(taskDef)

  if (pattern) {
    const cron = new Cron(pattern, async () => {
      const payload: TaskPayload = { scheduledTime: Date.now() }
      const context: TaskContext = {}
      await task.run({ context, payload, name: task.meta?.name || '' })
    })
    nitroApp.hooks.hook('close', () => cron.stop())
  }

  return task
}
