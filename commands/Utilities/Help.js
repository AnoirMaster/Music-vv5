const { EmbedBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { readdirSync } = require("fs");

// Constants for pagination
const COMMANDS_PER_MAIN_PAGE = 6; // Reduced number of command entries per page to make pages smaller

// Define emojis for categories
const CATEGORY_EMOJIS = {
    "Music": "🎶",
    "Filter": "⚙️",
    "Utilities": "🛠️",
    "Context": "💬",
    // Add more if you have other categories. Make sure the key matches the capitalized category name.
};

module.exports = {
    name: ["help"],
    description: "Displays all commands that the bot has with detailed explanations, paginated.",
    category: "Utilities",
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: false });

        const allCommandEntries = []; // Array to hold all formatted command strings (name + description)
        const categories = readdirSync("./commands/");

        // Build a flat list of all formatted command entries, grouped by category
        categories.forEach(category => {
            const commandsInThisCategory = client.slash.filter(c => c.category === category);
            const capitalise = category.slice(0, 1).toUpperCase() + category.slice(1);
            const emoji = CATEGORY_EMOJIS[capitalise] || '📚'; // Get emoji for category, default to 📚 if not found

            allCommandEntries.push(`**__${emoji} ${capitalise} Commands:__**`); // Add category header with emoji
            
            const sortedCommands = commandsInThisCategory.sort((a, b) => {
                const nameA = Array.isArray(a.name) ? a.name.join(' ') : String(a.name); // Ensure string comparison
                const nameB = Array.isArray(b.name) ? b.name.join(' ') : String(b.name);
                return nameA.localeCompare(nameB);
            });

            sortedCommands.forEach(cmd => {
                let displayName = '';
                let description = cmd.description || 'No description available.';

                if (cmd.type === ApplicationCommandType.Message) { 
                    displayName = `\`[${cmd.name.join(' | ')}]\``;
                    // Tailor context command descriptions (keep them concise for smaller pages)
                    switch(cmd.name[0]) {
                        case 'Context | Stop': description = 'Stops the song and leaves VC.'; break; // Shortened
                        case 'Context | Loop': description = 'Repeats song/queue.'; break; // Shortened
                        case 'Context | Play': description = 'Plays song from message link.'; break; // Shortened
                        case 'Context | Shuffle': description = 'Shuffles the queue.'; break; // Shortened
                        case 'Context | Skip': description = 'Skips current song.'; break; // Shortened
                    }
                } else { 
                    displayName = `\`/${cmd.name.join(' ')}\``; 
                }
                allCommandEntries.push(`**${displayName}**\n*${description}*`);
            });
            allCommandEntries.push('\n'); // Separator for readability and to help with page breaks
        });

        // Split allCommandEntries into multiple pages based on COMMANDS_PER_MAIN_PAGE
        const pagesContent = [];
        for (let i = 0; i < allCommandEntries.length; i += COMMANDS_PER_MAIN_PAGE) {
            const pageSlice = allCommandEntries.slice(i, i + COMMANDS_PER_MAIN_PAGE);
            pagesContent.push(pageSlice.join('\n'));
        }

        // Handle case where no commands are found (empty allCommandEntries)
        if (pagesContent.length === 0) {
            pagesContent.push("No commands available to display.");
        }
        
        // Introductory text for each page
        const introText = `Hello ${interaction.user}! 👋 I'm **${client.user.username}**, your friendly music companion.
        I'm here to bring your favorite tunes to life in your server and make your music experience awesome!

        Below is a list of all available commands, categorized for your convenience, with a detailed explanation for each.
        All slash commands start with (\`/\`). Context Menu commands can be found by right-clicking on messages or users.
        \n\n`; 

        // Create Embed objects for each page
        const helpEmbeds = pagesContent.map((pageText, index) => {
            return new EmbedBuilder()
                .setColor(client.color)
                .setAuthor({ 
                    name: `${interaction.guild.members.me.displayName} Help Center`, 
                    iconURL: interaction.guild.iconURL({ dynamic: true }) 
                })
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 2048 }))
                .setTitle(`📚 ${client.user.username}'s Command Guide 🎶`)
                .setDescription(introText + pageText) // Combine intro text with page-specific command content
                .setFooter({ 
                    text: `Page ${index + 1}/${pagesContent.length} | Total Commands: ${client.slash.size}`, 
                    iconURL: client.user.displayAvatarURL({ dynamic: true }) 
                })
                .setTimestamp();
        });

        let currentPageIndex = 0; // Start at the first page

        // Function to create pagination buttons
        const getPaginationRow = (currentPage) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('help_prev')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 0), // Disable 'Previous' on first page
                new ButtonBuilder()
                    .setCustomId('help_next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === pagesContent.length - 1) // Disable 'Next' on last page
            );
        };

        const initialRow = getPaginationRow(currentPageIndex);
        // Send the first page. Only show buttons if there's more than one page.
        const replyMessage = await interaction.editReply({ 
            embeds: [helpEmbeds[currentPageIndex]], 
            components: pagesContent.length > 1 ? [initialRow] : [] // Only add buttons if there's more than 1 page
        });

        // Set up collector for button interactions
        if (pagesContent.length > 1) { // Only collect if there are multiple pages
            const filter = (i) => (i.customId === 'help_prev' || i.customId === 'help_next') && i.user.id === interaction.user.id && i.message.id === replyMessage.id;
            const collector = replyMessage.createMessageComponentCollector({ filter, time: 120000 }); // Collector times out after 2 minutes

            collector.on('collect', async (i) => {
                await i.deferUpdate(); // Defer update to prevent interaction failed

                if (i.customId === 'help_next') {
                    currentPageIndex++;
                } else if (i.customId === 'help_prev') {
                    currentPageIndex--;
                }

                // Ensure page index stays within bounds
                if (currentPageIndex < 0) currentPageIndex = 0;
                if (currentPageIndex >= pagesContent.length) currentPageIndex = pagesContent.length - 1;

                const updatedRow = getPaginationRow(currentPageIndex);
                await i.editReply({
                    embeds: [helpEmbeds[currentPageIndex]],
                    components: [updatedRow]
                }).catch(console.error); // Catch errors during message edit
            });

            collector.on('end', async () => {
                // Disable buttons when the collector ends (e.g., timeout)
                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('help_prev').setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(true),
                    new ButtonBuilder().setCustomId('help_next').setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(true)
                );
                await replyMessage.edit({ components: [disabledRow] }).catch(console.error); // Edit original message to show disabled buttons
            });
        }
    }
};