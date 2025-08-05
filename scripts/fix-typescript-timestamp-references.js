const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript files
function findTSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
      findTSFiles(filePath, fileList);
    } else if (file.endsWith('.ts') && !file.includes('node_modules')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to update timestamp references in TypeScript files
function updateTSTimestampReferences(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace createdAt with createdAt in property names and object literals
    const createdAtRegex = /\bcreated_at\b/g;
    if (content.match(createdAtRegex)) {
      content = content.replace(createdAtRegex, 'createdAt');
      modified = true;
    }
    
    // Replace updatedAt with updatedAt in property names and object literals
    const updatedAtRegex = /\bupdated_at\b/g;
    if (content.match(updatedAtRegex)) {
      content = content.replace(updatedAtRegex, 'updatedAt');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('🔄 Starting TypeScript timestamp reference updates...');

const projectRoot = path.resolve(__dirname, '..');
const tsFiles = findTSFiles(path.join(projectRoot, 'src'));

let updatedCount = 0;

console.log(`📁 Found ${tsFiles.length} TypeScript files to check`);

tsFiles.forEach(file => {
  if (updateTSTimestampReferences(file)) {
    updatedCount++;
  }
});

console.log(`\n✨ Updated ${updatedCount} TypeScript files`);