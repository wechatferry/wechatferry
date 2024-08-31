import { defineEventHandler } from 'h3'
import { useBotAgent } from '../../../server/utils/useBotAgent'

export default defineEventHandler(() => {
  const agent = useBotAgent()

  const dbs = agent.wcf.getDbNames()
  const results = dbs.map((db) => {
    const tables = agent.wcf.getDbTables(db).map((table) => {
      const tableInfo = agent.wcf.execDbQuery(db, `PRAGMA table_info(${table.name})`)
      return {
        name: table.name,
        path: `${db}/${table.name}`,
        items: tableInfo.map((col) => {
          return {
            name: col.name,
            type: col.type,
            pk: col.pk,
            path: `${db}/${table.name}/${col.name}`,
          }
        }),
      }
    })
    return {
      name: db,
      path: db,
      items: tables,
    }
  })
  return results
})
