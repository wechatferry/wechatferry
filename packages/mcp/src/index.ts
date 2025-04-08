import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { version } from "../package.json"
import type { WechatyInterface } from 'wechaty/impls'

interface WechatFerryServerOptions {
    wechaty: WechatyInterface
}

export class WechatFerryServer extends McpServer {
    wechaty: WechatyInterface

    constructor(options: WechatFerryServerOptions) {
        super({ name: "WechatFerry", version: version });
        this.wechaty = options.wechaty
        this.init()
    }

    init() {
        this.tool('wechat_list_contacts', "List all contacts", async () => {
            const contacts = await this.wechaty.Contact.findAll()
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(contacts)
                }]
            }
        })

        this.tool('wechat_list_groups', "List all groups", async () => {
            const groups = await this.wechaty.Room.findAll()
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(groups)
                }]
            }
        })
    }
}
