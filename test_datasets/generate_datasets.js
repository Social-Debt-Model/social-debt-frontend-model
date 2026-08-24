const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

const inputFile = path.join(__dirname, 'dataset_test_100.csv');
const outputDir = __dirname;

const csvText = fs.readFileSync(inputFile, 'utf-8');
const parsed = Papa.parse(csvText, { header: true });

const data = parsed.data;

const generateFile = (filename, modId, modIssue, modComment = 'all') => {
  const newData = data.map((row, idx) => {
    const newRow = { ...row };
    if (modId === 'none') {
      delete newRow['comment_id'];
    } else if (modId === 'half') {
      if (idx % 2 !== 0) delete newRow['comment_id'];
    }
    
    if (modIssue === 'none') {
      delete newRow['issue_number'];
    } else if (modIssue === 'half') {
      if (idx % 2 !== 0) delete newRow['issue_number'];
    }

    if (modComment === 'none') {
      delete newRow['comment_body_raw'];
    }
    
    return newRow;
  });
  
  const csvStr = Papa.unparse(newData);
  fs.writeFileSync(path.join(outputDir, filename), csvStr);
  console.log(`Generated ${filename}`);
};

// 1. Original (All present)
// handled by existing dataset_test_100.csv

// 2. No IDs
generateFile('dataset_no_ids.csv', 'none', 'all');

// 3. Half IDs
generateFile('dataset_half_ids.csv', 'half', 'all');

// 4. No Issues
generateFile('dataset_no_issues.csv', 'all', 'none');

// 5. Half Issues
generateFile('dataset_half_issues.csv', 'all', 'half');

// 6. No IDs and No Issues
generateFile('dataset_no_ids_no_issues.csv', 'none', 'none');

// 7. Half IDs and Half Issues
generateFile('dataset_half_ids_half_issues.csv', 'half', 'half');

// 8. No IDs and Half Issues
generateFile('dataset_no_ids_half_issues.csv', 'none', 'half');

// 9. Half IDs and No Issues
generateFile('dataset_half_ids_no_issues.csv', 'half', 'none');
generateFile('dataset_no_comment.csv', 'all', 'all', 'none');
