import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { WechatFerryServer } from "."
import { WechatyBuilder } from "wechaty";
import { WechatferryPuppet } from "@wechatferry/puppet";


process.on('SIGINT', async () => {
    process.stdin.setRawMode(false);
    process.stdin.pause();
});

export async function main() {
    const puppet = new WechatferryPuppet()
    const wechaty = WechatyBuilder.build({
        puppet,
    })
    await wechaty.start()
    
    const server = new WechatFerryServer({
        wechaty
    });    
    await wechaty.ready()
    const transport = new StdioServerTransport();
    await server.connect(transport);
}