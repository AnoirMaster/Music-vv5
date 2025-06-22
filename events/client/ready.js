const { white, green } = require('chalk');
const { ActivityType } = require("discord.js"); // Added ActivityType import for clear activity types

module.exports = async (client) => {
    console.log(white('[') + green('INFO') + white('] ') + green(`${client.user.tag} (${client.user.id})`) + white(` is Ready!`));

    // Removed guilds, users, and channels variables as they are no longer used in activities.
    // let guilds = client.guilds.cache.size;
    // let users = client.users.cache.size;
    // let channels = client.channels.cache.size;

    // Define the activities the bot will cycle through, now with emojis!
    const activities = [
        `🎶 Use /help for commands!`, // Example activity text with music note emoji
        `🎧 Playing awesome music!`,    // Another example with headphones emoji
        `✨ Serving communities!`,      // You can customize these texts with any emojis
    ];

    // Set an interval to update the bot's presence (activity and status).
    // The activity will randomly select from the 'activities' array.
    // The status is set to 'online'.
    // The update interval is 15 seconds (15000 milliseconds).
    setInterval(() => {
        client.user.setPresence({
            activities: [{ 
                name: `${activities[Math.floor(Math.random() * activities.length)]}`, 
                type: ActivityType.Playing // Changed to ActivityType.Playing (formerly type: 0)
            }],
            status: 'online',
        });
    }, 15000)
}