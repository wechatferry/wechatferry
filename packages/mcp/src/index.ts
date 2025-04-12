import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { version } from "../package.json"
import type { WechatyInterface } from 'wechaty/impls'
import { WechatferryAgent } from "@wechatferry/agent";
import { isRoomId, wechatferryDBMessageToWechaty, WechatferryPuppet } from "@wechatferry/puppet";

interface WechatFerryServerOptions {
    wechaty: WechatyInterface
}

export class WechatFerryServer extends McpServer {
    wechaty: WechatyInterface
    wcf: WechatferryAgent
    puppet: WechatferryPuppet

    constructor({
        wechaty,
    }: WechatFerryServerOptions) {
        super({ name: "WechatFerry", version: version });
        this.wechaty = wechaty
        this.puppet = wechaty.puppet as WechatferryPuppet
        this.wcf = this.puppet.agent
        this.init()
    }

    async init() {
        // contacts
        this.tool('wechat_list_contacts', "List all contacts", async () => {
            const contacts = await this.wechaty.Contact.findAll()
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(contacts.map(c => c.payload))
                }]
            }
        })

        this.tool('wechat_search_contacts', "Search contacts by name or id", {
            query: z.string().describe("Search term to match against contact name or id"),
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
                    text: JSON.stringify(contacts.map(c => c.payload))
                }]
            }
        })

        //rooms
        this.tool('wechat_list_rooms', "List all rooms", async () => {
            const rooms = await this.wechaty.Room.findAll()
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(rooms.map(r => r.payload))
                }]
            }
        })

        this.tool('wechat_search_rooms', "Search rooms by name or id", {
            query: z.string().describe("Search term to match against room name or id"),
        }, async ({ query }) => {
            let rooms: any[] = []
            if (query.startsWith('wxid_')) {
                rooms = await this.wechaty.Room.findAll({ id: query })
            } else {
                const regex = new RegExp(query, 'i')
                rooms = await this.wechaty.Room.findAll({ topic: regex })
            }
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(rooms)
                }]
            }
        })

        // send
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

        // history
        this.tool('wechat_get_message_history', "Get recent messages from a contact or room", {
            contactIdOrRoomId: z.string().describe("Contact or room id to get the message history for"),
            limit: z.number().describe("Number of messages to retrieve").default(10),
        }, async ({ contactIdOrRoomId: id, limit }) => {
            const messages = await this.wcf.getHistoryMessageList(id, (sql) => {
                sql.where("Type", 1)
                    .limit(limit)
            }, -1)

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(await Promise.all(messages.map(async (msg) => {
                        return await wechatferryDBMessageToWechaty(this.puppet, msg)
                    })))
                }]
            }
        });
    }
}
