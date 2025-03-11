// parseQuestionsAPIByType.js
// This script reads "nist_ai_rmf_playbook.json", extracts all questions from every "section_doc" field,
// prepends the parent's "title" value to each question, groups questions by the record's "type",
// and then creates an API template with one page per distinct type. The output is saved to "assessmentImport.json".

const fs = require('fs');
const path = require('path');

// Function to generate a 5-character random string (using lowercase letters and digits)
function generateRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Define input and output file paths
const inputFilePath = path.join(__dirname, 'nist_ai_rmf_playbook.json');
const outputFilePath = path.join(__dirname, 'assessmentImport.json');

try {
  // Read and parse the input JSON file
  const fileContent = fs.readFileSync(inputFilePath, 'utf8');
  const data = JSON.parse(fileContent);

  // Group questions by the "type" key
  const pagesByType = {};

  data.forEach(item => {
    const type = item.type || "Unknown";
    if (!pagesByType[type]) {
      pagesByType[type] = [];
    }
    if (item.section_doc) {
      const lines = item.section_doc.split('\n');
      lines.forEach(line => {
        const trimmedLine = line.trim();
        // Consider lines that end with a "?" as questions
        if (trimmedLine.endsWith('?')) {
          // Remove common bullet markers (e.g., "-" or "*")
          const question = trimmedLine.replace(/^[-*]\s*/, '');
          // Prepend the parent's title to the question text
          const fullQuestion = `${item.title} ${question}`;
          pagesByType[type].push(fullQuestion);
        }
      });
    }
  });

  // Build the pages array using the grouped questions
  const pages = Object.keys(pagesByType).map(type => ({
    name: `page_${type.toLowerCase().replace(/\s+/g, '_')}`, // unique page name based on type
    title: type,
    elements: pagesByType[type].map(question => ({
      name: `question ${generateRandomString(5)}`,
      type: 'rich-text',
      title: question
    }))
  }));

  // Create the API template object using your desired structure
  const apiTemplate = {
    apiVersion: 1,
    surveyDefinition: {
      title: "Woffles Assessment",
      description: "This to assess Woffles",
      pages: pages,
      status: "Published",
      governance: true,
      showQuestionNumbers: "off",
      answerMappings: {},
      notification: true,
      allowedDomains: [],
      default: false,
      isPublicByDefault: true
    }
  };

  // Write the formatted API template to the output JSON file
  fs.writeFileSync(outputFilePath, JSON.stringify(apiTemplate, null, 2), 'utf8');
  console.log(`API template saved to ${outputFilePath}`);
} catch (err) {
  console.error("Error reading or parsing file:", err);
}
