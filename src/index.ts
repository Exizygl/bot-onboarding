import { Client, GatewayIntentBits, Partials } from 'discord.js';
import dotenv from 'dotenv';
import { setupEventHandlers } from './handlers/eventHandler';
import { startCronJobs } from './cron/cronJobs';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
  partials: [Partials.Channel],
});

client.once('ready', async () => {
  console.log(`✅ Bot connecté en tant que ${client.user?.tag}`);
  
  // Setup event handlers
  await setupEventHandlers(client);
  
  // Start cron jobs for auto-start and auto-archive
  startCronJobs(client);
  
  console.log('🚀 Bot prêt à l\'emploi !');
});

client.login(process.env.DISCORD_TOKEN);