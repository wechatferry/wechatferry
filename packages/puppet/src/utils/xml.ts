import xml2js, { type ParserOptions } from 'xml2js'

export async function xmlToJson<T extends Record<string, any>>(xml: string, options?: ParserOptions): Promise<T> {
  const posIdx = xml.indexOf('<')
  if (posIdx !== 0)
    xml = xml.slice(posIdx)
  return xml2js.parseStringPromise(xml, {
    explicitArray: false,
    ...options,
  })
}
