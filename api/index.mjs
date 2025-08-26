/**
 * @fileoverview 用于 Vercel Functions 的入口文件
 *
 * 使用 Vercel Functions 时，Vercel CLI 会执行 `package.json` 中的 `vercel-build` 脚本进行构建，
 * 当前文件会导入构建结果，并导出为 Vercel Functions 的入口文件。
 * 
 * 同时，依赖 vercel.json 中的 rewrite 配置，将所有 /api 请求重写到这个文件。
 */

import app from "../dist-prebuild/index.js";

export default app;
