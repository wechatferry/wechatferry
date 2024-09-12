---
title: 指南
description: 快速上手 wechatferry
---

# 什么是 WechatFerry

WechatFerry 是由 @lich0821 开发的 Windows 下的微信机器人底层框架。

wcf 官方提供了包含 Python、Java、Rust、Go 客户端的第一方实现，本项目 [wechatferry](https://wcferry.netlify.app/) 是 Node 生态下的第三方客户端实现，并提供了心智友好的接入方式，皆在使每个人都能轻松接入并快速开发微信机器人，更多功能请查看[特性](/features.html)。

::: danger
如果你没有 64 位的 Windows 系统，那么本项目不适合你。
:::

## 开始前

在开始之前，你需要确保使用的微信版本是受支持的，当前需要的版本是：[3.9.10.27](https://github.com/tom-snow/wechat-windows-versions/releases/tag/v3.9.10.27)

下载安装后，请**打开并登录**你的机器人账号，然后接着往下看~

::: tip
你可以在 [wechat-windows-versions](https://github.com/tom-snow/wechat-windows-versions/releases) 找到所有微信的历史版本。
:::

## 集成

wechatferry 提供了多种集成方式，如果你在用 [Nuxt](https://nuxt.com/) 的话，我推荐直接使用下方的 [Nuxt 模块](/integrations/nuxt.html)，不仅可以享受完整的 Nuxt 生态和开发体验，还能拥有自动注册、微信数据库开发者工具等集成。

如果你对 [Wechaty](https://wechaty.js.org/) 更熟悉，请使用下方的 [Wechaty Puppet](/integrations/wechaty.html) 集成。

若你想完全控制并自主实现，请使用 Node 集成。

<ContentIntegrations />

## 插件

wechatferry 从 v0.0.9 之后将逐步实现有趣、常用、有用的基于 [Wechaty Plugins](https://wechaty.js.org/docs/using-plugin-with-wechaty/overview) 或 Proxy 的插件，这些插件会用于 [Wechaty](https://wechaty.js.org/) 或是对 [@wechatferry/puppet](https://www.jsdocs.io/package/@wechatferry/puppet) 的扩展

<ContentPlugins />

## 示例

所有示例的源码可以在 `/examples` 文件夹中找到，欢迎贡献更多示例。

<ContentExamples/>

## 免责声明

使用本项目则表示您同意并认可以下声明

### 1. 使用目的

* 本项目仅供学习交流使用，**请勿用于非法用途**，**请勿用于非法用途**，**请勿用于非法用途**，否则后果自负。
* 用户理解并同意，任何违反法律法规、侵犯他人合法权益的行为，均与本项目及其开发者无关，后果由用户自行承担。

### 2. 使用期限

* 您应该在下载保存，编译使用本项目的24小时内，删除本项目的源代码和（编译出的）程序；超出此期限的任何使用行为，一概与本项目及其开发者无关。

### 3. 操作规范

* 本项目仅允许在授权情况下对数据库进行备份与查看，严禁用于非法目的，否则自行承担所有相关责任；用户如因违反此规定而引发的任何法律责任，将由用户自行承担，与本项目及其开发者无关。
* 严禁用于窃取他人隐私，严禁用于窃取他人隐私，严禁用于窃取他人隐私，否则自行承担所有相关责任。
* 严禁进行二次开发，严禁进行二次开发，严禁进行二次开发，否则自行承担所有相关责任。

### 4. 免责声明接受

* 下载、保存、进一步浏览源代码或者下载安装、编译使用本程序，表示你同意本警告，并承诺遵守它;

### 5. 禁止用于非法测试或渗透

* 禁止利用本项目的相关技术从事非法测试或渗透，禁止利用本项目的相关代码或相关技术从事任何非法工作，如因此产生的一切不良后果与本项目及其开发者无关。
* 任何因此产生的不良后果，包括但不限于数据泄露、系统瘫痪、侵犯隐私等，均与本项目及其开发者无关，责任由用户自行承担。

### 6. 免责声明修改

* 本免责声明可能根据项目运行情况和法律法规的变化进行修改和调整。用户应定期查阅本页面以获取最新版本的免责声明，使用本项目时应遵守最新版本的免责声明。

### 7. 其他

* 除本免责声明规定外，用户在使用本项目过程中应遵守相关的法律法规和道德规范。对于因用户违反相关规定而引发的任何纠纷或损失，本项目及其开发者不承担任何责任。

* 请用户慎重阅读并理解本免责声明的所有内容，确保在使用本项目时严格遵守相关规定。
