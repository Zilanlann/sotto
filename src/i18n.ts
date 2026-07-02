export type Locale = "zh" | "en";

export const COPY = {
  zh: {
    pageTitle: "Sotto — 端到端加密的阅后即焚文本分享",
    nav: {
      tagline: "端到端加密 · 临时分享",
      noServerLogs: "无服务端日志",
      newPaste: "新建",
      about: "关于",
    },
    theme: {
      aria: "切换主题",
      toLight: "切换到浅色",
      toDark: "切换到深色",
    },
    locale: {
      aria: "切换语言",
      toggleLabel: "EN",
      tooltip: "Switch to English",
    },
    footer: {
      model: "sotto · 端到端加密 · 服务端只存密文",
      keyStays: "密钥永远留在浏览器",
    },
    create: {
      badge: "端到端加密 · 零知识",
      titleStart: "端到端加密的",
      titleHighlight: "临时分享",
      description:
        "内容在浏览器本地以 AES-256-GCM 加密后才上传，密钥仅存于链接的 # 片段、不经服务端。零知识架构确保我们无法访问你的明文。",
      editorTitle: "编写内容",
      editorDescription: "支持 Markdown，保存前会在本地完成加密。",
      editorModeLabel: "编辑模式",
      edit: "编辑",
      preview: "预览",
      pasteAria: "Paste 内容",
      placeholder: "粘贴要临时分享的内容...",
      noPreview: "暂无 Markdown 预览",
      usageAria: "内容大小占用",
      usedSpace: "已用空间",
      quickCreate: "快速创建",
      settingsTitle: "发布设置",
      settingsDescription: "生成后不可编辑，只能重新创建。",
      expiryLabel: "过期时间",
      expiryOptions: {
        "10m": "10分钟",
        "1h": "1小时",
        "1d": "1天",
        "7d": "7天",
        custom: "自定义",
      },
      customMinutesLabel: "自定义分钟数",
      customMinutesDescription: "单位：分钟。最长 30 天，前后端都会校验。",
      burnLabel: "阅后即焚",
      burnDescription: "首次解锁的同时，服务器立即销毁副本。",
      passwordLabel: "访问密码",
      passwordDescription: "密码只参与本地密钥派生。",
      passwordFieldLabel: "密码",
      passwordPlaceholder: "至少 4 位",
      passwordTooShort: "密码至少 4 位。",
      passwordHelp: "不会上传到服务端。",
      createErrorTitle: "无法创建",
      errors: {
        invalid: "内容为空、超过大小限制，或密码少于 4 位。",
        crypto: "当前浏览器无法完成加密，请确认支持 Web Crypto。",
        remote: "密文无法保存，请稍后重试。",
      },
      submit: "加密并生成链接",
    },
    share: {
      title: "链接已就绪",
      description: "密钥位于 # 片段，后端不会收到。",
      copy: "复制链接",
      copied: "链接已复制到剪贴板",
      open: "打开",
    },
    privacy: {
      title: "隐私模型",
      items: [
        "只保存密文、IV、过期时间、访问策略和阅后即焚的领取校验哈希。",
        "不提供公开列表、搜索或服务端预览。",
        "解密密钥仅存在于链接片段，不入库、不进日志。",
      ],
    },
    view: {
      title: "查看 Paste",
      description: "需要主动解锁，避免链接预览误触发阅后即焚。",
      ciphertext: "密文",
      burn: "阅后即焚",
      readyTitle: "加密内容已就绪",
      passwordPrompt: "输入密码后将在本地解密，密码不会发送给后端。",
      unlockPrompt: "点击解锁后将在本地完成解密。",
      passwordLabel: "访问密码",
      passwordPlaceholder: "输入密码",
      passwordHelp: "密码不会发送给后端。",
      burnUnlockNotice: "阅后即焚：解锁的同时服务器会销毁副本，内容仅能查看这一次。",
      unlockErrorTitle: "无法解锁",
      unlockErrorDescription: "密码错误、密钥不匹配，或内容无法解密。",
      destroyedCopyTitle: "服务器副本已销毁",
      destroyedCopyDescription: "刷新或再次打开这个链接会进入已销毁状态。",
      viewModeLabel: "查看方式",
      preview: "预览",
      raw: "原文",
      copyContent: "复制内容",
      copiedContent: "已复制解密后的内容",
      copyContentTooltip: "复制解密后的文本",
      createNew: "创建新的 Paste",
      unlock: "解锁查看",
    },
    terminal: {
      expiredTitle: "内容已过期",
      expiredWithDate: (date: string) => `这个 Paste 在 ${date} 过期。`,
      expiredFallback: "链接已失效。",
      destroyedTitle: "内容已被销毁",
      destroyedDescription: "这个 Paste 启用了阅后即焚，服务器副本已经删除。",
      missingTitle: "找不到内容",
      missingDescription: "Paste 不存在，或已被删除。",
      badLinkTitle: "链接缺少解密材料",
      badLinkDescription: "URL 片段中没有可用密钥，服务端也不会保存密钥。",
      errorTitle: "无法解锁",
      errorDescription: "密钥或密码不匹配。",
      back: "返回创建页",
    },
    toast: {
      created: "加密链接已生成",
      createdDescription: "密钥已写入 # 片段，不会发往服务端。",
      createdLocalDescription: "后端暂不可用，密文已保存在当前浏览器（开发模式回退），链接无法跨浏览器访问。",
      copyFailed: "复制失败，请手动选择文本。",
    },
    about: {
      pageTitle: "关于 Sotto · 零知识加密如何工作",
      badge: "关于 Sotto",
      titleStart: "Sotto 如何守护",
      titleHighlight: "你的秘密",
      intro:
        "Sotto（取自意大利语 sotto voce，「低声耳语」）是一个端到端加密的临时文本分享工具。所有加密和解密都在你的浏览器里完成，服务器从头到尾只见过密文；链接到期后内容自动消失，启用阅后即焚时更是读取一次即销毁，就像一句说完就散的悄悄话。",
      howItWorks: {
        title: "工作原理",
        steps: [
          {
            title: "浏览器内加密",
            description:
              "点击创建时，内容先在本地用 Web Crypto 生成的随机密钥完成 AES-256-GCM 加密，明文从不离开你的设备。",
          },
          {
            title: "服务器只存密文",
            description:
              "上传的只有密文、初始化向量和过期策略。存储层到期自动删除，没有公开列表、搜索或服务端预览。",
          },
          {
            title: "密钥藏在链接里",
            description:
              "解密密钥写在链接的 # 片段中。浏览器不会把 # 之后的内容发给服务器，只有拿到完整链接的人才能解密。",
          },
        ],
      },
      features: {
        title: "核心功能",
        items: [
          {
            title: "阅后即焚",
            description: "首次解锁的同时，服务器通过一次性领取接口销毁存储副本，适合传递一次性凭证。",
          },
          {
            title: "密码保护",
            description: "密码只参与本地密钥派生（PBKDF2 + HKDF），从不上传，为链接再加一道防线。",
          },
          {
            title: "自动过期",
            description: "从 10 分钟到最长 30 天，到期即由存储层自动删除，无需手动清理。",
          },
          {
            title: "Markdown 渲染",
            description: "支持 Markdown 编写与预览，解密后在本地渲染并经过消毒处理。",
          },
        ],
      },
      storage: {
        title: "服务器知道什么",
        description: "零知识架构的意思是：即使数据库被完整拿走，攻击者得到的也只是一堆无法解密的密文。",
        storedTitle: "会保存",
        stored: ["密文与初始化向量", "过期时间与访问策略", "阅后即焚的领取校验哈希"],
        notStoredTitle: "永远不会保存",
        notStored: ["明文内容", "解密密钥或访问密码", "创建者或访问者的身份账号信息"],
      },
      faq: {
        title: "常见问题",
        items: [
          {
            question: "Sotto 能看到我分享的内容吗？",
            answer:
              "不能。内容在浏览器内加密后才上传，解密密钥只存在于链接的 # 片段，浏览器从不把它发送给服务器。即使数据库被完整泄露，泄露的也只是密文。",
          },
          {
            question: "阅后即焚是如何实现的？",
            answer:
              "启用阅后即焚的密文需要通过一次性领取接口解锁：服务器校验领取凭证后返回密文，并在同一时刻销毁存储副本。解锁需要在页面内主动点击，链接预览机器人不会误触发销毁。",
          },
          {
            question: "忘记密码或弄丢链接怎么办？",
            answer:
              "无法找回。零知识架构意味着服务器上既没有密钥也没有密码，任何人（包括运营者）都无法替你解密，只能重新创建一个分享。",
          },
          {
            question: "内容最长保存多久？",
            answer:
              "最长 30 天。可选择 10 分钟、1 小时、1 天、7 天等快捷时长，或自定义分钟数；到期后由存储层自动删除。",
          },
          {
            question: "Sotto 和普通 Pastebin 有什么区别？",
            answer:
              "普通 Pastebin 把明文存在服务器上，运营方和任何入侵者都能直接阅读。Sotto 的服务器只存密文，隐私不依赖运营方的承诺，而由密码学保证。",
          },
        ],
      },
      cta: {
        title: "试试看",
        description: "不需要注册，粘贴内容就能生成一条会自动消失的加密链接。",
        button: "创建加密分享",
      },
    },
  },
  en: {
    pageTitle: "Sotto — End-to-End Encrypted Self-Destructing Pastebin",
    nav: {
      tagline: "End-to-end encrypted · Temporary sharing",
      noServerLogs: "No server logs",
      newPaste: "New",
      about: "About",
    },
    theme: {
      aria: "Toggle theme",
      toLight: "Switch to light",
      toDark: "Switch to dark",
    },
    locale: {
      aria: "Switch language",
      toggleLabel: "中",
      tooltip: "切换到中文",
    },
    footer: {
      model: "sotto · end-to-end encrypted · server stores ciphertext only",
      keyStays: "Keys stay in your browser",
    },
    create: {
      badge: "End-to-end encrypted · Zero knowledge",
      titleStart: "End-to-end encrypted ",
      titleHighlight: "temporary sharing",
      description:
        "Content is encrypted locally in your browser with AES-256-GCM before upload. The key only lives in the URL # fragment and never reaches the server, so the zero-knowledge model keeps plaintext inaccessible to us.",
      editorTitle: "Compose Content",
      editorDescription: "Supports Markdown and encrypts locally before saving.",
      editorModeLabel: "Editor mode",
      edit: "Edit",
      preview: "Preview",
      pasteAria: "Paste content",
      placeholder: "Paste content to share temporarily...",
      noPreview: "No Markdown preview yet",
      usageAria: "Content size usage",
      usedSpace: "Used",
      quickCreate: "Quick create",
      settingsTitle: "Publish Settings",
      settingsDescription: "Generated links cannot be edited. Create a new one instead.",
      expiryLabel: "Expiration",
      expiryOptions: {
        "10m": "10 min",
        "1h": "1 hour",
        "1d": "1 day",
        "7d": "7 days",
        custom: "Custom",
      },
      customMinutesLabel: "Custom minutes",
      customMinutesDescription: "Unit: minutes. Maximum 30 days, validated on both client and backend.",
      burnLabel: "Burn after reading",
      burnDescription: "The server destroys its copy the moment the paste is first unlocked.",
      passwordLabel: "Access password",
      passwordDescription: "Password only participates in local key derivation.",
      passwordFieldLabel: "Password",
      passwordPlaceholder: "At least 4 characters",
      passwordTooShort: "Password must be at least 4 characters.",
      passwordHelp: "Never uploaded to the server.",
      createErrorTitle: "Cannot create",
      errors: {
        invalid: "Content is empty, over the size limit, or the password is shorter than 4 characters.",
        crypto: "This browser cannot complete encryption. Check Web Crypto support.",
        remote: "Ciphertext could not be saved. Please try again later.",
      },
      submit: "Encrypt and generate link",
    },
    share: {
      title: "Link ready",
      description: "The key is in the # fragment, so the backend never receives it.",
      copy: "Copy link",
      copied: "Link copied to clipboard",
      open: "Open",
    },
    privacy: {
      title: "Privacy Model",
      items: [
        "Only ciphertext, IV, expiration, access policy, and a burn-claim verification hash are stored.",
        "No public listing, search, or server-side preview.",
        "The decryption key only exists in the URL fragment: not stored, not logged.",
      ],
    },
    view: {
      title: "View Paste",
      description: "Unlock manually to avoid link previews triggering burn-after-reading.",
      ciphertext: "Ciphertext",
      burn: "Burn after reading",
      readyTitle: "Encrypted content is ready",
      passwordPrompt: "Enter the password to decrypt locally. The password is never sent to the backend.",
      unlockPrompt: "Click unlock to decrypt locally in your browser.",
      passwordLabel: "Access password",
      passwordPlaceholder: "Enter password",
      passwordHelp: "Password is never sent to the backend.",
      burnUnlockNotice: "Burn after reading: unlocking destroys the server copy at the same time, so this is your only view.",
      unlockErrorTitle: "Cannot unlock",
      unlockErrorDescription: "Wrong password, mismatched key, or content cannot be decrypted.",
      destroyedCopyTitle: "Server copy destroyed",
      destroyedCopyDescription: "Refreshing or reopening this link will show it as destroyed.",
      viewModeLabel: "View mode",
      preview: "Preview",
      raw: "Raw",
      copyContent: "Copy content",
      copiedContent: "Decrypted content copied",
      copyContentTooltip: "Copy decrypted text",
      createNew: "Create new Paste",
      unlock: "Unlock",
    },
    terminal: {
      expiredTitle: "Content expired",
      expiredWithDate: (date: string) => `This Paste expired at ${date}.`,
      expiredFallback: "The link has expired.",
      destroyedTitle: "Content destroyed",
      destroyedDescription: "This Paste had burn-after-reading enabled, and the server copy has been deleted.",
      missingTitle: "Content not found",
      missingDescription: "The Paste does not exist or has already been deleted.",
      badLinkTitle: "Missing decryption material",
      badLinkDescription: "The URL fragment has no usable key, and the server does not store keys.",
      errorTitle: "Cannot unlock",
      errorDescription: "Key or password does not match.",
      back: "Back to create",
    },
    toast: {
      created: "Encrypted link generated",
      createdDescription: "The key was written to the # fragment and will not be sent to the server.",
      createdLocalDescription:
        "The backend is unavailable, so the ciphertext was saved in this browser only (dev fallback). The link cannot be opened in other browsers.",
      copyFailed: "Copy failed. Please select the text manually.",
    },
    about: {
      pageTitle: "About Sotto · How Zero-Knowledge Encryption Works",
      badge: "About Sotto",
      titleStart: "How Sotto keeps ",
      titleHighlight: "your secrets safe",
      intro:
        "Sotto (from the Italian sotto voce, “in a whisper”) is an end-to-end encrypted tool for sharing text temporarily. Encryption and decryption happen entirely in your browser — the server only ever sees ciphertext. Content disappears when the link expires — and with burn after reading enabled, the moment it is first read — like a whisper that fades.",
      howItWorks: {
        title: "How it works",
        steps: [
          {
            title: "Encrypted in your browser",
            description:
              "When you hit create, the content is encrypted locally with AES-256-GCM using a random key from Web Crypto. Plaintext never leaves your device.",
          },
          {
            title: "The server stores ciphertext only",
            description:
              "Only the ciphertext, initialization vector, and expiry policy are uploaded. Storage deletes entries automatically on expiry — no public listing, search, or server-side preview.",
          },
          {
            title: "The key lives in the link",
            description:
              "The decryption key is written into the URL # fragment. Browsers never send anything after the # to the server, so only someone with the full link can decrypt.",
          },
        ],
      },
      features: {
        title: "Core features",
        items: [
          {
            title: "Burn after reading",
            description:
              "The first unlock destroys the server copy through a one-time claim endpoint — ideal for one-off credentials.",
          },
          {
            title: "Password protection",
            description:
              "The password only participates in local key derivation (PBKDF2 + HKDF) and is never uploaded, adding a second line of defense to the link.",
          },
          {
            title: "Automatic expiry",
            description: "From 10 minutes up to 30 days — storage deletes expired entries automatically, no cleanup needed.",
          },
          {
            title: "Markdown rendering",
            description: "Write and preview Markdown; decrypted content is rendered locally and sanitized.",
          },
        ],
      },
      storage: {
        title: "What the server knows",
        description:
          "Zero-knowledge means that even if the entire database were stolen, an attacker would only hold undecryptable ciphertext.",
        storedTitle: "Stored",
        stored: ["Ciphertext and initialization vector", "Expiry time and access policy", "A burn-claim verification hash"],
        notStoredTitle: "Never stored",
        notStored: ["Plaintext content", "Decryption keys or access passwords", "Accounts or identity of authors and readers"],
      },
      faq: {
        title: "Frequently asked questions",
        items: [
          {
            question: "Can Sotto read what I share?",
            answer:
              "No. Content is encrypted in the browser before upload, and the decryption key only exists in the URL # fragment, which browsers never send to the server. Even a full database leak would expose nothing but ciphertext.",
          },
          {
            question: "How does burn after reading work?",
            answer:
              "Burn-protected ciphertext is released through a one-time claim endpoint: the server verifies the claim token, returns the ciphertext, and destroys its copy in the same moment. Unlocking requires an explicit click on the page, so link-preview bots cannot trigger the burn.",
          },
          {
            question: "What if I forget the password or lose the link?",
            answer:
              "It cannot be recovered. Zero-knowledge means the server holds neither the key nor the password, so nobody — including the operators — can decrypt it for you. Create a new paste instead.",
          },
          {
            question: "How long is content kept?",
            answer:
              "Up to 30 days. Pick a quick preset (10 minutes, 1 hour, 1 day, 7 days) or a custom duration in minutes; expired entries are deleted automatically by the storage layer.",
          },
          {
            question: "How is Sotto different from a regular pastebin?",
            answer:
              "A regular pastebin stores plaintext on the server, readable by operators and intruders alike. Sotto's server only ever stores ciphertext — your privacy rests on cryptography, not on an operator's promise.",
          },
        ],
      },
      cta: {
        title: "Try it out",
        description: "No sign-up needed — paste your content and get an encrypted, self-destructing link.",
        button: "Create an encrypted paste",
      },
    },
  },
} as const;

export type Copy = (typeof COPY)[Locale];
