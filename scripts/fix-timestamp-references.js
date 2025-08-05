const fs = require('fs');
const path = require('path');

// Function to recursively find all JavaScript files
function findJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
      findJSFiles(filePath, fileList);
    } else if (file.endsWith('.js') && !file.includes('node_modules')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to update timestamp references in a file
function updateTimestampReferences(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace created_at with createdAt (but not in SQL CREATE TABLE statements)
    const createdAtRegex = /(?<!CREATE TABLE[^;]*)\bcreated_at\b(?![^']*'[^']*$)/g;
    if (content.match(createdAtRegex)) {
      content = content.replace(createdAtRegex, 'createdAt');
      modified = true;
    }
    
    // Replace updated_at with updatedAt (but not in SQL CREATE TABLE statements)
    const updatedAtRegex = /(?<!CREATE TABLE[^;]*)\bupdated_at\b(?![^']*'[^']*$)/g;
    if (content.match(updatedAtRegex)) {
      content = content.replace(updatedAtRegex, 'updatedAt');
      modified = true;
    }
    
    // Special handling for SQL UPDATE statements - keep them as snake_case for now
    // We'll handle database schema separately
    
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
console.log('🔄 Starting timestamp reference updates...');

const projectRoot = path.resolve(__dirname, '..');
const jsFiles = findJSFiles(projectRoot);

let updatedCount = 0;

// Filter out files we don't want to modify
const filesToUpdate = jsFiles.filter(file => {
  const relativePath = path.relative(projectRoot, file);
  return !relativePath.includes('node_modules') && 
         !relativePath.includes('dist') &&
         !relativePath.includes('supabase/migrations') &&
         !relativePath.includes('scripts/setup-') &&
         !relativePath.includes('dbschema.sql') &&
         !file.endsWith('fix-timestamp-references.js');
});

console.log(`📁 Found ${filesToUpdate.length} JavaScript files to check`);

filesToUpdate.forEach(file => {
  if (updateTimestampReferences(file)) {
    updatedCount++;
  }
});

console.log(`\n✨ Updated ${updatedCount} files`);
console.log('🎯 Next steps:');
console.log('1. Run the database migration script to rename columns');
console.log('2. Update TypeScript files');
console.log('3. Rebuild the project');