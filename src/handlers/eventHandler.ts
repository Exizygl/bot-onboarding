import { Client, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from '../config/config';
import { handleModalSubmit } from './modalHandler';
import { handleButtonClick } from './buttonHandler';

export async function setupEventHandlers(client: Client) {
  const guild = await client.guilds.fetch(config.guildId);

  // 1. CHANNEL IDENTIFICATION
  const identificationChannel = await guild.channels.fetch(config.channels.identification);
  if (identificationChannel?.type === ChannelType.GuildText) {
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('identify_btn')
          .setLabel('👤 S\'identifier')
          .setStyle(ButtonStyle.Primary)
      );
    
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('update_identity_btn')
          .setLabel('✏️ Modifier mes informations')
          .setStyle(ButtonStyle.Secondary)
      );

    await identificationChannel.send({
      content: '**Identification**\nVeuillez vous identifier avec votre nom et prénom.\nVotre pseudo Discord sera automatiquement mis à jour.',
      components: [row1, row2],
    });
  }

  // 2. CHANNEL GESTION FORMATIONS
  const formationsChannel = await guild.channels.fetch(config.channels.manageFormations);
  if (formationsChannel?.type === ChannelType.GuildText) {
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('create_formation_btn')
          .setLabel('➕ Créer une Formation')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('list_formations_btn')
          .setLabel('📋 Voir les Formations')
          .setStyle(ButtonStyle.Secondary)
      );

    await formationsChannel.send({
      content: '**Gestion des Formations**\nCréez ou modifiez les formations disponibles.',
      components: [row],
    });
  }

  // 3. CHANNEL GESTION CAMPUS
  const campusChannel = await guild.channels.fetch(config.channels.manageCampus);
  if (campusChannel?.type === ChannelType.GuildText) {
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('create_campus_btn')
          .setLabel('➕ Créer un Campus')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('list_campus_btn')
          .setLabel('📋 Voir les Campus')
          .setStyle(ButtonStyle.Secondary)
      );

    await campusChannel.send({
      content: '**Gestion des Campus**\nCréez ou modifiez les campus disponibles.',
      components: [row],
    });
  }

  // 4. CHANNEL CRÉATION PROMO
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

  // 5. CHANNEL INSCRIPTIONS
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

  // HANDLE INTERACTIONS
  client.on('interactionCreate', async (interaction) => {
    if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction);
    } else if (interaction.isButton() || interaction.isStringSelectMenu()) {
      await handleButtonClick(interaction);
    }
  });
}