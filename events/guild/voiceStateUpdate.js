const { PermissionsBitField, EmbedBuilder } = require("discord.js"); // Added EmbedBuilder import
const delay = require("delay");
const { Database } = require("st.db");

const GVoice = new Database("./settings/models/voice.json", { databaseInObject: true });

module.exports = async (client, oldState, newState) => {
	const queue = client.distube.getQueue(newState.guild.id);

    // Check if the bot's voice state changed (e.g., bot left voice channel)
	if (oldState.id === client.user.id && !newState.channelId) {
		// Bot left the voice channel
        // Clear any active now playing interval for this guild
        if (client.nowPlayingInstances && client.nowPlayingInstances.has(oldState.guild.id)) {
            const instance = client.nowPlayingInstances.get(oldState.guild.id);
            clearInterval(instance.interval); // Stop the update loop
            client.nowPlayingInstances.delete(oldState.guild.id); // Remove from tracking
            // Optionally edit the now playing message to say it ended
            try {
                if (instance.message) {
                    await instance.message.edit({ embeds: [new EmbedBuilder().setDescription("Music session ended due to bot leaving voice channel.").setColor(client.color)], components: [] });
                }
            } catch (err) {
                console.error("Failed to edit now playing message on voice disconnect:", err);
            }
        }
        if (queue) { // If there was a queue, try to leave properly and update music
            await client.distube.voices.leave(queue.textChannel.guild);
		    await client.UpdateMusic(queue);
        }
        return; // Exit as bot's voice state change has been handled
	}

    // Handle bot being suppressed (muted by Discord)
	if (newState.channelId && newState.channel.type == 13 && newState.guild.members.me.voice.suppress) {
		if (newState.guild.members.me.permissions.has(PermissionsBitField.Flags.Speak) || (newState.channel && newState.channel.permissionsFor(newState.guild.members.me).has(PermissionsBitField.Flags.Speak))) {
			newState.guild.members.me.voice.setSuppressed(false);
		}
	}

    // If there's no queue, or the voice state update is not for the bot, or bot is not in a voice channel, return.
	if (!queue || oldState.id === client.user.id || !oldState.guild.members.cache.get(client.user.id).voice.channelId) return;

	const db = await GVoice.get(queue.textChannel.guild.id);
	if (db.voice_enable) return; // If 24/7 mode is enabled, bot should not leave on empty VC

    // Check if the bot's channel is empty (only bot remains)
	if (oldState.guild.members.cache.get(client.user.id).voice.channelId === oldState.channelId) {
		if (oldState.guild.members.me.voice?.channel && oldState.guild.members.me.voice.channel.members.filter((m) => !m.user.bot).size === 0) {
            // Delay before checking again to ensure no one joins immediately
			await delay(client.config.LEAVE_EMPTY);

			const vcMembers = oldState.guild.members.me.voice.channel?.members.size;
            // If still no human members, make bot leave
			if (!vcMembers || vcMembers === 1) { // 1 means only bot is left
				if(!queue) return; // Should not happen if queue exists from above check, but good for safety
				await client.distube.voices.leave(queue.textChannel.guild);
				await client.UpdateMusic(queue);

                // START ADDITION: Clear any active now playing interval for this guild due to inactivity
                if (client.nowPlayingInstances && client.nowPlayingInstances.has(oldState.guild.id)) {
                    const instance = client.nowPlayingInstances.get(oldState.guild.id);
                    clearInterval(instance.interval); // Stop the update loop
                    client.nowPlayingInstances.delete(oldState.guild.id); // Remove from tracking
                    try {
                        if (instance.message) {
                            await instance.message.edit({ embeds: [new EmbedBuilder().setDescription("Music session ended due to inactivity.").setColor(client.color)], components: [] });
                        }
                    } catch (err) {
                        console.error("Failed to edit now playing message on inactivity disconnect:", err);
                    }
                }
                // END ADDITION
			}
		}
	}
}