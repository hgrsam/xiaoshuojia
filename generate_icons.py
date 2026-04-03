#!/usr/bin/env python3
"""
生成小说家APP图标
需要安装 pillow: pip install pillow
"""
import os
from PIL import Image, ImageDraw, ImageFont

def create_icon(size, output_path):
    """创建一个图标"""
    # 创建渐变背景
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 渐变背景 (紫色系)
    for y in range(size):
        ratio = y / size
        r = int(99 + (139 - 99) * ratio)
        g = int(102 + (92 - 102) * ratio)
        b = int(241 + (246 - 241) * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    
    # 圆角矩形
    padding = size // 10
    draw.rounded_rectangle(
        [padding, padding, size - padding, size - padding],
        radius=size // 8,
        fill=(99, 102, 241)
    )
    
    # 白色书本/文档形状
    margin = size // 4
    line_height = size // 12
    draw.rectangle([margin, margin + line_height, size - margin, margin + line_height * 1.5], fill='white')
    
    y = margin + line_height * 2.5
    for i in range(4):
        line_width = int((size - margin * 2) * (0.6 + (i % 2) * 0.3))
        draw.rectangle([margin, y, margin + line_width, y + line_height // 2], fill='white')
        y += line_height * 1.2
    
    # 保存
    img.save(output_path, 'PNG')
    print(f"已生成: {output_path}")

def main():
    output_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 生成不同尺寸的图标
    sizes = {
        'icon-72.png': 72,
        'icon-96.png': 96,
        'icon-128.png': 128,
        'icon-144.png': 144,
        'icon-152.png': 152,
        'icon-192.png': 192,
        'icon-384.png': 384,
        'icon-512.png': 512,
    }
    
    for filename, size in sizes.items():
        create_icon(size, os.path.join(output_dir, filename))
    
    print("\n所有图标生成完成！")
    print("推荐使用: icon-192.png 和 icon-512.png")

if __name__ == '__main__':
    main()
