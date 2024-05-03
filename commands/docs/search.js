const { ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');

const Searcher = require('./../../tools/search.js');

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
        { name: 'howdoi', value: 'howdoi' }))
      .addStringOption(option => option.setName('query').setDescription('The keyword you\'re searching for').setRequired(true)),
  async execute(interaction) {

    const { Pagination } = require('pagination.djs');
    const { EmbedBuilder } = require('discord.js');
    const pagination = new Pagination(interaction, {
      firstEmoji: ':pixel_double_left:1226384097153384508', // First button emoji
      prevEmoji: ':pixel_left:1226383752029274132', // Previous button emoji
      nextEmoji: ':pixel_right:1226383750930235453', // Next button emoji
      lastEmoji: ':pixel_double_right:1226384096004145294', // Last button emoji
      limit: 5, // number of entries per page
      idle: 30000, // idle time in ms before the pagination closes
      ephemeral: false, // ephemeral reply
      prevDescription: '',
      postDescription: '',
      //attachments: [new AttachmentBuilder()], // attachments you want to pass with the embed
      //buttonStyle: ButtonStyle.Secondary, // button style
      loop: false // loop through the pages
    });

    let package = interaction.options.get("package").value;

    let searchQuery = interaction.options.get("query").value;

    let search = new Searcher(package);
    let posts = await search.searchMarkdown(searchQuery);

    if(!posts.length) {
      return interaction.reply({ content: 'There were no results for that search query!',  ephemeral: true })
    }

    const embeds = [];

    for (let i = 0; i < posts.length; i++) {
      let post = posts[i];
      const embed = new EmbedBuilder().setTitle(`\u00bb ${post.header}`).setDescription(post.description).setTimestamp();
      embeds.push(embed);
    }


    const readTheDocs = new ButtonBuilder()
      //.setCustomId('Google')
      .setLabel('Docs')
      .setURL("https://github.com/PrismarineJS/")
      .setStyle('Link')
      .setEmoji(':4007_readthedocs:1226382693873221713')
    pagination.buttons = {...pagination.buttons, extra: readTheDocs };

    pagination.setEmbeds(embeds, (embed, index, array) => {
      return embed.setFooter({ text: `Page: ${index + 1} / ${array.length}` }).setColor('#00ff00');
    });
    pagination.render();

  }
};