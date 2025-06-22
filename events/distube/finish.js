const { EmbedBuilder } = require("discord.js");
const { Database } = require("st.db");

const GVoice = new Database("./settings/models/voice.json", { databaseInObject: true });

module.exports = async (client, queue) => {
    const db = await GVoice.get(queue.textChannel.guild.id);

    // START ADDITION: Clear any active now playing interval for this guild when a song finishes
    if (client.nowPlayingInstances && client.nowPlayingInstances.has(queue.textChannel.guild.id)) {
        const instance = client.nowPlayingInstances.get(queue.textChannel.guild.id);
        clearInterval(instance.interval); // Stop the update loop
        client.nowPlayingInstances.delete(queue.textChannel.guild.id); // Remove from tracking

        // Optionally, edit the now playing message one last time to indicate session ended
        try {
            if (instance.message) {
                await instance.message.edit({ embeds: [new EmbedBuilder().setDescription("Music session ended.").setColor('#000001')], components: [] });
            }
        } catch (err) {
            console.error("Failed to edit now playing message on finish:", err);
        }
    }
    // END ADDITION

    if (db.voice_enable === true) {
        await client.UpdateMusic(queue);
        
        const embed = new EmbedBuilder()
            .setDescription(`\`📛\` | **Song has been:** \`Ended\``)
            .setColor('#000001')

        queue.textChannel.send({ embeds: [embed] })
    } else if (db.voice_enable === false) {
        await client.UpdateMusic(queue);
        await client.distube.voices.leave(queue.textChannel.guild);
    
        const embed = new EmbedBuilder()
            .setDescription(`\`📛\` | **Song has been:** \`Ended\``)
            .setColor('#000001')
    
        queue.textChannel.send({ embeds: [embed] })
    }
}