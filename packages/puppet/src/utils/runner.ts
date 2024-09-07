export type Runner<T> = () => Promise<T | null>

export async function executeRunners<T>(runners: Runner<T>[]): Promise<T | null> {
  for (const runner of runners) {
    const ret = await runner()
    if (ret) {
      return ret
    }
  }

  return null
}
