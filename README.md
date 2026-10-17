# DSH 社区市场（中文索引）

DeepSeek Harness「插件 → 发现」可直接使用的 **format 1** 插件市场索引，中文标题与描述。

- 索引文件：[`index.json`](./index.json)
- 订阅地址：`https://raw.githubusercontent.com/yueyexiayu/dsh-market-zh/main/index.json`
- 数据来源：[bruc3van/awesome-dsh-plugin](https://github.com/bruc3van/awesome-dsh-plugin) 的公开索引 `data/dsh-market-index.json`
- 本地化范围：只把每个插件的 `title` / `description` 从英文扩展为 `{ "en": ..., "zh": ... }`；`name`、`versions`、`source`、`engines`、`homepage`、`repository` 等机器字段与上游完全一致，未做任何增删改。

## 使用

1. 插件 → **发现** → **添加索引源**
2. 粘贴：`https://raw.githubusercontent.com/yueyexiayu/dsh-market-zh/main/index.json`
3. 保存后即可在「发现」里浏览；工具栏左侧的市场菜单可在中文版与英文原版之间切换。

要求由宿主保证：URL 必须是 `http(s)` 且不经过重定向；`raw.githubusercontent.com` 直连返回 200，符合要求（`github.com/.../raw/...` 会 302，不能用）。

## 刷新

上游每日更新。刷新后重新生成本文件并提交：

```sh
python3 scripts/localize.py
```

脚本会拉取上游 `data/dsh-market-index.json`，复用翻译表写回 `zh`；上游新增的条目如果没有译文，会保留英文并在输出里列出，按需补充 `scripts/localize.py` 的 `ZH` 映射。

## 校验

生成后可用 DSH 源码里的官方校验库校验：

```sh
node --import tsx/esm --input-type=module -e "
import { readFileSync } from 'node:fs'
import { parseMarketIndex } from '<dsh-repo>/packages/util/plugin-market-index/src/index.ts'
const idx = parseMarketIndex(JSON.parse(readFileSync('index.json', 'utf8')), 'https://example.com/index.json')
console.log('VALID', idx.plugins.length)
"
```

## 声明

索引是第三方内容，收录不代表安全审查，也不代表与对应插件作者存在隶属关系；安装前请在确认框里核对来源。本仓库只做文本本地化。
