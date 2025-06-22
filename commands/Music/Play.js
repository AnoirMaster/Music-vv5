const { PermissionsBitField, ApplicationCommandOptionType } = require("discord.js");
const { Database } = require("st.db");

const GSetup = new Database("./settings/models/setup.json", { databaseInObject: true });

module.exports = {
    name: ["play"],
    description: "Plays a song from the source.",
    category: "Music",
    options: [
        {
            name: "search",
            type: ApplicationCommandOptionType.String,
            description: "The song to play.",
            required: true,
            autocomplete: true
        }
    ],
    run: async (client, interaction) => {
        const db = await GSetup.get(interaction.guild.id);
        if (db.setup_enable === true) {
           
            return interaction.reply("Command is disable already have song request channel!");
        } else {
            
            await interaction.deferReply();

            try {
                const string = interaction.options.getString("search");

                await interaction.editReply(`🔍 **Searching...** \`${string}\``);

                const message = await interaction.fetchReply();
                await client.createPlay(interaction, message.id);

                const { channel } = interaction.member.voice;
                if (!channel) return interaction.editReply("You need to be in voice channel.")
                if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.Connect)) return interaction.editReply(`I don't have perm \`CONNECT\` in ${channel.name} to join voice!`);
                if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.Speak)) return interaction.editReply(`I don't have perm \`SPEAK\` in ${channel.name} to join voice!`);

                const options = {
                    member: interaction.member,
                    textChannel: interaction.channel,
                    interaction,
                }

                await client.distube.play(interaction.member.voice.channel, string, options);

            } catch (e) {
                console.error(e);
                interaction.editReply({ content: `❌ | Une erreur est survenue : ${e.message.slice(0, 1900)}`, ephemeral: true });
            }
        }
    }
}