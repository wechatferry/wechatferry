let siliconflow: typeof $fetch
export function useSiliconflow() {
  const logger = useLogger('useSiliconflow')
  if (!siliconflow) {
    const { siliconflow: siliconflowConfig } = useRuntimeConfig()
    siliconflow = $fetch.create({
      baseURL: 'https://api.siliconflow.cn/v1',
      headers: {
        'Authorization': `Bearer ${siliconflowConfig?.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 100 * 1000,
      onRequest(ctx) {
        if (
          ctx.options.body
          && typeof ctx.options.body === 'object'
          && ctx.options.body !== null
        ) {
          ctx.options.body = {
            response_mode: 'blocking',
            user: 'sanhua-robot',
            ...ctx.options.body,
          }
        }
      },
      onRequestError({ error }) {
        logger.error(error as any)
      },
    })
  }

  return siliconflow
}
