const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Generates a GitHub-style anchor from a header.
 * @param {string} header - The header text.
 * @returns {string} - The generated anchor.
 */
function generateAnchor(header) {
  return header
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove non-alphanumeric characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .trim(); // Trim whitespace
}

/**
 * Fetches content from a URL.
 * @param {string} url - The URL to fetch.
 * @returns {Promise<string>} - The content of the URL.
 */
function fetchFileFromUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        resolve(data);
      });

      response.on('error', (err) => {
        reject(err);
      });
    });
  });
}

/**
 * Searches a README file or URL for a query and groups results by headers and body text.
 * @param {string} filePathOrUrl - The file path or URL to search.
 * @param {string} query - The search query.
 * @param {Object} options - Search options.
 * @param {boolean} [options.caseInsensitive=true] - Perform a case-insensitive search.
 * @param {boolean} [options.searchInHeaders=true] - Search within headers.
 * @param {boolean} [options.searchInBody=true] - Search within body text.
 * @param {boolean} [options.isUrl=false] - Whether the input is a URL.
 * @param {number[]} [options.headerDepths=[]] - Header depths to include (e.g., [3, 4]).
 * @returns {Promise<Object[]>} - Matched results with header, body, and depth.
 */
async function advancedSearchReadme(filePathOrUrl, query, options = {}) {
  const {
    caseInsensitive = true,
    searchInHeaders = true,
    searchInBody = true,
    isUrl = false,
    headerDepths = [],
  } = options;

  try {
    const content = isUrl
      ? await fetchFileFromUrl(filePathOrUrl)
      : await fs.promises.readFile(filePathOrUrl, 'utf-8');

    const lines = content.split('\n');
    const results = [];

    let currentHeader = null;
    let currentBody = [];
    let currentDepth = null;

    const flushCurrentGroup = () => {
      if (currentHeader || currentBody.length > 0) {
        results.push({
          header: currentHeader || '',
          body: currentBody.join('\n').trim(),
          depth: currentDepth,
        });
        currentBody = [];
      }
    };

    for (const line of lines) {
      const headerMatch = line.match(/^(#+)\s+(.*)/);
      if (headerMatch) {
        const depth = headerMatch[1].length;

        if (headerDepths.length > 0 && !headerDepths.includes(depth)) {
          currentHeader = null;
          currentDepth = null;
          currentBody = [];
          continue;
        }

        flushCurrentGroup();
        currentHeader = headerMatch[2];
        currentDepth = depth;
        continue;
      }

      if (currentHeader) {
        currentBody.push(line);
      }
    }

    flushCurrentGroup();

    const searchQuery = caseInsensitive ? query.toLowerCase() : query;

    return results
      .filter(({ header, body }) => {
        const headerMatch = searchInHeaders && header.toLowerCase().includes(searchQuery);
        const bodyMatch = searchInBody && body.toLowerCase().includes(searchQuery);
        return headerMatch || bodyMatch;
      })
      .map(({ header, body, depth }) => ({ anchor: generateAnchor(header), header, body, depth }));
  } catch (error) {
    console.error('Error processing the file or URL:', error);
  }
}

module.exports = { advancedSearchReadme }