##由模版制作的个人网页##

## 本地预览与内容维护 / Preview and content maintenance

在仓库根目录运行 / Run from the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

访问 / Open `http://127.0.0.1:8000/`。内容通过 HTTP 加载，请勿使用 `file://` 直接打开。 / Content loads over HTTP; do not open the page with `file://`.

- `contents/zh/`：中文正文与界面配置。 / Chinese content and interface labels.
- `contents/en/`：英文正文与界面配置。 / English content and interface labels.
- `contents/publications.md`：两种语言共用的发表列表，保留原文。 / Shared publication list, retained in its original language.
- 每个语言目录中的 `config.yml` 保存纯文本标题、导航和页脚文案，正文使用同名 Markdown 文件对应。 / Each language has a `config.yml` for plain-text interface labels and matching Markdown files for section content.

导航栏的“中文 / EN”按钮切换整页语言。首次访问按浏览器首选语言选择中文或英文，之后记住选择；浏览器禁用本地存储时仍可切换。 / The navigation's “中文 / EN” buttons switch the page language. The first visit uses the browser's preferred language (Chinese or English); later visits remember the selection when local storage is available.
