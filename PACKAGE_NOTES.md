# 打包说明

本项目打包时会排除：

- `local/`：本机管理员密码
- `tools/`：PocketBase 二进制和数据库
- `external/`：外部开源项目源码克隆目录
- `*.log`：运行日志

安装包内保留安装脚本，用户首次运行 `START-HERE.bat` 会自动下载 PocketBase 并初始化。

已融合的 Personal IP Generator 功能会作为本工作台页面保留在安装包内：

```text
http://127.0.0.1:8787/ip-generator.html
```
