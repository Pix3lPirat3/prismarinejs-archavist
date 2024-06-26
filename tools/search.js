const util = require('node:util');
const marked = require('marked');

const jsdom = require('jsdom')
const createDOMPurify = require('dompurify');

let sources = {
  mineflayer: {
    url: 'https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/api.md',
    header: 'h4'
  },
  'mineflayer-pathfinder': {
    url: 'https://raw.githubusercontent.com/PrismarineJS/mineflayer-pathfinder/master/readme.md',
    header: 'h3'
  },
  'prismarine-windows': {
    url: 'https://raw.githubusercontent.com/PrismarineJS/prismarine-windows/master/API.md',
    header: 'h4'
  },
  'prismarine-chat': {
    url: 'https://raw.githubusercontent.com/PrismarineJS/prismarine-chat/master/README.md',
    header: 'h4'
  },
  'prismarine-world': {
    url: 'https://raw.githubusercontent.com/PrismarineJS/prismarine-world/master/docs/API.md',
    header: 'h3'
  },
  'node-vec3': { // This doesn't have much of an API..
    url: 'https://raw.githubusercontent.com/PrismarineJS/node-vec3/master/README.md',
    header: 'h2'
  },
  'prismarine-block': {
    url: 'https://raw.githubusercontent.com/PrismarineJS/prismarine-block/master/doc/API.md',
    header: 'h4'
  },
  'prismarine-entity': {
    url: 'https://raw.githubusercontent.com/PrismarineJS/prismarine-entity/master/README.md',
    header: 'h4'
  },
  'node-minecraft-data': {
    url: 'https://raw.githubusercontent.com/PrismarineJS/node-minecraft-data/master/doc/api.md',
    header: 'h3'
  },
  'node-minecraft-protocol': {
    url: 'https://raw.githubusercontent.com/PrismarineJS/node-minecraft-protocol/master/docs/API.md',
    header: 'h3'
  },
  'howdoi': {
    url: 'https://raw.githubusercontent.com/Pix3lPirat3/mineflayer-snippets/main/README.md',
    header: 'h4'
  },
  'bedrock-protocol': {
    url: 'https://raw.githubusercontent.com/PrismarineJS/bedrock-protocol/master/docs/API.md',
    header: 'h3'
  }
}

module.exports = class Searcher {

  constructor(source_type) {
    this.source = sources[source_type];
  }

  getRawMarkdown() {
    return fetch(this.source.url).then(res => res.text())
  }

  async getSanitizedHTML() {
    let markdown = await this.getRawMarkdown();
    const dom = new jsdom.JSDOM('')
    const DOMPurify = createDOMPurify(dom.window);
    return new jsdom.JSDOM(DOMPurify.sanitize(marked.parse(markdown.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, '')))).window;
  }

  async searchMarkdown(searchQuery) {

    let sanitized_html = await this.getSanitizedHTML();

    const $ = require('jquery')(sanitized_html);

    $.expr[':'].contains = function(a, i, m) {
      return $(a).text().toUpperCase()
          .indexOf(m[3].toUpperCase()) >= 0;
    };

    // Replace <code> with `code`
    $('code').each(function() {
      $(this).parent('pre').length ? $(this).replaceWith("```JS\n" + $(this).html() + "```") : $(this).replaceWith("`" + $(this).html() + "`");
    });

    // Replace <li> with •
    $('li').each(function() {
      $(this).replaceWith("• " + $(this).html())
    });

    let posts = [];

    const elHeaders = $(`${this.source.header}:contains('${searchQuery}')`).toArray();
    for (let a = 0; a < elHeaders.length; a++) {

      let elHeader = $(elHeaders[a]);

      let elChildren = elHeader.nextUntil('h1, h2, h3, h4, h5'); // Collect the `p, li, ul, ol, code` and other elements (TODO: Collect codeblocks and use ```)

      posts.push({
        header: elHeader.text().trim(),
        description: elChildren.text().trim()
      });
    }

    return posts;
  }

}