import { Client, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from '../config/config';
import { handleModalSubmit } from './modalHandler';
import { handleButtonClick } from './buttonHandler';

export async function setupEventHandlers(client: Client) {
  const guild = await client.guilds.fetch(config.guildId);
  
  // Setup button in creation channel
  const createPromoChannel = await guild.channels.fetch(config.channels.createPromo);
  if (createPromoChannel?.type === ChannelType.GuildText) {
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('create_promo_btn')
          .setLabel('➕ Créer une Promo')
          .setStyle(ButtonStyle.Primary)
      );
    
    await createPromoChannel.send({
      content: '**Création de Promo**\nCliquez sur le bouton ci-dessous pour créer une nouvelle promotion.',
      components: [row],
    });
  }

  // Setup button in inscription channel
  const inscriptionChannel = await guild.channels.fetch(config.channels.inscriptionRequests);
  if (inscriptionChannel?.type === ChannelType.GuildText) {
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('inscription_btn')
          .setLabel('📝 S\'inscrire à une Promo')
          .setStyle(ButtonStyle.Success)
      );
    
    await inscriptionChannel.send({
      content: '**Inscription aux Promos**\nCliquez sur le bouton ci-dessous pour vous inscrire.',
      components: [row],
    });
  }

  // Handle interactions
  client.on('interactionCreate', async (interaction) => {
    if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction);
    } else if (interaction.isButton()) {
      await handleButtonClick(interaction);
    }
  });
}