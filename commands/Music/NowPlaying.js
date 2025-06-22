const { EmbedBuilder } = require("discord.js");
const { Database } = require("st.db");

const GSetup = new Database("./settings/models/setup.json", { databaseInObject: true });

// A Map to store active now playing messages and their update intervals
// Key: guildId, Value: { message: Discord.Message, interval: NodeJS.Timeout }
// This line is added here for clarity, but the actual Map initialization is in main.js
// client.nowPlayingInstances = client.nowPlayingInstances || new Map(); 

module.exports = {
    name: ["nowplaying"],
    description: "Display the song currently playing with live updates.",
    category: "Music",
    run: async (client, interaction) => {
        // Fix for "ephemeral" deprecation: removed { ephemeral: false } as it's the default behavior.
        await interaction.deferReply(); 

        const db = await GSetup.get(interaction.guild.id);
        if (db.setup_enable === true) return interaction.editReply("Command is disabled as a dedicated song request channel is enabled. Use that channel for live updates.");

        const queue = client.distube.getQueue(interaction);
        if (!queue) return interaction.editReply(`There is nothing in the queue right now!`);
        
        const { channel } = interaction.member.voice;
        if (!channel || interaction.member.voice.channel !== interaction.guild.members.me.voice.channel) {
            return interaction.editReply("You need to be in the same/voice channel as the bot.");
        }

        // --- Function to create/update the Now Playing Embed ---
        // This function generates the embed content based on the current queue state.
        const createNowPlayingEmbed = (currentQueue, currentPlayingSong) => {
            const uni = `${currentPlayingSong.playing ? '⏸️ |' : '🔴 |'}`;
            
            const embed = new EmbedBuilder()
                .setAuthor({ name: currentPlayingSong.playing ? 'Song Paused...' : 'Now Playing...', iconURL: "https://cdn.discordapp.com/emojis/741605543046807626.gif"})
                .setColor(client.color)
                .setDescription(`**[${currentPlayingSong.name}](${currentPlayingSong.url})**`)
                .setThumbnail(`${currentPlayingSong.thumbnail || client.user.displayAvatarURL()}`)
                .addFields(
                    { name: 'Uploader:', value: `[${currentPlayingSong.uploader.name || "Anonymous"}](${currentPlayingSong.uploader.url || "https://www.github.com/Adivise"})`, inline: true },
                    { name: 'Requester:', value: `${currentPlayingSong.user}`, inline: true },
                    { name: 'Volume:', value: `${currentQueue.volume}%`, inline: true },
                    { name: 'Views', value: `${currentPlayingSong.views || "0"}`, inline: true },
                    { name: 'Likes:', value: `${currentPlayingSong.likes || "0"}`, inline: true },
                    { name: 'Filters:', value: `${currentQueue.filters.names.join(', ') || "Normal"}`, inline: true }
                )
                .setTimestamp();

            // Calculate and add the progress bar
            // Ensures duration is a valid, non-zero number before calculating progress
            if (currentPlayingSong.duration && Number.isFinite(currentPlayingSong.duration) && currentPlayingSong.duration > 0) {
                const part = Math.floor((currentQueue.currentTime / currentPlayingSong.duration) * 30);
                embed.addFields({ name: `Current Duration: \`[${currentQueue.formattedCurrentTime} / ${currentPlayingSong.formattedDuration}]\``, value: `\`\`\`${uni} ${'─'.repeat(part) + '🎶' + '─'.repeat(30 - part)}\`\`\``, inline: false });
            } else {
                // Fallback for live streams or invalid durations (no progress bar animation)
                embed.addFields({ name: `Current Duration: \`[0:00 / ${currentPlayingSong.formattedDuration}]\``, value:`\`\`\`🔴 | 🎶──────────────────────────────\`\`\``, inline: false });
            }
            return embed;
        };
        // --- End of Embed creation function ---


        // Clear any existing interval for this guild's now playing message
        // This ensures only one live update message exists per guild for this command.
        if (client.nowPlayingInstances.has(interaction.guild.id)) {
            clearInterval(client.nowPlayingInstances.get(interaction.guild.id).interval);
            client.nowPlayingInstances.delete(interaction.guild.id);
        }

        // Send the initial embed message
        const initialEmbed = createNowPlayingEmbed(queue, queue.songs[0]);
        const message = await interaction.editReply({ embeds: [initialEmbed] });

        // Set up an interval to continuously update the message
        const intervalId = setInterval(async () => {
            const updatedQueue = client.distube.getQueue(interaction);
            // If the queue no longer exists, or the current song ended, or bot left voice, clear interval
            if (!updatedQueue || !updatedQueue.songs[0] || !interaction.guild.members.me.voice.channel) {
                clearInterval(intervalId); // Stop the interval
                client.nowPlayingInstances.delete(interaction.guild.id); // Remove from tracking map
                // Optionally edit the message one last time to indicate the session ended
                try {
                    await message.edit({ embeds: [new EmbedBuilder().setDescription("Music session ended.").setColor(client.color)], components: [] });
                } catch (err) {
                    console.error("Failed to edit ended now playing message:", err);
                }
                return;
            }

            // Create and update the embed with the latest queue information
            const updatedEmbed = createNowPlayingEmbed(updatedQueue, updatedQueue.songs[0]);
            try {
                await message.edit({ embeds: [updatedEmbed] });
            } catch (error) {
                // If editing fails (e.g., message deleted manually), stop the interval
                console.error("Failed to update now playing message (might be deleted):", error);
                clearInterval(intervalId);
                client.nowPlayingInstances.delete(interaction.guild.id);
            }
        }, 3000); // Update every 3 seconds (adjust this interval for smoother/less frequent updates)

        // Store the message object and its interval ID for this guild
        client.nowPlayingInstances.set(interaction.guild.id, { message, interval: intervalId });
    }
};