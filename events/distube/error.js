const { EmbedBuilder } = require("discord.js");

module.exports = async (client, channel, error) => {
    console.error(error);

    let errorMessage = error.message;
    // Ensure errorMessage exists and is a string, otherwise provide a default message.
    if (!errorMessage || typeof errorMessage !== 'string') {
        errorMessage = 'An unknown error occurred or the error message was not a string.';
    }

    const embed = new EmbedBuilder()
        .setColor("#FF0000") // Red to indicate an error
        .setTitle("Une Erreur est Survenue")
        .setDescription("Désolé, une erreur inattendue s'est produite lors من la tentative de lecture de la musique.")
        .addFields({ name: "Message d'erreur", value: `\`\`\`${errorMessage.slice(0, 1000)}\`\`\`` }); // Slice on the guaranteed string, limit to 1000 chars

    if (channel) {
        channel.send({ embeds: [embed] }).catch(console.error); // Add catch for send
    }
}