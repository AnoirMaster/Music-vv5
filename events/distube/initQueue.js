const { EmbedBuilder } = require("discord.js");

module.exports = async (client, queue) => {
    // Set the default volume for the newly created queue from client.config.DEFAULT_VOLUME
    // This ensures that when a new queue starts, its volume is set to the default.
    if (client.config.DEFAULT_VOLUME !== undefined) {
        queue.setVolume(client.config.DEFAULT_VOLUME);

        // Remove the message that confirms the default volume.
        // The following code is commented out.
        /*
        const embed = new EmbedBuilder()
            .setColor(client.color)
            .setDescription(`\`🔊\` | Initial volume set to: \`${client.config.DEFAULT_VOLUME}\`%`);
        
        if (queue.textChannel) {
            queue.textChannel.send({ embeds: [embed] }).catch(console.error);
        }
        */
    }
};