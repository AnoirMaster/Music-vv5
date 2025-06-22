const { plsParseArgs } = require('plsargs');
const args = plsParseArgs(process.argv.slice(2));
const chillout = require("chillout");
const { makeSureFolderExists } = require("stuffs");
const path = require("path");
const readdirRecursive = require("recursive-readdir");
const { TOKENS } = require("./settings/config.js");
const { ApplicationCommandOptionType, REST, Routes, ApplicationCommandManager } = require('discord.js');

(async () => {

  let command = [];

  let cleared = args.get(0) == "guild" ? args.get(2) == "clear" : (args.get(0) == "global" ? args.get(1) == "clear" : false);
  let deployed = args.get(0) == "guild" ? "guild" : args.get(0) == "global" ? "global" : null;
  if (!deployed) {
    console.error(`Invalid sharing mode! Valid modes: guild, global`);
    return process.exit(1);
  }
  if (!cleared) {
    let interactionsFolder = path.resolve("./commands");
    await makeSureFolderExists(interactionsFolder);
    let store = [];
    console.log("Reading interaction files..")
    let interactionFilePaths = await readdirRecursive(interactionsFolder);
    interactionFilePaths = interactionFilePaths.filter(i => {
      let state = path.basename(i).startsWith("-");
      return !state;
    });
    await chillout.forEach(interactionFilePaths, (interactionFilePath) => {
      const cmd = require(interactionFilePath);
      console.log(`Interaction "${cmd.type == "CHAT_INPUT" ? `/${cmd.name.join(" ")}` : `${cmd.name[0]}`}" ${cmd.name[1] || ""} ${cmd.name[2] || ""} added to the transform list!`);
      store.push(cmd);
    });
    store = store.sort((a, b) => a.name.length - b.name.length)
    command = store.reduce((all, current) => {
      switch (current.name.length) {
        case 1: {
          all.push({
            type: current.type,
            name: current.name[0],
            description: current.description,
            defaultPermission: current.defaultPermission,
            options: current.options
          });
          break;
        }
        case 2: {
          let baseItem = all.find((i) => {
            return i.name == current.name[0] && i.type == current.type
          });
          if (!baseItem) {
            all.push({
              type: current.type,
              name: current.name[0],
              description: `${current.name[0]} commands.`,
              defaultPermission: current.defaultPermission,
              options: [
                {
                  type: ApplicationCommandOptionType.Subcommand,
                  description: current.description,
                  name: current.name[1],
                  options: current.options
                }
              ]
            });
          } else {
            baseItem.options.push({
              type: ApplicationCommandOptionType.Subcommand,
              description: current.description,
              name: current.name[1],
              options: current.options
            })
          }
          break;
        }
        case 3: {
          let SubItem = all.find((i) => {
            return i.name == current.name[0] && i.type == current.type
          });
          if (!SubItem) {
            all.push({
              type: current.type,
              name: current.name[0],
              description: `${current.name[0]} commands.`,
              defaultPermission: current.defaultPermission,
              options: [
                {
                  type: ApplicationCommandOptionType.SubcommandGroup,
                  description: `${current.name[1]} commands.`,
                  name: current.name[1],
                  options: [
                    {
                      type: ApplicationCommandOptionType.Subcommand,
                      description: current.description,
                      name: current.name[2],
                      options: current.options
                    }
                  ]
                }
              ]
            });
          } else {
            let GroupItem = SubItem.options.find(i => {
              return i.name == current.name[1] && i.type == ApplicationCommandOptionType.SubcommandGroup
            });
            if (!GroupItem) {
              SubItem.options.push({
                type: ApplicationCommandOptionType.SubcommandGroup,
                description: `${current.name[1]} commands.`,
                name: current.name[1],
                options: [
                  {
                    type: ApplicationCommandOptionType.Subcommand,
                    description: current.description,
                    name: current.name[2],
                    options: current.options
                  }
                ]
              })
            } else {
              GroupItem.options.push({
                type: ApplicationCommandOptionType.Subcommand,
                description: current.description,
                name: current.name[2],
                options: current.options
              })
            }
          }
        }
          break;
      }
      return all;
    }, []);
    command = command.map(i => ApplicationCommandManager.transformCommand(i));
  } else {
    console.info("No interactions read, all existing ones will be cleared...");
  }


  for (const token of TOKENS) {
      if (!token) continue;
      console.info(`\n[DEPLOY] Tentative de déploiement pour le token se terminant par ...${token.slice(-4)}`);
      
      const rest = new REST({ version: "9" }).setToken(token);
      const client = await rest.get(Routes.user());
      console.info(`[DEPLOY] Infos du compte reçues : ${client.username}#${client.discriminator} (${client.id})`);

      console.info(`[DEPLOY] Les interactions sont envoyées à Discord !`);
      switch (deployed) {
        case "guild": {
          let guildId = args.get(1);
          console.info(`[DEPLOY] Mode : guild (${guildId})`);
          await rest.put(Routes.applicationGuildCommands(client.id, guildId), { body: command });
          console.info(`[DEPLOY] Les commandes partagées peuvent prendre 3-5 secondes pour apparaître.`);
          break;
        }
        case "global": {
          console.info(`[DEPLOY] Mode : global`);
          await rest.put(Routes.applicationCommands(client.id), { body: command });
          console.info(`[DEPLOY] Les commandes partagées peuvent prendre jusqu'à 1 heure pour apparaître.`);
          break;
        }
      }
      console.info(`[DEPLOY] Interactions partagées pour ${client.username}!`);
  }
  console.log("\nDéploiement terminé pour tous les tokens.");

})();