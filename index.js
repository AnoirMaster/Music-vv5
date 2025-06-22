const MainClient = require("./main.js");
const { TOKENS } = require("./settings/config.js");

if (!TOKENS || !Array.isArray(TOKENS) || TOKENS.length === 0 || TOKENS.some(t => !t)) {
    console.error("Aucun token valide n'a été trouvé dans settings/config.js.");
    console.error("Veuillez ajouter vos tokens dans le tableau TOKENS.");
    process.exit(1);
}

console.log(`Lancement de ${TOKENS.length} instance(s) de bot...`);

for (const token of TOKENS) {
    try {
        const client = new MainClient(token);
        client.connect();
        console.log(`Instance avec le token se terminant par "...${token.slice(-4)}" en cours de connexion.`);
    } catch (error) {
        console.error(`Erreur lors du lancement d'un bot avec le token se terminant par "...${token.slice(-4)}":`, error);
    }
}

console.log("Toutes les instances de bot sont en cours de connexion.");