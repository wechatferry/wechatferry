import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { version } from "../package.json"
import type { WechatyInterface } from 'wechaty/impls'
import { WechatferryAgent } from "@wechatferry/agent";

interface WechatFerryServerOptions {
    wechaty: WechatyInterface
}

export class WechatFerryServer extends McpServer {
    wechaty: WechatyInterface
    wcf: WechatferryAgent

    constructor(options: WechatFerryServerOptions) {
        super({ name: "WechatFerry", version: version });
        this.wechaty = options.wechaty
        // @ts-ignore
        this.wcf = this.wechaty.puppet
        this.init()
    }

    async init() {
        this.tool('wechat_list_contacts', "List all contacts", async () => {
            const contacts = await this.wechaty.Contact.findAll()
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(contacts)
                }]
            }
        })

        this.tool('wechat_search_contacts', "Search contacts by alias, name or id", {
            query: z.string().describe("Search term to match against contact alias, name or id"),
        }, async ({ query }) => {
            let contacts: any[] = []
            if (query.startsWith('wxid_')) {
                contacts = await this.wechaty.Contact.findAll({ id: query })
            } else {
                const regex = new RegExp(query, 'i')
                contacts = [
                    ...await this.wechaty.Contact.findAll({ alias: regex }),
                    ...await this.wechaty.Contact.findAll({ name: regex }),
                ]
                const uniqueContacts = new Set()
                contacts = contacts.filter(contact => {
                    const id = contact.id
                    if (uniqueContacts.has(id)) {
                        return false
                    } else {
                        uniqueContacts.add(id)
                        return true
                    }
                })
            }
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(contacts)
                }]
            }
        })

        this.tool('wechat_send_message', "Send a message to a contact or room", {
            contactIdOrRoomId: z.string().describe("Contact or room id to send the message to"),
            content: z.string().describe("Content of the message to send"),
        }, async ({ contactIdOrRoomId: id, content }) => {
            let name = 'Unknown'
            let contact: any = null
            if (isRoomId(id)) {
                contact = await this.wechaty.Room.find({ id: id });
                if (contact) {
                    name = await contact.topic()
                }
            } else {
                contact = await this.wechaty.Contact.find({ id: id });
                if (contact) {
                    name = contact.name()
                }
            }
            if (contact) {
                await contact.say(content)
                return {
                    content: [{
                        type: "text",
                        text: `Message sent to ${name}`
                    }]
                }
            } else {
                return {
                    content: [{
                        type: "text",
                        text: `Contact not found`
                    }]
                }
            }
        })
    }
}
