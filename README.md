# 微软“朗读” TTS 转发器

运行于 Cloudflare Workers / Node.js (Docker) 上的微软“大声朗读”转发器。通过简单的 HTTP GET 请求，将文本转换为语音。

**可以直接使用的资源**：https://github.com/yy4382/read-aloud/issues/1

## “大声朗读” 是什么？

“大声朗读” (Read aloud) 是微软为一系列自家服务提供的文字转语音服务。由于大家基本上都使用的是 Edge 浏览器上的接口，所以也被时常称为 "**Edge TTS**"。

## 自行部署

### Cloudflare Workers

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/yy4382/read-aloud)

<!-- 指南：[Deploy with Workers 按钮使用指南 - Yunfi](https://yfi.moe/post/deploy-with-cloudflare-btn-guide) -->

环境变量设置：在 Cloudflare 面板的当前 Workers 项目中，找到 Settings -> Variables and Secrets，即可添加环境变量。

```plaintext
TOKEN=YOUR_TOKEN # Optional
```

### Node.js (Docker)

```bash
docker run -d --name read-aloud -p 3000:3000 -e TOKEN=YOUR_TOKEN yunfinibol/read-aloud:main
```

记得将 `YOUR_TOKEN` 替换为你的实际令牌。

## API 参考

Swagger 文档：<https://ra.yfi.moe/api/ui>

## 相关项目

- [wxxxcxx/ms-ra-forwarder: 免费的在线文本转语音 API](https://github.com/wxxxcxx/ms-ra-forwarder) 本项目的“祖师爷”，部分代码灵感的来源。只支持 Node.js 运行时。
- [yy4382/ms-ra-forwarder-for-ifreetime](https://github.com/yy4382/ms-ra-forwarder-for-ifreetime) Fork 自 wxxxcxx/ms-ra-forwarder，添加了对爱阅书香和爱阅记的支持。本项目是它的移植重写版本。
- [yy4382/tts-importer](https://github.com/yy4382/tts-importer) 本项目的姊妹项目，使用微软 Azure 的官方接口，支持更多语音和其他高级配置。

更多有关听书的信息，请访问 [我的听书方法汇总 - Yunfi](https://yfi.moe/book-listening-collection)

## How does the bundling / deployment work?

### Cloudflare Workers

Deploy to Cloudflare 按钮默认使用 package.json 中 deploy 脚本进行部署。

流程：tsup 打包到 dist-prebuild 目录（`pnpm run prebuild:worker`）（由 wrangler.toml 中的 build 参数运行该命令），然后 wrangler deploy 将 `dist-prebuild/workerd.mjs`（由 wrangler.toml 中的 main 参数指定该文件）部署到 Cloudflare Workers。
