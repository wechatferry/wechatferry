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

export async function jsonToXml(data: Record<string, any>): Promise<string> {
  const builder = new xml2js.Builder({
    xmldec: {
      version: '1.0',
    },
  })
  const xml = builder.buildObject(data)
  return xml
}
