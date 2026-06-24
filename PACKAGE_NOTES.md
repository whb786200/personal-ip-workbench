# 打包说明

本项目打包时会排除：

- `local/`：本机管理员密码
- `tools/`：PocketBase 二进制和数据库
- `*.log`：运行日志

安装包内保留安装脚本，用户首次运行 `START-HERE.bat` 会自动下载 PocketBase 并初始化。
