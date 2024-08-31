import OpenAI from 'openai'

let siliconflow: OpenAI
let deepseek: OpenAI
let openai: OpenAI

export function useAi() {
  const {
    deepseek: deepseekConfig,
    openai: openaiConfig,
    siliconflow: siliconflowConfig,
  } = useRuntimeConfig()

  if (!siliconflow && siliconflowConfig?.apiKey) {
    siliconflow = new OpenAI({
      baseURL: 'https://api.siliconflow.cn/v1',
      ...siliconflowConfig,
    })
  }

  if (!deepseek && deepseekConfig?.apiKey) {
    deepseek = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      ...deepseekConfig,
    })
  }

  if (!openai && openaiConfig?.apiKey) {
    openai = new OpenAI({
      ...openaiConfig,
    })
  }

  return {
    siliconflow,
  }
}
