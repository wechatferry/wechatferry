---
title: 指南
description: 快速上手 WechatFerry
---

# 什么是 WechatFerry

WechatFerry 是由 @lich0821 开发的 Windows 下的微信机器人底层框架。

::: warning
如果你没有 64 位的 Windows 系统，那么本项目不适合你。
:::

## 开始前

在开始之前，你需要确保使用的微信版本是受支持的，当前需要的版本是：[3.9.10.27](https://github.com/tom-snow/wechat-windows-versions/releases/tag/v3.9.10.27)

::: info
你可以在 [wechat-windows-versions](https://github.com/tom-snow/wechat-windows-versions/releases) 找到所有微信的历史版本。
:::

## 客户端

WechatFerry 官方提供了包含Python、Java、Rust、Go 客户端的第一方实现，本项目是 Node 生态下 WechatFerry 的第三方客户端实现。

如果你想使用 JS 轻松接入 WechatFerry，那就没错了。

## 集成

提供了多种集成方式，如果你在用 Nuxt 的话，直接使用 @wechatferry/nuxt 模块，否则建议直接使用 Wechaty

<ContentIntegrations />
