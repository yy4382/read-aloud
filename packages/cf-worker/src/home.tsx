import type { FC } from "hono/jsx";

export const Home: FC = () => (
  <html lang="zh-CN">
    <head>
      <meta charSet="UTF-8" />
      <title>微软“朗读” TTS 转发器</title>
      <link rel="stylesheet" href="https://cdn.simplecss.org/simple.min.css" />
    </head>
    <body>
      <header>
        <nav>
          <ul>
            <li>
              <a href="/">首页</a>
            </li>
            <li>
              <a href="/api/ui">API 文档</a>
            </li>
            <li>
              <a href="https://github.com/yy4382/read-aloud">GitHub</a>
            </li>
            <li>
              <a href="https://yfi.moe/book-listening-collection">更多</a>
            </li>
          </ul>
        </nav>
        <h1>微软“朗读” TTS 转发器</h1>
        <p>运行于 Cloudflare Workers 上的微软“大声朗读”转发器。</p>
        <p style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 0rem;">
          <a
            class="button"
            href="https://github.com/yy4382/read-aloud/issues/1"
          >
            直接使用
          </a>
          <a class="button" href="https://github.com/yy4382/read-aloud">
            GitHub
          </a>
        </p>
      </header>
      <main>
        <h2 id="-">“大声朗读” 是什么？</h2>
        <p>
          “大声朗读” (Read aloud)
          是微软为一系列自家服务提供的文字转语音服务。由于大家基本上都使用的是
          Edge 浏览器上的接口，所以也被时常称为 "<strong>Edge TTS</strong>"。
        </p>
        <h2 id="-">自行部署</h2>
        <p>
          <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/yy4382/read-aloud">
            <img
              src="https://deploy.workers.cloudflare.com/button"
              alt="Deploy to Cloudflare Workers"
            />
          </a>
        </p>
        <h3 id="-">环境变量</h3>
        <p>
          在 Cloudflare 面板的当前 Workers 项目中，找到 Settings -&gt; Variables
          and Secrets，即可添加环境变量。
        </p>
        <pre>
          <code className="lang-plaintext">
            <span className="hljs-built_in">TOKEN</span>=YOUR_TOKEN{" "}
            <span className="hljs-meta"># Optional</span>
            {"\n"}
          </code>
        </pre>
        <h2 id="api-">API 参考</h2>
        <p>
          <a class="button" href="https://readaloud.yfi.moe/api/ui">
            Swagger 文档
          </a>
        </p>
        <h2 id="-">相关项目</h2>
        <ul>
          <li>
            <a href="https://github.com/wxxxcxx/ms-ra-forwarder">
              wxxxcxx/ms-ra-forwarder: 免费的在线文本转语音API
            </a>{" "}
            本项目的“祖师爷”，部分代码灵感的来源。只支持 Node.js 运行时。
          </li>
          <li>
            <a href="https://github.com/yy4382/ms-ra-forwarder-for-ifreetime">
              yy4382/ms-ra-forwarder-for-ifreetime
            </a>{" "}
            Fork 自
            wxxxcxx/ms-ra-forwarder，添加了对爱阅书香和爱阅记的支持。本项目是它的
            Cloudflare Workers 移植重写版本。
          </li>
          <li>
            <a href="https://github.com/yy4382/tts-importer">
              yy4382/tts-importer
            </a>{" "}
            本项目的姊妹项目，使用微软 Azure
            的官方接口，支持更多语音和其他高级配置。
          </li>
        </ul>
        <p>
          更多有关听书的信息，请访问{" "}
          <a href="https://yfi.moe/book-listening-collection">
            我的听书方法汇总 - Yunfi
          </a>
        </p>
      </main>
      <footer>
        <p>
          Made with ❤️ by <a href="https://yfi.moe">Yunfi</a>.
          <br />
          Please consider give a ⭐️ on{" "}
          <a href="https://github.com/yy4382/read-aloud">GitHub</a>.
        </p>
      </footer>
    </body>
  </html>
);
