import { 
  ButtonInteraction, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
  StringSelectMenuBuilder
} from 'discord.js';
import { apiService } from '../services/apiService';
import { config } from '../config/config';

export async function handleButtonClick(interaction: ButtonInteraction | StringSelectMenuInteraction) {
  try {
    if (interaction.isButton()) {
      const button = interaction; // TS sait que c'est ButtonInteraction

      if (button.customId === 'create_promo_btn') {
        await handleCreatePromoButton(button);
      } else if (button.customId === 'inscription_btn') {
        await handleInscriptionButton(button);
      } else if (button.customId.startsWith('select_promo_')) {
        // attention, ce cas doit être isStringSelectMenu(), pas bouton
      } else if (button.customId.startsWith('accept_inscription_')) {
        await handleAcceptInscription(button);
      } else if (button.customId.startsWith('reject_inscription_')) {
        await handleRejectInscription(button);
      }
    } else if (interaction.isStringSelectMenu()) {
      // ici TS sait que c'est StringSelectMenuInteraction
      await handlePromoSelection(interaction);
    }
  } catch (error) {
    console.error('Erreur button:', error);
    if (interaction.isButton() || interaction.isStringSelectMenu()) {
      await interaction.reply({ 
        content: '❌ Une erreur est survenue.', 
        ephemeral: true 
      });
    }
  }
}

// --- Create Promo Button ---
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

// --- Inscription Button ---
async function handleInscriptionButton(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const promos = await apiService.getPromos();
  const promosEnAttente = promos.filter((p: any) => p.statutPromo?.libelle === 'en attente');

  if (promosEnAttente.length === 0) {
    await interaction.editReply({ content: '❌ Aucune promo disponible pour le moment.' });
    return;
  }

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

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  await interaction.editReply({
    content: '**Sélectionnez la promo à rejoindre :**',
    components: [row],
  });
}

// --- Promo Selection ---
async function handlePromoSelection(interaction: StringSelectMenuInteraction) {
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

// --- Accept / Reject Inscription ---
async function handleAcceptInscription(interaction: ButtonInteraction) { /* reste identique */ }
async function handleRejectInscription(interaction: ButtonInteraction) { /* reste identique */ }
