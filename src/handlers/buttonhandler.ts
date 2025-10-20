import { 
    ButtonInteraction, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
  } from 'discord.js';
  import { apiService } from '../services/apiService';
  import { config } from '../config/config';
  import { PromoManager } from '../managers/promoManager';
  
  export async function handleButtonClick(interaction: ButtonInteraction) {
    try {
      if (interaction.customId === 'create_promo_btn') {
        await handleCreatePromoButton(interaction);
      } else if (interaction.customId === 'inscription_btn') {
        await handleInscriptionButton(interaction);
      } else if (interaction.customId.startsWith('select_promo_')) {
        await handlePromoSelection(interaction);
      } else if (interaction.customId.startsWith('accept_inscription_')) {
        await handleAcceptInscription(interaction);
      } else if (interaction.customId.startsWith('reject_inscription_')) {
        await handleRejectInscription(interaction);
      }
    } catch (error) {
      console.error('Erreur button:', error);
      await interaction.reply({ 
        content: '❌ Une erreur est survenue.', 
        ephemeral: true 
      });
    }
  }
  
  async function handleCreatePromoButton(interaction: ButtonInteraction) {
    const modal = new ModalBuilder()
      .setCustomId('create_promo_modal')
      .setTitle('Créer une nouvelle Promo');
  
    const nomInput = new TextInputBuilder()
      .setCustomId('promo_nom')
      .setLabel('Nom de la promo')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('CDA Paris 2025')
      .setRequired(true);
  
    const dateDebutInput = new TextInputBuilder()
      .setCustomId('promo_date_debut')
      .setLabel('Date de début (YYYY-MM-DD)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('2025-03-01')
      .setRequired(true);
  
    const dateFinInput = new TextInputBuilder()
      .setCustomId('promo_date_fin')
      .setLabel('Date de fin (YYYY-MM-DD)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('2025-12-31')
      .setRequired(true);
  
    const formationInput = new TextInputBuilder()
      .setCustomId('promo_formation_id')
      .setLabel('ID Formation')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('2000000000000000001')
      .setRequired(true);
  
    const campusInput = new TextInputBuilder()
      .setCustomId('promo_campus_id')
      .setLabel('ID Campus')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('1000000000000000001')
      .setRequired(true);
  
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(nomInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(dateDebutInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(dateFinInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(formationInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(campusInput)
    );
  
    await interaction.showModal(modal);
  }
  
  async function handleInscriptionButton(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });
  
    // Récupérer les promos disponibles
    const promos = await apiService.getPromos();
    const promosEnAttente = promos.filter((p: any) => 
      p.statutPromo?.libelle === 'en attente'
    );
  
    if (promosEnAttente.length === 0) {
      await interaction.editReply({ 
        content: '❌ Aucune promo disponible pour le moment.' 
      });
      return;
    }
  
    // Créer le select menu
    const options = promosEnAttente.map((promo: any) => 
      new StringSelectMenuOptionBuilder()
        .setLabel(promo.nom)
        .setValue(promo.id)
        .setDescription(`Début: ${promo.dateDebut} - Fin: ${promo.dateFin}`)
    );
  
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`select_promo_${interaction.user.id}`)
      .setPlaceholder('Choisissez une promo')
      .addOptions(options);
  
    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);
  
    await interaction.editReply({
      content: '**Sélectionnez la promo à rejoindre :**',
      components: [row],
    });
  }
  
  async function handlePromoSelection(interaction: ButtonInteraction) {
    if (!interaction.isStringSelectMenu()) return;
  
    const userId = interaction.customId.split('_')[2];
    const promoId = interaction.values[0];
  
    const modal = new ModalBuilder()
      .setCustomId(`inscription_modal_${userId}_${promoId}`)
      .setTitle('Formulaire d\'inscription');
  
    const nomInput = new TextInputBuilder()
      .setCustomId('user_nom')
      .setLabel('Nom')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
  
    const prenomInput = new TextInputBuilder()
      .setCustomId('user_prenom')
      .setLabel('Prénom')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
  
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(nomInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(prenomInput)
    );
  
    await interaction.showModal(modal);
  }
  
  async function handleAcceptInscription(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });
  
    const [, , identificationId, userId, promoId] = interaction.customId.split('_');
  
    try {
      // Mettre à jour le statut à "accepté"
      await apiService.updateIdentification(identificationId, 2);
  
      // Attribuer le rôle apprenant
      const guild = interaction.guild!;
      const member = await guild.members.fetch(userId);
      await member.roles.add(config.roles.apprenant);
  
      // Notifier l'utilisateur
      const user = await interaction.client.users.fetch(userId);
      await user.send(`✅ Votre demande d'inscription a été acceptée !`);
  
      // Archiver le thread
      if (interaction.channel?.isThread()) {
        await interaction.channel.setArchived(true);
      }
  
      await interaction.editReply({ content: '✅ Inscription acceptée !' });
    } catch (error) {
      console.error('Erreur acceptation:', error);
      await interaction.editReply({ content: '❌ Erreur lors de l\'acceptation.' });
    }
  }
  
  async function handleRejectInscription(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });
  
    const [, , identificationId, userId] = interaction.customId.split('_');
  
    try {
      // Mettre à jour le statut à "refusé"
      await apiService.updateIdentification(identificationId, 3);
  
      // Notifier l'utilisateur
      const user = await interaction.client.users.fetch(userId);
      await user.send(`❌ Votre demande d'inscription a été refusée.`);
  
      // Archiver le thread
      if (interaction.channel?.isThread()) {
        await interaction.channel.setArchived(true);
      }
  
      await interaction.editReply({ content: '✅ Inscription refusée.' });
    } catch (error) {
      console.error('Erreur refus:', error);
      await interaction.editReply({ content: '❌ Erreur lors du refus.' });
    }
  }