# 微软“朗读” TTS 转发器

运行于 Cloudflare Workers 上的微软“大声朗读”转发器。通过简单的 HTTP GET 请求，将文本转换为语音。

## “大声朗读” 是什么？

“大声朗读” (Read aloud) 是微软为一系列自家服务提供的文字转语音服务。由于大家基本上都使用的是 Edge 浏览器上的接口，所以也被时常称为 "**Edge TTS**"。

## API 参考

Swagger 文档：<https://readaloud.yfi.moe/api/ui>

## 相关项目

- [wxxxcxx/ms-ra-forwarder: 免费的在线文本转语音API](https://github.com/wxxxcxx/ms-ra-forwarder) 本项目的“祖师爷”，部分代码灵感的来源。只支持 Node.js 运行时。
- [yy4382/ms-ra-forwarder-for-ifreetime](https://github.com/yy4382/ms-ra-forwarder-for-ifreetime) Fork 自 wxxxcxx/ms-ra-forwarder，添加了对爱阅书香和爱阅记的支持。本项目是它的 Cloudflare Workers 移植重写版本。
- [yy4382/tts-importer](https://github.com/yy4382/tts-importer) 本项目的姊妹项目，使用微软 Azure 的官方接口，支持更多语音和其他高级配置。

更多有关听书的信息，请访问 [我的听书方法汇总 - Yunfi](https://yfi.moe/book-listening-collection)
