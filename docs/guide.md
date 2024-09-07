---
title: 指南
description: 快速上手 WechatFerry
---

# 什么是 WechatFerry

WechatFerry 是由 @lich0821 开发的 Windows 下的微信机器人底层框架。

wcf 官方提供了包含 Python、Java、Rust、Go 客户端的第一方实现，本项目是 Node 生态下的第三方客户端实现，皆在使每个人都能轻松接入并快速开发微信机器人。

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

WechatFerry 提供了多种集成方式，如果你在用 Nuxt 的话，我推荐直接使用下方的 Nuxt 模块，不仅可以享受完整的 Nuxt 生态和开发体验，还能拥有自动注册、微信数据库开发者工具等集成。

如果你对 [Wechaty](https://wechaty.js.org/) 更熟悉，请使用下方的 Wechaty Puppet 集成。

若你想完全控制并自主实现，请使用 Node 集成。

<ContentIntegrations />

## 插件

WechatFerry 从 v0.0.9 之后将逐步实现有趣、常用、有用的基于 Wechaty Plugins 或 Proxy 的插件，这些插件只适用于 Wechaty 或是对 @wechatferry/puppet 的扩展

<ContentPlugins />
