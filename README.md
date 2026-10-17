# DSH 社区市场（中文）

DeepSeek Harness「插件 → 发现」可直接使用的 **format 1** 插件市场索引：中文市场名、中文分类，以及可获得的中文标题/描述。

- 索引文件：[`index.json`](./index.json)（约 2.2 MB，**597 个插件 / 9138 个版本 / 14 个分类**）
- 订阅地址：`https://raw.githubusercontent.com/yueyexiayu/dsh-market-zh/main/index.json`

## 使用

1. 插件 → **发现** → **添加索引源**
2. 粘贴：`https://raw.githubusercontent.com/yueyexiayu/dsh-market-zh/main/index.json`
3. 保存后在「发现」里浏览；分类按钮来自本索引声明的 `metadata.categories`，工具栏左侧市场菜单可切换索引源。

订阅地址是直连（`raw.githubusercontent.com` 返回 200、不重定向），满足宿主抓取要求；`github.com/.../raw/...` 会 302，不能用。

## 数据来源

| 来源 | 用途 |
|---|---|
| npm registry | 扫描声明了 `dsh.bundle.patch` 的包，取每个可安装版本的版本号、发布时间与 `engines.dsh` |
| 候选清单 | [bruc3van/awesome-dsh-plugin](https://github.com/bruc3van/awesome-dsh-plugin) 的 `data/packages.json` 安装映射 + npm 关键词搜索（`dsh-plugin`、`deepseek-harness`） |
| 精选与本地化 | 同一仓库的 format-1 精选条目、`curated.json` 的分类覆盖（76 条）与中文描述（78 条） |

`name`、`versions`、`source`、`engines`、`publishTimestamp`、`homepage`、`repository` 都来自上游包元数据，未编造。收录只代表元数据可核实，**不代表安全审查**；安装前请在确认框里核对来源。

## 中文覆盖

- 市场名称、市场描述、**全部 14 个分类名**为中文。
- 33 个精选条目有完整中文标题 + 中文描述；另有上游提供的 78 条中文描述按仓库匹配生效。
- 其余条目描述来自包 manifest（多为英文）。`LocalizedText` 规定对象必须含 `en`，所以英文作为回退存在；需要某个分类或某个插件的中文描述，可在 `scripts/build.mjs` 的 `ZH` 表里补充。

## 重新生成

```sh
node scripts/build.mjs          # 用 .cache/scan.json 缓存（快）
rm -rf .cache && node scripts/build.mjs   # 重新全量扫描 npm
```

构建脚本会重新抓取上游数据、重新扫描 npm、重新分类并写回 `index.json`。校验：

```sh
node --import tsx/esm --input-type=module -e "
import { readFileSync } from 'node:fs'
import { parseMarketIndex } from '<dsh-repo>/packages/util/plugin-market-index/src/index.ts'
const idx = parseMarketIndex(JSON.parse(readFileSync('index.json', 'utf8')), 'https://example.com/index.json')
console.log('VALID', idx.plugins.length)
"
```

## 分类

分类由 `curated.json` 的仓库级覆盖优先，其次按名称/描述关键词匹配：

其他 / 开发工具 / 媒体与视觉 / 搜索与联网 / 集成与分享 / 会话与同步 / 模型与提供方 / 代理与工作流 / 备份与迁移 / 知识与研究 / 界面与体验 / 记忆与知识库 / 实用工具 / 浏览器与自动化

## 声明

索引是第三方内容；本仓库只做聚合、分类与文本本地化，不托管插件、不代理下载、不执行安装。各插件版权与许可证以原作者声明为准。
