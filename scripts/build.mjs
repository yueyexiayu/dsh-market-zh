#!/usr/bin/env node
/**
 * Build the Chinese, categorized DSH plugin market index (format 1).
 *
 * Sources
 *  - npm registry: every package whose manifest declares `dsh.bundle.patch`
 *    (candidates come from the community install map, npm keyword search, and
 *    the curated private index)
 *  - bruc3van/awesome-dsh-plugin: curated format-1 entries, the install map
 *    (`data/packages.json`), category overrides and Chinese descriptions
 *
 * Output: index.json next to this repository root.
 */
import { readFile, writeFile } from 'node:fs/promises'

const UPSTREAM = 'https://raw.githubusercontent.com/bruc3van/awesome-dsh-plugin/main/data'
const REG = 'https://registry.npmjs.org/'
const CONCURRENCY = 20
const MAX_VERSIONS = 10

// Chinese labels for the 33 curated entries that previously shipped translated text.
const ZH = {
  'dsh-opencode-go': ['OpenCode Go 模型提供方', '为 DeepSeek Harness 接入 OpenCode Go 模型，并带设置界面。'],
  'dsh-auto-review': ['AI 自动审批复核', '用第二个模型自动复核 DSH 的审批请求：只读的复核子代理在审批链上给出允许/拒绝，失败即拒绝，并完整审计会话日志。'],
  'dsh-vision-router': ['视觉路由：给纯文本模型装眼睛', '为纯文本 DSH 代理提供内置免费视觉链与像素级工具；除严格本地模式外，图片会发送给远程视觉提供方（默认走免费回退）。'],
  'dsh-permission-rules': ['权限规则 + 网络策略', 'Claude Code 风格的声明式权限规则与 Codex 风格的进程级网络策略：按工具名、参数、工作区路径、网络目标有序匹配 allow/deny/ask。'],
  'dsh-research-report': ['可验证研究报告', '内容寻址的证据账本（声明与快照绑定、防篡改）加带版本封存报告；每条声明都有验证结论。'],
  'dsh-industry-research': ['行业与公司研究包', '行业/公司研究领域包：方法论技能、产业链结构模型、公开源政策与新闻跟踪、公司扫描卡与可审计研究流程。'],
  'dsh-im-companion': ['IM 助理伴侣', '以「助理」和「家」的概念增强 dsh-im：哪个工作区有助理在管、在不在线一目了然。'],
  'dsh-plugin-bridge': ['跨预设会话迁移', '可预览的跨预设会话迁移，交接内容有界、schema 固定。'],
  'dsh-undo-savepoint': ['撤销 / 回滚存档点', 'DSH 撤销与回滚系统：配置变更即快照，可在 WebUI 或对话里撤销/重做上一步。'],
  'dsh-gitbash-shell': ['Windows Git Bash 执行器', '在 Windows 上给代理一个真正的 Git Bash 工具：私有执行器实例，官方 PowerShell 执行器保留。'],
  'dsh-checkpoint-rewind': ['统一检查点与回滚', '会话 + 工作区 + 配置三态快照与一键回滚，含命令、工具、定时快照与差异时间线。'],
  'dsh-fund-research': ['公募基金研究', '中国公募基金研究插件：公开源采集 + 确定性指标（经理画像、持仓穿透、风格归因、业绩拆解）。'],
  '@mars-sea/dsh-commandcode-provider': ['Command Code 模型提供方', '非官方 Command Code 模型提供方插件：注册 commandcode 路由，带模型页卡片与实时目录。'],
  'dsh-plugin-teamflow': ['TeamFlow 团队研发流水线', '需求→PRD→设计→架构→技术方案→并行开发→QA→验收的团队研发流水线，带 Web 团队工作台。'],
  'dsh-lsp-actions': ['LSP 动作集', '为 DSH 提供 LSP 动作面：诊断、格式化、补全、代码动作、符号、签名帮助与重命名。'],
  'dsh-session-sync': ['会话跨设备同步', '会话库的专用 git 镜像，追加式三方合并与 /sync 命令、推拉工具。'],
  'dsh-xdpool': ['模型额度池', '把所有免费额度合成一个 DSH 模型池：登录、故障转移、聚合免费额度与用量面板。'],
  '@xiaoyuyu6420/dsh-backup': ['DSH 全量备份 / 迁移', '一条命令备份、恢复与迁移 DSH 全部数据（~/.dsh），含定时备份与进程外救援。'],
  'dsh-qoder-connect': ['Qoder 模型接入', '把 Qoder（国内版 / 国际版）的模型接入 DeepSeek Harness。'],
  'dsh-md-notes': ['Markdown 笔记', 'Markdown 笔记管理器与编辑器，可同步到 Git 仓库。'],
  'dsh-output-styles': ['输出风格切换', '等价于 Claude Code outputStyles 的运行时输出风格切换。'],
  'dsh-translate': ['参数翻译与 JSON 修复', '厂商参数翻译 + 确定性 JSON 修复：/translate 与 fix_json 工具。'],
  'dsh-zotero': ['Zotero 文献助手', '让代理搜索、阅读并引用本地 Zotero 库。'],
  'dsh-mattpocock-skills-deck': ['mattpocock 技能包', '安装即自带 mattpocock/skills v1.3.1 的 27 个工程与效率技能。'],
  'dsh-agent-message': ['跨会话 Agent 通信', '让 DSH 里不同的 Agent 会话互相收发消息。'],
  'dsh-library': ['本地文档知识库', '本地文档知识库：混合语义与关键词检索、引用感知注入与引用校验。'],
  'memory-eternal': ['记忆核心 Memory Eternal', '自研记忆插件：对话结束后自动沉淀知识卡到本地 Markdown Vault，设置页有图形化知识库。'],
  'dsh-memento': ['分层跨会话记忆', '有界、分层、审批门控、可审计的跨会话记忆服务。'],
  'dsh-vision-proxy': ['视觉代理：图片先转文字', 'deepseek-vision 路由先把附件图片转成文本，再交给纯文本适配器。'],
  'dsh-mcp-panel': ['MCP 管理台', '官方 MCP 客户端的控制台：/mcp 命令与设置页服务器增删改。'],
  'dsh-pdf-mineru': ['MinerU 文档解析', '基于 MinerU 的文档解析：原生后台任务、不可变结果、请求合并。'],
  '@yangdcm/dsh-expert-team': ['专家团：多智能体团队', '一句自然语言组建角色化多智能体团队，按九阶段门控流水线协作交付。'],
  'dsh-doublecheck': ['交付质量门禁', '交付质量门禁：拷问需求、测试实现、证明交付，用可交付/返工决策把住交接。'],
}

// Market categories: stable ids with Chinese and English titles.
const CATEGORIES = {
  'developer-tools': ['开发工具', 'Developer tools'],
  'models-providers': ['模型与提供方', 'Models & providers'],
  'memory-knowledge': ['记忆与知识库', 'Memory & knowledge'],
  'search-web': ['搜索与联网', 'Search & web'],
  'browser-automation': ['浏览器与自动化', 'Browser & automation'],
  'media-vision': ['媒体与视觉', 'Media & vision'],
  'agents-workflows': ['代理与工作流', 'Agents & workflows'],
  'session-sync': ['会话与同步', 'Sessions & sync'],
  'backup-migrate': ['备份与迁移', 'Backup & migration'],
  'ui-experience': ['界面与体验', 'UI & experience'],
  'knowledge-research': ['知识与研究', 'Knowledge & research'],
  'integrations-sharing': ['集成与分享', 'Integrations & sharing'],
  'utilities': ['实用工具', 'Utilities'],
  'other': ['其他', 'Other'],
}

const KEYWORDS = [
  ['browser-automation', /chrome|browser|cdp|playwright|puppeteer|screenshot|tab[ _-]|页面自动化|浏览器|截图/],
  ['search-web', /search|crawl|scrape|fetch|web[ _-]?tool|联网|搜索|采集|抓取/],
  ['memory-knowledge', /memory|recall|knowledge|vault|记忆|知识库|智识/],
  ['backup-migrate', /backup|restore|migrat|备份|迁移|迁移/],
  ['session-sync', /session[ _-]?sync|checkpoint|rewind|undo|restore[ _-]?point|会话同步|回滚|检查点|撤销/],
  ['models-providers', /provider|endpoint|api[ _-]?key|oauth|quota|balance|usage|billing|token[ _-]?cost|model[ _-]?router|模型|提供方|额度|登录|余额|用量/],
  ['media-vision', /image|video|vision|audio|speech|ocr|图片|视频|视觉|音频|图像/],
  ['integrations-sharing', /mcp|integration|share|bridge|export|import|market|集成|分享|导出|导入/],
  ['knowledge-research', /research|report|note|docs?\b|pdf|office|markdown|wiki|zotero|文献|研究|笔记|文档/],
  ['agents-workflows', /agent|workflow|team|subagent|ralph|prompt|persona|skill|智能体|工作流|团队|技能/],
  ['ui-experience', /theme|sidebar|style|panel|layout|icon|界面|主题|侧栏|皮肤|样式/],
  ['developer-tools', /git|lsp|test|lint|code[ _-]action|diagnos|debug|editor|typescript|package|build|review|audit|开发|调试|代码|测试|审查/],
  ['utilities', /tool|util|helper|status|notify|alert|log|monitor|config|setting|shortcut|script|file|实用|工具|通知|日志|配置|快捷/],
]

const CATEGORY_ALIAS = {
  'developer-tools': 'developer-tools',
  'ui-experience': 'ui-experience',
  'agents-workflows': 'agents-workflows',
  'integrations-sharing': 'integrations-sharing',
  'utilities': 'utilities',
  'media-vision': 'media-vision',
  'ecosystem-resources': 'integrations-sharing',
  'knowledge-research': 'knowledge-research',
}

const repoKey = (url) => {
  const match = /github\.com[/:]([^/]+)\/([^/#?]+)/i.exec(url ?? '')
  return match ? `${match[1]}/${match[2].replace(/\.git$/, '')}`.toLowerCase() : undefined
}

/** Manifests carry shorthand and VCS URLs; the index only accepts http(s). */
function httpUrl(value) {
  if (typeof value !== 'string') return undefined
  let url = value.trim()
  if (!url) return undefined
  if (url.startsWith('github:')) url = `https://github.com/${url.slice('github:'.length)}`
  else if (url.startsWith('gitlab:')) url = `https://gitlab.com/${url.slice('gitlab:'.length)}`
  else if (url.startsWith('bitbucket:')) url = `https://bitbucket.org/${url.slice('bitbucket:'.length)}`
  else if (url.startsWith('git+')) url = url.slice(4)
  url = url.replace(/^git:\/\//, 'https://').replace(/^ssh:\/\//, 'https://').replace(/^git@([^:]+):/, 'https://$1/')
  url = url.replace(/\.git$/, '')
  // Never carry credentials into a published index.
  url = url.replace(/^(https?:\/\/)[^/@]+@/, '$1')
  return /^https?:\/\//i.test(url) ? url : undefined
}

async function getJSON(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  return res.json()
}

async function candidateNames(packages, curated) {
  const names = new Set()
  for (const info of Object.values(packages.entries ?? {})) {
    for (const pkg of info.packages ?? []) {
      const source = String(pkg.source ?? '')
      if (source.startsWith('npm:')) names.add(source.slice(4))
      else if (pkg.install && !source && !/[:\/]/.test(pkg.install)) names.add(pkg.install)
    }
  }
  for (const query of ['dsh-plugin', 'deepseek-harness']) {
    const body = await getJSON(`${REG}-/v1/search?text=${encodeURIComponent(query)}&size=250`)
    for (const item of body.objects ?? []) names.add(item.package.name)
  }
  for (const repo of Object.keys(curated.category_overrides ?? {})) names.add(repo)
  return names
}

async function fetchBundle(name) {
  let pack
  try {
    pack = await getJSON(`${REG}${name.replace('/', '%2F')}`)
  } catch { return undefined }
  const versions = pack.versions ?? {}
  const times = pack.time ?? {}
  const qualifying = []
  for (const [version, manifest] of Object.entries(versions)) {
    if (manifest?.deprecated) continue
    if (!manifest?.dsh?.bundle?.patch) continue
    const timestamp = times[version]
    if (!timestamp) continue
    const item = {
      version,
      publishTimestamp: Math.floor(Date.parse(timestamp) / 1000),
      source: { type: 'npm', registry: REG },
    }
    const range = manifest?.engines?.dsh
    if (typeof range === 'string' && range) item.engines = { dsh: range }
    qualifying.push(item)
  }
  if (!qualifying.length) return undefined
  qualifying.sort((a, b) => b.publishTimestamp - a.publishTimestamp)
  // The host fetch timeout is 15 s: keep the index small and list recent versions only.
  qualifying.splice(MAX_VERSIONS)
  const latest = versions[qualifying[0].version] ?? {}
  const repo = latest.repository
  const repository = typeof repo === 'string'
    ? { url: repo }
    : (repo?.url ? { url: repo.url, ...(repo.directory ? { directory: repo.directory } : {}) } : undefined)
  const author = typeof latest.author === 'string' ? latest.author : latest.author?.name
  const entry = { name: pack.name, versions: qualifying }
  if (latest.description) entry.description = latest.description
  const homepage = httpUrl(latest.homepage)
  if (homepage) entry.homepage = homepage
  if (repository) entry.repository = { url: httpUrl(repository.url), ...(repository.directory ? { directory: repository.directory } : {}) }
  if (entry.repository && !entry.repository.url) delete entry.repository
  if (author) entry.author = author
  return entry
}

function classify(entry, repoOverrides) {
  const key = repoKey(entry.repository?.url ?? entry.homepage)
  const override = key ? repoOverrides[key] : undefined
  if (override && CATEGORY_ALIAS[override]) return CATEGORY_ALIAS[override]
  const haystack = `${entry.name} ${entry.title ?? ''} ${entry.description ?? ''}`.toLowerCase()
  for (const [category, pattern] of KEYWORDS) if (pattern.test(haystack)) return category
  return 'other'
}

const [upstream, packages, curated] = await Promise.all([
  getJSON(`${UPSTREAM}/dsh-market-index.json`),
  getJSON(`${UPSTREAM}/packages.json`),
  getJSON(`${UPSTREAM}/curated.json`),
])

const { mkdir, readFile: readCache } = await import('node:fs/promises')
let scanned
try {
  scanned = JSON.parse(await readCache('.cache/scan.json', 'utf8'))
  console.error(`scan cache: ${scanned.length} bundles (delete .cache/scan.json to refresh)`)
} catch {
  const names = await candidateNames(packages, curated)
  console.error(`candidates: ${names.size}`)
  scanned = []
  let done = 0
  let queue = []
  for (const name of names) {
    queue.push(fetchBundle(name).then((entry) => { if (entry) scanned.push(entry) }).finally(() => { if (++done % 100 === 0) console.error(`scanned ${done}/${names.size}`) }))
    if (queue.length >= CONCURRENCY) { await Promise.all(queue); queue = [] }
  }
  await Promise.all(queue)
  await mkdir('.cache', { recursive: true })
  await writeFile('.cache/scan.json', JSON.stringify(scanned))
}

const byName = new Map(scanned.map((entry) => [entry.name, entry]))
const merged = []
for (const entry of upstream.plugins) {
  const local = byName.get(entry.name)
  const base = { ...entry }
  if (!base.description && local?.description) base.description = local.description
  if (!base.repository && local?.repository) base.repository = local.repository
  if (!base.homepage && local?.homepage) base.homepage = local.homepage
  if (!base.author && local?.author) base.author = local.author
  if (!Array.isArray(base.versions) || !base.versions.length) base.versions = local?.versions ?? []
  merged.push(base)
  byName.delete(entry.name)
}
for (const entry of byName.values()) merged.push(entry)

// The host fetch timeout is 15 s: keep every plugin's recent versions only.
for (const entry of merged) {
  entry.versions = [...entry.versions]
    .sort((a, b) => b.publishTimestamp - a.publishTimestamp)
    .slice(0, MAX_VERSIONS)
}

// Categories and Chinese text.
const overrides = curated.category_overrides ?? {}
const descriptions = curated.description_overrides ?? {}
const categories = {}
const counts = {}
for (const entry of merged) {
  const key = repoKey(entry.repository?.url ?? entry.homepage)
  const zh = key ? descriptions[key] : undefined
  const title = entry.title
  const enTitle = typeof title === 'string' && title ? title : (typeof title === 'object' ? title.en : entry.name)
  const enDesc = typeof entry.description === 'string'
    ? entry.description
    : (typeof entry.description === 'object' ? entry.description.en : undefined)

  const known = ZH[entry.name]
  if (known) {
    entry.title = { en: enTitle, zh: known[0] }
    entry.description = { en: enDesc ?? entry.name, zh: known[1] }
  } else {
    if (typeof title === 'string' && title !== entry.name) entry.title = { en: title }
    if (enDesc && zh) entry.description = { en: enDesc, zh }
    else if (typeof entry.description === 'object' && !entry.description.en && enDesc) entry.description = { en: enDesc }
  }

  const category = classify(entry, overrides)
  entry.metadata = { ...(entry.metadata ?? {}), category }
  counts[category] = (counts[category] ?? 0) + 1
  categories[category] = { title: { en: CATEGORIES[category][1], zh: CATEGORIES[category][0] } }
}

const index = {
  format: 1,
  title: { en: 'DSH Community Market (Chinese)', zh: 'DSH 社区市场（中文）' },
  description: {
    en: 'Community DSH plugin index with Chinese labels: verified npm bundle metadata, categories, and localized descriptions where available.',
    zh: '社区 DSH 插件索引（中文）：已核实的 npm bundle 元数据、分类，以及可获得的中文描述。',
  },
  metadata: { categories },
  plugins: merged.sort((a, b) => a.name.localeCompare(b.name)),
}

await writeFile('index.json', `${JSON.stringify(index, null, 2)}\n`)
console.error(JSON.stringify({ plugins: merged.length, versions: merged.reduce((n, e) => n + e.versions.length, 0), categories: counts }, null, 1))
