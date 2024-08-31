import type { Processor, QueueOptions, WorkerOptions } from 'bullmq'
import { Queue, Worker } from 'bullmq'

export interface BullmqQueueOptions<D, R> {
  name: string
  processor: (queue: Queue<D, R>, worker: Worker<D, R>) => Processor<D, R>
  queueOptions?: QueueOptions
  workerOptions?: WorkerOptions
}

export function defineBullmqQueue<D = any, R = any>(options: BullmqQueueOptions<D, R>) {
  let queue: Queue<D, R>
  let worker: Worker<D, R>

  const { name, processor, queueOptions, workerOptions } = options

  return () => {
    if (!queue) {
      const connection = useRedis()
      queue = new Queue(name, {
        connection,
        ...queueOptions,
      })
      let processorFn: Processor<D, R> | null = null
      worker = new Worker(name, async (job, token) => {
        if (!processorFn) {
          processorFn = await processor(queue, worker)
        }
        return processorFn(job, token)
      }, {
        connection,
        ...workerOptions,
      })
    }

    return {
      worker,
      queue,
    }
  }
}
