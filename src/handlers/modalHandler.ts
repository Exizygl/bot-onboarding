import { ModalSubmitInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import { apiService } from '../services/apiService';
import { config } from '../config/config';

/**
 * Fonction principale appelée à la soumission d'une modale
 */
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

/**
 * Crée une promotion via l'API et affiche un embed dans Discord
 */
async function handleCreatePromoModal(interaction: ModalSubmitInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const nom = interaction.fields.getTextInputValue('promo_nom');
  const dateDebut = interaction.fields.getTextInputValue('promo_date_debut');
  const dateFin = interaction.fields.getTextInputValue('promo_date_fin');
  const formationId = interaction.fields.getTextInputValue('promo_formation_id');
  const campusId = interaction.fields.getTextInputValue('promo_campus_id');

  try {
    const promo = await apiService.createPromo({ nom, dateDebut, dateFin, formationId, campusId });

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

/**
 * Gère la soumission d'une inscription utilisateur
 */
async function handleInscriptionModal(interaction: ModalSubmitInteraction) {
  const userId = interaction.customId.split('_')[2];
  const promoId = interaction.customId.split('_')[3];

  await interaction.deferReply({ ephemeral: true });

  const nom = interaction.fields.getTextInputValue('user_nom');
  const prenom = interaction.fields.getTextInputValue('user_prenom');

  try {
    // Créer ou récupérer l'utilisateur
    let utilisateur;
    try {
      utilisateur = await apiService.createUtilisateur({
        id: userId,
        nom,
        prenom,
        rolesId: [config.roles.apprenant],
      });
    } catch (error: any) {
      if (error.message?.includes('exists')) {
        utilisateur = { id: userId };
      } else {
        throw error;
      }
    }

    // Créer la demande d'identification
    const identification = await apiService.createIdentification({
      statutIdentificationId: 1,
      promoId,
      utilisateurId: userId,
    });

    // Récupérer le salon Discord et caster en TextChannel
    const channel = await interaction.client.channels.fetch(
      config.channels.manageInscriptions
    ) as TextChannel | null;

    if (!channel || !(channel instanceof TextChannel)) {
      console.error('❌ Le salon d’inscriptions n’est pas un salon texte !');
      await interaction.editReply({
        content: '❌ Le salon d’inscriptions est mal configuré.',
      });
      return;
    }

    // Créer l'embed
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

    // Créer les boutons
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

    // Créer le thread
    const thread = await channel.threads.create({
      name: `Demande ${nom} ${prenom}`,
      autoArchiveDuration: 60,
      reason: 'Nouvelle demande d\'inscription',
    });

    await thread.send({ embeds: [embed], components: [row] });

    await interaction.editReply({
      content: '✅ Votre demande a été envoyée ! Vous serez notifié de la décision.',
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    await interaction.editReply({
      content: '❌ Erreur lors de l\'inscription.',
    });
  }
}
