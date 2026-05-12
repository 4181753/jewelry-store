const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const data = [
  ['品牌ID', '商品名称', '官方价', '复刻价', '类目', '主图链接', '悬停图链接', '图片3链接', '图片4链接', '图片5链接'],
  ['louis-vuitton', 'Sample Bracelet', '3500', '650', 'Bracelets', 'https://example.com/img1.jpg', 'https://example.com/img2.jpg', 'https://example.com/img3.jpg', '', ''],
  ['fred', 'Men\'s Ring', '5000', '980', 'Rings', 'https://example.com/img_a.jpg', 'https://example.com/img_b.jpg', 'https://example.com/img_c.jpg', 'https://example.com/img_d.jpg', ''],
  ['cartier', 'Luxury Necklace', '12000', '2100', 'Necklaces', 'https://example.com/img_x.jpg', 'https://example.com/img_y.jpg', '', '', '']
];

const targetDir = path.join('D:', 'copy', '005', 'public');
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Products");

const targetPath = path.join(targetDir, 'product_template.xlsx');
XLSX.writeFile(wb, targetPath);

console.log('Template created at:', targetPath);
