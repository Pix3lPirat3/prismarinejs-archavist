const { ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');

const path = require('path');

const { advancedSearchReadme } = require('./../../tools/search.js');
const sources = require('./../../sources.js')

module.exports = {
    data: new SlashCommandBuilder()
      .setName('search')
      .setDescription('Searches a [package] for [searchQuery]')
      .addStringOption(option =>
        option.setName('package')
        .setDescription('The package to search the API of')
        .setRequired(true) // defaults to mineflayer ? or all ?
        .addChoices(
        { name: 'mineflayer', value: 'mineflayer' },
        { name: 'prismarine-windows', value: 'prismarine-windows' },
        { name: 'prismarine-chat', value: 'prismarine-chat' },
        { name: 'prismarine-world', value: 'prismarine-world' },
        { name: 'node-vec3', value: 'node-vec3' },
        { name: 'node-minecraft-protocol', value: 'node-minecraft-protocol' },
        { name: 'prismarine-block', value: 'prismarine-block' },
        { name: 'prismarine-entity', value: 'prismarine-entity' },
        { name: 'node-minecraft-data', value: 'node-minecraft-data' }, // add alternative bot.registry ?
        { name: 'mineflayer-pathfinder', value: 'mineflayer-pathfinder' },
        { name: 'prismarine-item', value: 'prismarine-item' },
        //{ name: 'howdoi', value: 'howdoi' },
        { name: 'bedrock-protocol', value: 'bedrock-protocol'}))
      .addStringOption(option => option.setName('query').setDescription('The keyword you\'re searching for').setRequired(true))
      .addBooleanOption(option => option.setName('case_insensitive').setDescription('Should the search be caseInsensitive').setRequired(false))
      .addBooleanOption(option => option.setName('search_headers').setDescription('Should the search include header text').setRequired(false))
      .addBooleanOption(option => option.setName('search_body').setDescription('Should the search include body text').setRequired(false)),
  async execute(interaction) {

    const { Pagination } = require('pagination.djs');
    const { EmbedBuilder } = require('discord.js');
    const pagination = new Pagination(interaction, {
      firstEmoji: ':pixel_double_left:1226384097153384508', // First button emoji
      prevEmoji: ':pixel_left:1226383752029274132', // Previous button emoji
      nextEmoji: ':pixel_right:1226383750930235453', // Next button emoji
      lastEmoji: ':pixel_double_right:1226384096004145294', // Last button emoji
      limit: 5,
      idle: 60000,
      ephemeral: false,
      prevDescription: '',
      postDescription: '',
      loop: false
    });

    let { file, api, headers } = sources[interaction.options.get("package").value];

    const posts = await advancedSearchReadme('./local/' + file, interaction.options.get("query").value, {
      caseInsensitive: interaction.options.get("case_insensitive")?.value,
      searchInHeaders: interaction.options.get("search_headers")?.value,
      searchInBody: interaction.options.get("search_body")?.value,
      isUrl: false,
      headerDepths: headers,
    });

    if(!posts.length) {
      return interaction.reply({ content: 'There were no results for that search query!',  ephemeral: true })
    }

    const embeds = [];

    for (let i = 0; i < posts.length; i++) {
      let post = posts[i];
      const embed = new EmbedBuilder().setTitle(`\u00bb ${post.header}`).setDescription(`${post.body}\n[View in Docs](${api}${post.anchor})`).setTimestamp();
      embeds.push(embed);
    }


    const readTheDocs = new ButtonBuilder()
      .setLabel('Docs')
      .setURL(api)
      .setStyle('Link')
      .setEmoji(':4007_readthedocs:1226382693873221713')
    pagination.buttons = {...pagination.buttons, extra: readTheDocs };

    pagination.setEmbeds(embeds, (embed, index, array) => {
      return embed.setFooter({ text: `Page: ${index + 1} / ${array.length}` }).setColor('#00ff00');
    });
    pagination.render(); 

  }
};