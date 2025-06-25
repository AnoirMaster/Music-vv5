const { InteractionType } = require("discord.js");

/**
 * @param {import('../../main.js')} client
 * @param {import('discord.js').Interaction} interaction
 */
module.exports = async (client, interaction) => {

    const getCommand = () => {
        let cmdName;
        if (interaction.isMessageContextMenuCommand() || interaction.isUserContextMenuCommand()) {
             cmdName = [interaction.commandName];
        }
        else if (interaction.isChatInputCommand()) {
            const group = interaction.options.getSubcommandGroup(false);
            const sub = interaction.options.getSubcommand(false);
            if (sub) {
                cmdName = group ? [interaction.commandName, group, sub] : [interaction.commandName, sub];
            } else {
                cmdName = [interaction.commandName];
            }
        }
        
        if (!cmdName) return null;
        
        for (const [key, command] of client.slash.entries()) {
            if (JSON.stringify(key) === JSON.stringify(cmdName)) {
                return command;
            }
        }
        return null;
    };

    const command = getCommand();

    // --- معالجة الإكمال التلقائي ---
    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
        if (!command || !command.autocomplete) return;
        try {
            await command.autocomplete(client, interaction);
        } catch (error) {
            console.error("Autocomplete Error:", error);
            await interaction.respond([]).catch(() => {});
        }
        return;
    }

    // --- معالجة تنفيذ الأوامر ---
    if (interaction.isCommand() || interaction.isContextMenuCommand()) {
        if (!command || !command.run) return;

        client.addCount(command.name[command.name.length - 1]);

        try {
            // الآن، دالة "run" في ملف الأمر هي المسؤولة الوحيدة عن الرد
            await command.run(client, interaction);
        } catch (error) {
            console.error(`Error executing '${interaction.commandName}':`, error);
            const errorMessage = { content: 'There was an error while executing this command!', ephemeral: true };
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            } catch (e) {
                console.error("Failed to send error reply:", e);
            }
        }
    }
};