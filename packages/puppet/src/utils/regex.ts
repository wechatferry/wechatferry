export type RegexHandler<T> = (matchedRegexIndex: number, match: RegExpMatchArray) => Promise<T>

export async function parseTextWithRegexList<T>(text: string, regexList: RegExp[], handler: RegexHandler<T>): Promise<T | null> {
  for (let i = 0; i < regexList.length; ++i) {
    const regex = regexList[i]!
    const match = text.match(regex)
    if (!match) {
      continue
    }

    return await handler(i, match)
  }

  return null
}
