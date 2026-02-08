const fs = require('fs');
const path = require('path');

// عدّل المسارات هنا
const inputFolder = path.join(__dirname, './src/models'); // فولدر الملفات
const outputFile = path.join(__dirname, 'merged.txt'); // الملف النهائي

// الامتدادات المسموح دمجها (عدّل حسب احتياجك)
const allowedExtensions = ['.js'];

function mergeFiles(folderPath) {
  const files = fs.readdirSync(folderPath);
  let mergedContent = '';

  files.forEach(file => {
    const filePath = path.join(folderPath, file);
    
    const stat = fs.statSync(filePath);

    if (
      stat.isFile() &&
      allowedExtensions.includes(path.extname(file))
    ) {
      const content = fs.readFileSync(filePath, 'utf8');

      mergedContent +=
        `\n\n// =========================\n` +
        `// File: ${file}\n` +
        `// =========================\n\n` +
        content;
    }
  });

  fs.writeFileSync(outputFile, mergedContent, 'utf8');
  console.log('✅ Files merged successfully into:', outputFile);
}

mergeFiles(inputFolder);
