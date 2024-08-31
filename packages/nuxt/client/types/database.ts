export interface DatabaseListItem {
  name: string
  path: string
  items?: DatabaseListItem[]
  type?: string
  pk?: string
}
