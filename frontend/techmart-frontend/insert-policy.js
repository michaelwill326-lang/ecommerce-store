const fs = require('fs');
const file = 'src/pages/Dashboard.jsx';

let content = fs.readFileSync(file, 'utf8');
const targetLine = '<Link to="/tracking" style={styles.footerLink}>Orders</Link>';
const newLine = '\n            <Link to="/policy" style={styles.footerLink}>Policies</Link>';

if (content.includes(targetLine) && !content.includes('/policy')) {
  content = content.replace(targetLine, targetLine + newLine);
  fs.writeFileSync(file, content, 'utf8');
  console.log("✅ Successfully injected Policies link into Dashboard footer!");
} else {
  console.log("⚠️ Link already exists or target line mismatch.");
}
