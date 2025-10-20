import { ModalSubmitInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { apiService } from '../services/apiService';
import { config } from '../config/config';

export async function handleModalSubmit(interaction: ModalSubmitInteraction) {
  try {
    if (interaction.customId === 'create_promo_modal') {
      await handleCreatePromoModal(interaction);
    } else if (interaction.customId.startsWith('inscription_modal_')) {
      await handleInscriptionModal(interaction);
    }
  } catch (error) {
    console.error('Erreur modal:', error);
    await interaction.reply({ 
      content: '❌ Une erreur est survenue.', 
      ephemeral: true 
    });
  }
}

async function handleCreatePromoModal(interaction: ModalSubmitInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const nom = interaction.fields.getTextInputValue('promo_nom');
  const dateDebut = interaction.fields.getTextInputValue('promo_date_debut');
  const dateFin = interaction.fields.getTextInputValue('promo_date_fin');
  const formationId = interaction.fields.getTextInputValue('promo_formation_id');
  const campusId = interaction.fields.getTextInputValue('promo_campus_id');

  try {
    // Créer la promo dans l'API
    const promo = await apiService.createPromo({
      nom,
      dateDebut,
      dateFin,
      formationId,
      campusId,
    });

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ Promo créée avec succès !')
      .addFields(
        { name: 'Nom', value: nom },
        { name: 'Début', value: dateDebut, inline: true },
        { name: 'Fin', value: dateFin, inline: true },
        { name: 'ID', value: promo.id }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    await interaction.editReply({ 
      content: '❌ Erreur lors de la création de la promo. Vérifiez les IDs formation/campus.' 
    });
  }
}

async function handleInscriptionModal(interaction: ModalSubmitInteraction) {
  const userId = interaction.customId.split('_')[2];
  const promoId = interaction.customId.split('_')[3];

  await interaction.deferReply({ ephemeral: true });

  const nom = interaction.fields.getTextInputValue('user_nom');
  const prenom = interaction.fields.getTextInputValue('user_prenom');

  try {
    // 1. Créer ou récupérer l'utilisateur
    let utilisateur;
    try {
      utilisateur = await apiService.createUtilisateur({
        id: userId,
        nom,
        prenom,
        rolesId: [config.roles.apprenant],
      });
    } catch (error: any) {
      // Si l'utilisateur existe déjà, on continue
      if (error.message?.includes('exists')) {
        utilisateur = { id: userId };
      } else {
        throw error;
      }
    }

    // 2. Créer la demande d'identification (statut "en attente")
    const identification = await apiService.createIdentification({
      statutIdentificationId: 1, // En attente
      promoId,
      utilisateurId: userId,
    });

    // 3. Créer un thread privé pour la demande
    const channel = await interaction.client.channels.fetch(config.channels.manageInscriptions);
    if (!channel?.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle('📝 Nouvelle demande d\'inscription')
      .addFields(
        { name: 'Utilisateur', value: `<@${userId}>` },
        { name: 'Nom', value: nom, inline: true },
        { name: 'Prénom', value: prenom, inline: true },
        { name: 'Promo', value: promoId }
      )
      .setFooter({ text: `ID Identification: ${identification.id}` })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`accept_inscription_${identification.id}_${userId}_${promoId}`)
          .setLabel('✅ Accepter')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`reject_inscription_${identification.id}_${userId}`)
          .setLabel('❌ Refuser')
          .setStyle(ButtonStyle.Danger)
      );

    const thread = await channel.threads.create({
      name: `Demande ${nom} ${prenom}`,
      autoArchiveDuration: 60,
      reason: 'Nouvelle demande d\'inscription',
    });

    await thread.send({ embeds: [embed], components: [row] });

    await interaction.editReply({ 
      content: '✅ Votre demande a été envoyée ! Vous serez notifié de la décision.' 
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    await interaction.editReply({ 
      content: '❌ Erreur lors de l\'inscription.' 
    });
  }
}