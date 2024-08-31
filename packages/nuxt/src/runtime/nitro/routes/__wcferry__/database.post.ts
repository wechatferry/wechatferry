import { defineEventHandler, readBody } from 'h3'
import { useBotAgent } from '../../../server/utils/useBotAgent'

export default defineEventHandler(async (event) => {
  const { sql, db } = await readBody(event)
  if (!db)
    return
  if (!sql)
    return
  const agent = useBotAgent()
  return agent.dbSqlQuery(db, sql)
})
