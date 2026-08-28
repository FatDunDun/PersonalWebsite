export const siteSettings = {
  "schemaVersion": 2,
  "ui": {
    "activePreset": "classic",
    "presets": {
      "classic": {
        "displayName": "经典沉浸版",
        "settingsVersion": 1,
        "appearance": {
          "homeHero": {
            "backgroundImage": "https://pub-f391fe6f8e924935bcda42a0b88e5143.r2.dev/personal-photo/1782816543016-bg-marrird-01-2d81aa84.jpg",
            "focalPoint": "center center"
          }
        }
      },
      "editorial": {
        "displayName": "暖调编辑版",
        "settingsVersion": 1,
        "appearance": {
          "homeHero": {
            "backgroundImage": "https://pub-f391fe6f8e924935bcda42a0b88e5143.r2.dev/personal-photo/1782816543016-bg-marrird-01-2d81aa84.jpg",
            "focalPoint": "center 34%"
          }
        }
      }
    }
  },
  "site": {
    "logoText": "M",
    "name": "FatDuoDuo",
    "title": "偷走时间留住你",
    "description": "一个用 Astro、TypeScript 和 Tailwind CSS 写成的个人数字花园，保存文章、影像、推荐和代码实验。",
    "author": "FatDuoDuo",
    "ogImage": "/personal-photo/hero.png",
    "footerNote": "Built with Astro."
  },
  "home": {
    "badge": "notebook for human feelings and machine logic",
    "headline": "也许人是,最不彻底的,海过了一夜还是蓝色.",
    "intro": "文章像注释，影像像断点，项目像一次次重构。这里不是展示橱窗，而是一间持续生长的工作室：把生活里的微光写下来，也把工程里的秩序留下来。",
    "primaryButton": {
      "label": "阅读手记",
      "href": "/articles/"
    },
    "secondaryButton": {
      "label": "查看推荐",
      "href": "/recommendations/"
    },
    "codePath": "~/field/archive",
    "codeFile": "daily.ts",
    "codeLines": [
      {
        "label": "type",
        "value": "Memory = \"文字\" | \"影像\" | \"代码\" | \"偏爱\""
      },
      {
        "label": "loop",
        "value": "observe → write → ship → remember"
      },
      {
        "label": "made_with",
        "value": "Astro · TypeScript · Tailwind"
      }
    ],
    "marginKicker": "Margin note",
    "marginNumber": "No. 01",
    "marginTitle": "写作是给经验命名，编程是给混乱建立接口。",
    "marginDescription": "所有页面都先服务于长期保存：能被找到，能被修改，能在几年后仍然读得懂。漂亮不是目的，能留下来才是。"
  },
  "anniversary": {
    "label": "When Begin",
    "title": "和西伯利亚无敌飞天棒棒猪已经在一起",
    "startAt": "2024-01-20T20:00:00+08:00"
  },
  "pages": {
    "articles": {
      "kicker": "Journal / field notes",
      "title": "留忆",
      "description": "面向长期维护的 Markdown/MDX 文章索引。记录技术复盘、产品想法、读书笔记和一些个人观察。"
    },
    "gallery": {
      "kicker": "Frames / captured light",
      "title": "片刻",
      "description": "以网格方式保存图片样本。默认呈现原始色彩，适合照片、日常记录和视觉作品的长期整理。"
    },
    "videos": {
      "kicker": "PersonalVideo / moving frames",
      "title": "悦动",
      "description": "用短视频保存日常、旅行和 vlog 片段。适合压缩后的 MP4 或 WebM，让动态记忆也能长期整理。"
    },
    "recommendations": {
      "kicker": "Taste / private index",
      "title": "偏爱",
      "description": "把长期喜欢、反复回看或想郑重推荐的书籍、影视、歌曲和游戏放在这里。它不是榜单，更像一份慢慢变化的个人品味索引。"
    },
    "about": {
      "kicker": "Profile / archive owner",
      "title": "Micy",
      "description": "写作、影像、前端工程和小型工具爱好者。",
      "image": "/personal-photo/gallery-workspace.png",
      "imageAlt": "桌面上的笔记和咖啡",
      "role": "前端工程师 / 内容系统维护者",
      "company": "可在管理页填写公司",
      "email": "hello@example.com",
      "location": "China",
      "summary": [
        "我长期关注内容系统、前端体验和个人工具，把写作、整理、发布和自动化连接成一套稳定的工作流。",
        "这个页面可以作为公开简历使用：展示当前身份、公司、联系方式、擅长方向和想被记住的个人介绍。"
      ],
      "focus": [
        "内容系统：让写作、整理和发布更顺手。",
        "前端体验：界面层级、性能、动效克制和可维护性。",
        "个人工具：把重复的小事变成可靠的自动化。"
      ],
      "links": [
        {
          "label": "GitHub",
          "href": "https://github.com/FatDunDun"
        }
      ]
    }
  },
  "nav": [
    {
      "href": "/",
      "label": "首页",
      "visible": true
    },
    {
      "href": "/articles/",
      "label": "文章",
      "visible": true
    },
    {
      "href": "/gallery/",
      "label": "图集",
      "visible": true
    },
    {
      "href": "/videos/",
      "label": "视频",
      "visible": true
    },
    {
      "href": "/recommendations/",
      "label": "推荐",
      "visible": true
    },
    {
      "href": "/projects/",
      "label": "项目",
      "visible": true
    },
    {
      "href": "/about/",
      "label": "关于",
      "visible": true
    }
  ]
};
