#!/usr/bin/env python3
"""Rebuild index.json from the upstream public DSH community index.

Only LocalizedText fields (`title`, `description`) are extended with `zh`;
every machine-readable field is copied unchanged from upstream.
"""
import json
import urllib.request

UPSTREAM = 'https://raw.githubusercontent.com/bruc3van/awesome-dsh-plugin/main/data/dsh-market-index.json'
OUT = 'index.json'

ZH = {
    'dsh-opencode-go': ('OpenCode Go 模型提供方', '为 DeepSeek Harness 接入 OpenCode Go 模型，并带设置界面。'),
    'dsh-auto-review': ('AI 自动审批复核', '用第二个模型自动复核 DSH 的审批请求：只读的复核子代理在审批链上给出允许/拒绝，失败即拒绝，并完整审计会话日志。'),
    'dsh-vision-router': ('视觉路由：给纯文本模型装眼睛', '为纯文本 DSH 代理提供内置免费视觉链与像素级工具；除严格本地模式外，图片会发送给远程视觉提供方（默认走免费回退）。'),
    'dsh-permission-rules': ('权限规则 + 网络策略', 'Claude Code 风格的声明式权限规则与 Codex 风格的进程级网络策略：按工具名、参数（glob/正则）、工作区路径、网络目标（域名/IP/端口/协议）有序匹配 allow/deny/ask。'),
    'dsh-research-report': ('可验证研究报告', '内容寻址的证据账本（声明与快照绑定、防篡改）加带版本封存报告；每条声明都有验证结论，清单哈希封住整个目录。'),
    'dsh-industry-research': ('行业与公司研究包', '行业/公司研究领域包：方法论技能、产业链结构模型（industry_map）、公开源政策与新闻跟踪（industry_track）、公司扫描卡（company_scan）与可审计研究流程。'),
    'dsh-im-companion': ('IM 助理伴侣', '以「助理」和「家」的概念增强 dsh-im：哪个工作区有助理在管、在不在线一目了然，搬家拖一下即可。'),
    'dsh-plugin-bridge': ('跨预设会话迁移', '可预览的跨预设会话迁移，交接内容有界、schema 固定。'),
    'dsh-undo-savepoint': ('撤销 / 回滚存档点', 'DSH 撤销与回滚系统：配置变更即快照，可在 WebUI 或对话里撤销/重做上一步，插件树坏了也能回滚而无需重装；DSH 起不来时同样可用（离线 CLI + GUI）。'),
    'dsh-gitbash-shell': ('Windows Git Bash 执行器', '在 Windows 上给代理一个真正的 Git Bash 命令工具：私有 Git Bash 执行器实例（官方 PowerShell 执行器原样保留），统一 MSYS 盘根路径方言，官方 pwsh 工具默认隐藏可开关，物化四个内置预设的 Git Bash 变体，侧栏终端接管可开关。'),
    'dsh-checkpoint-rewind': ('统一检查点与回滚', '会话 + 工作区 + 配置三态快照与一键回滚：/checkpoint、/rewind 命令、检查点工具、定时快照、带逐对差异的设置页时间线，以及会话种子重放。'),
    'dsh-fund-research': ('公募基金研究', '中国公募基金研究插件：从公开源（天天基金 / 东方财富）采集基金数据，计算确定性指标（经理画像、持仓穿透、风格归因、业绩拆解）。'),
    '@mars-sea/dsh-commandcode-provider': ('Command Code 模型提供方', '非官方 Command Code 模型提供方插件（移植自 pi-commandcode-provider，MIT）：注册 commandcode 提供方路由，带模型页卡片与实时模型目录。'),
    'dsh-plugin-teamflow': ('TeamFlow 团队研发流水线', '需求→PRD→设计→架构→技术方案→并行开发→QA→验收的团队研发流水线（TypeScript）；backlog 持久化、断点续跑、完成汇报、防假交付，带 Web 团队工作台（会话视图页 + 拖拽看板）。'),
    'dsh-lsp-actions': ('LSP 动作集', '为 DSH 提供 LSP 动作面：诊断、格式化、补全、代码动作、符号、签名帮助、内联提示与重命名，以及让插件成为 IDE 集成点的编辑器动作协议（lsp.actions.*）。'),
    'dsh-session-sync': ('会话跨设备同步', '会话库的专用 git 镜像，追加式三方合并（保留双方 + 分叉冲突解决），带 /sync 命令、sync_pull/sync_push/sync_status 工具与可配置的自动推拉。'),
    'dsh-xdpool': ('模型额度池', '把所有免费额度合成一个 DSH 模型池：本地已登录的 WorkBuddy 账号自动故障转移、13 家厂商扫码/网页登录、聚合 76 家厂商免费额度，另有用量面板、模型路由与本地 OpenAI 兼容网关。'),
    '@xiaoyuyu6420/dsh-backup': ('DSH 全量备份 / 迁移', '一条命令备份、恢复与迁移 DSH 全部数据（~/.dsh：会话、设置、插件、MCP、技能）：定时自动备份、升级前快照、换机迁移、会话日志体检修复、宿主起不来也能进程外救援；凭据默认脱敏只存本机。'),
    'dsh-qoder-connect': ('Qoder 模型接入', '把 Qoder（国内版 / 国际版）的模型接入 DeepSeek Harness。'),
    'dsh-md-notes': ('Markdown 笔记', 'Markdown 笔记管理器与编辑器：把对话内容快速存成笔记，并可同步到 Git 仓库维护。'),
    'dsh-output-styles': ('输出风格切换', '等价于 Claude Code outputStyles 的运行时输出风格切换。'),
    'dsh-translate': ('参数翻译与 JSON 修复', '厂商参数翻译加确定性 JSON 修复：/translate 命令在 11 家厂商间映射 temperature/top_p/max_tokens/stop/system；tools/post-execute 修复层（含 fix_json 工具）修好坏 JSON。'),
    'dsh-zotero': ('Zotero 文献助手', '让代理搜索、阅读并引用本地 Zotero 库：找论文、看笔记与批注、按问题取证据、打开原文、生成引用。'),
    'dsh-mattpocock-skills-deck': ('mattpocock 技能包', '安装即自带 mattpocock/skills v1.3.1 的 27 个工程与效率技能，无需手动安装。'),
    'dsh-agent-message': ('跨会话 Agent 通信', '让 DSH 里不同的 Agent 会话互相收发消息。'),
    'dsh-library': ('本地文档知识库', '本地文档知识库：library_add/remove/list、语义 + 关键词混合检索（多样性重排、相关度过滤、避免中段丢失）、引用感知注入与引用校验。'),
    'memory-eternal': ('记忆核心 Memory Eternal', '自研 DSH 记忆插件：对话结束后自动沉淀知识卡到本地 Markdown Vault（自研去重、CJK 检索、可 git 管理），设置页提供图形化知识库（统计 / 搜索 / 知识图谱 + 侧栏弹窗），代理通过 memory_recall 按需召回。'),
    'dsh-memento': ('分层跨会话记忆', '有界、分层、审批门控、可审计的跨会话记忆：ctx.memory 服务 + 本地 SQLite 提供方 + memory 工具 + 冻结快照注入。'),
    'dsh-vision-proxy': ('视觉代理：图片先转文字', 'DeepSeek 大脑加自动图片转写：deepseek-vision 提供方路由先把附件图片转成文本，再交给纯文本适配器；默认使用官方 deepseek-v4-flash-vision-exp。'),
    'dsh-mcp-panel': ('MCP 管理台', '官方 MCP 客户端的控制台：/mcp 命令（健康诊断、管线试调），设置里的 MCP 标签页可增删改服务器（追加式 profile patch 片段、审批门控写入并自动备份）。'),
    'dsh-pdf-mineru': ('MinerU 文档解析', '基于 MinerU 的、与提供方无关的 DSH 文档解析：原生后台任务、不可变结果、安全的请求合并。'),
    '@yangdcm/dsh-expert-team': ('专家团：多智能体团队', '一句自然语言组建角色化多智能体「数字员工」团队，按九阶段门控流水线协作交付，实现者直接改代码并产出持久工件；带实时团队浮层。'),
    'dsh-doublecheck': ('交付质量门禁', '交付质量门禁：拷问需求、测试实现、证明交付，用「可交付 / 返工」决策把住交接。'),
}


def main() -> None:
    with urllib.request.urlopen(UPSTREAM, timeout=30) as response:
        index = json.load(response)
    if index.get('format') != 1 or not isinstance(index.get('plugins'), list):
        raise SystemExit('upstream index is not format 1')

    missing = []
    for plugin in index['plugins']:
        name = plugin['name']
        title, description = plugin.get('title'), plugin.get('description')
        en_title = title if isinstance(title, str) and title else name
        en_desc = description if isinstance(description, str) and description else ''
        if name in ZH:
            zh_title, zh_desc = ZH[name]
            plugin['title'] = {'en': en_title, 'zh': zh_title}
            plugin['description'] = {'en': en_desc, 'zh': zh_desc}
        else:
            missing.append(name)
            if isinstance(title, str) and title:
                plugin['title'] = {'en': title}
            if isinstance(description, str) and description:
                plugin['description'] = {'en': description}

    index['title'] = {
        'en': 'DSH Community Market (Chinese)',
        'zh': 'DSH 社区市场（中文）',
    }
    index['description'] = {
        'en': 'Chinese localization of the public DSH community market index; machine-readable fields are unchanged from upstream.',
        'zh': 'DSH 社区市场公开索引的中文版；除标题与描述外，其余字段与上游完全一致。',
    }

    with open(OUT, 'w', encoding='utf-8') as handle:
        json.dump(index, handle, ensure_ascii=False, indent=2)
        handle.write('\n')

    print(json.dumps({
        'plugins': len(index['plugins']),
        'localized': len(index['plugins']) - len(missing),
        'untranslated': missing,
    }, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
