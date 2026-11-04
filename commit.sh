#!/bin/bash
cd "F:\Projects\FateCovenantClone"
git add .
git commit -m "feat: 添加全项目服务入口日志

为排查问题，在所有 service 文件的主要业务函数入口添加详细日志，记录完整参数结构和请求数据的 base64 编码。"
