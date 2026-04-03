# 小说家 - APK打包指南

## 方案一：在线打包（推荐，最快）

### 步骤1：部署到网上获取URL
1. 访问 [Netlify Drop](https://app.netlify.com/drop)
2. 将 `deploy` 文件夹拖入网页
3. 获得一个公开URL，如 `https://xxx.netlify.app`
4. **记住这个URL**

### 步骤2：在线生成APK
1. 访问 [WebIntoApp](https://www.webintoapp.com) 或 [AppsGeyser](https://appsgeyser.com)
2. 填入你的URL
3. 上传图标（用 icon.svg）
4. 填写应用名称：小说家
5. 点击生成，获得APK下载链接

---

## 方案二：使用GitHub Pages（免费稳定）

### 步骤1：创建GitHub仓库
1. 访问 https://github.com 并登录
2. 点击右上角 + → New repository
3. 名称填 `xiaoshuojia`
4. 选择 Public
5. 点击 Create repository

### 步骤2：上传文件
1. 在仓库页面点击 "uploading an existing file"
2. 将 deploy 文件夹中的 5 个文件全部拖入
3. 点击 Commit changes

### 步骤3：启用GitHub Pages
1. 进入仓库 → Settings → Pages
2. Source 选择 "Deploy from a branch"
3. Branch 选择 "main"，文件夹选 "/ (root)"
4. 点击 Save
5. 等待1-2分钟，获得URL如 `https://你的用户名.github.io/xiaoshuojia/`

### 步骤4：打包APK
用上面方案一的步骤2进行打包

---

## 方案三：本地Android Studio打包（完整专业）

### 需要的工具
- Android Studio（免费）
- Node.js（用于TWA打包）

### 快速方式：PWA Builder
1. 先用方案一或二获得公开URL
2. 访问 https://www.pwabuilder.com/
3. 输入你的URL
4. 点击 "Package for stores"
5. 选择 "Android"
6. 下载生成的APK

### 完整方式：Android Studio
1. 安装 Android Studio
2. File → New → New Project → Empty Activity
3. 在 app/src/main/assets 放入你的 web 文件
4. 使用 WebView 加载
5. Build → Build Bundle(s) / APK(s) → Build APK(s)

---

## 生成图标

如果你需要 PNG 格式图标：
```bash
# 安装 PIL
pip install pillow

# 运行图标生成
python generate_icons.py
```

---

## deploy 文件夹内容
```
deploy/
├── index.html    # 主页面
├── styles.css    # 样式文件
├── app.js       # 应用逻辑
├── manifest.json # PWA配置
├── sw.js        # Service Worker
├── icon.svg     # 应用图标（矢量）
└── README.md     # 本说明文件
```

---

## 注意事项

1. **AI功能需要公网访问**：如果用户在其他设备上使用，需要把AI代理服务器也部署到网上
2. **数据存储**：默认使用 localStorage，换设备后数据不同步
3. **苹果iOS**：上架App Store需要开发者账号，但可以用上述方式生成iOS安装包
