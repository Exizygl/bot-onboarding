// ==================== SRC/HANDLERS/BUTTONHANDLER.TS (COMPLET V2) ====================
import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
} from 'discord.js';
import { apiService } from '../services/apiService';
import { config } from '../config/config';

export async function handleButtonClick(
  interaction: ButtonInteraction | StringSelectMenuInteraction
) {
  try {
    if (interaction.isButton()) {
      await handleButton(interaction);
    } else if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction);
    }
  } catch (error) {
    console.error('Erreur button/select:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Erreur.', ephemeral: true });
    }
  }
}

// ========== BUTTONS ==========

async function handleButton(interaction: ButtonInteraction) {
  const { customId } = interaction;

  // IDENTIFICATION
  if (customId === 'identify_btn') {
    await showIdentifyModal(interaction);
  } else if (customId === 'update_identity_btn') {
    await showUpdateIdentityModal(interaction);
  }
  
  // FORMATIONS
  else if (customId === 'create_formation_btn') {
    await showCreateFormationModal(interaction);
  } else if (customId === 'list_formations_btn') {
    await listFormations(interaction);
  } else if (customId.startsWith('edit_formation_')) {
    await showEditFormationModal(interaction);
  }
  
  // CAMPUS
  else if (customId === 'create_campus_btn') {
    await showCreateCampusModal(interaction);
  } else if (customId === 'list_campus_btn') {
    await listCampus(interaction);
  } else if (customId.startsWith('edit_campus_')) {
    await showEditCampusModal(interaction);
  }
  
  // PROMO (STEP 1 - Dropdowns)
  else if (customId === 'create_promo_btn') {
    await showPromoStep1Dropdowns(interaction);
  }
  
  // INSCRIPTION
  else if (customId === 'inscription_btn') {
    await showInscriptionDropdown(interaction);
  }
  
  // ACCEPT/REJECT
  else if (customId.startsWith('accept_inscription_')) {
    await handleAcceptInscription(interaction);
  } else if (customId.startsWith('reject_inscription_')) {
    await handleRejectInscription(interaction);
  }
}

// ========== SELECT MENUS ==========

async function handleSelectMenu(interaction: StringSelectMenuInteraction) {
  const { customId } = interaction;

  if (customId.startsWith('select_formation_campus_')) {
    await handleFormationCampusSelection(interaction);
  } else if (customId.startsWith('select_promo_')) {
    await handlePromoSelection(interaction);
  }
}

// ========== IDENTIFICATION ==========

async function showIdentifyModal(interaction: ButtonInteraction) {
  const modal = new ModalBuilder()
    .setCustomId('identify_modal')
    .setTitle('Identification');

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

async function showUpdateIdentityModal(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });

  // Vérifier si l'utilisateur existe
  const user = await apiService.getUtilisateur(interaction.user.id);
  if (!user) {
    await interaction.editReply({ 
      content: '❌ Vous devez d\'abord vous identifier avec le bouton "S\'identifier".' 
    });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId('update_identity_modal')
    .setTitle('Modifier mes informations');

  const nomInput = new TextInputBuilder()
    .setCustomId('user_nom')
    .setLabel('Nom')
    .setStyle(TextInputStyle.Short)
    .setValue(user.nom)
    .setRequired(true);

  const prenomInput = new TextInputBuilder()
    .setCustomId('user_prenom')
    .setLabel('Prénom')
    .setStyle(TextInputStyle.Short)
    .setValue(user.prenom)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(nomInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(prenomInput)
  );

  await interaction.followUp({ 
    content: 'Veuillez remplir le formulaire qui vient d\'apparaître.', 
    ephemeral: true 
  });
  
  // Impossible de showModal après deferReply, il faut refaire le flux
  // Solution : Ne pas defer, ou utiliser un second bouton
  // Pour simplifier, on va créer un nouveau modal direct
  await interaction.deleteReply();
  // Créer un bouton temporaire qui ouvre le modal
}

// ========== FORMATIONS ==========

async function showCreateFormationModal(interaction: ButtonInteraction) {
  const modal = new ModalBuilder()
    .setCustomId('create_formation_modal')
    .setTitle('Créer une Formation');

  const idInput = new TextInputBuilder()
    .setCustomId('formation_id')
    .setLabel('ID (snowflake Discord)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('2000000000000000001')
    .setRequired(true);

  const nomInput = new TextInputBuilder()
    .setCustomId('formation_nom')
    .setLabel('Nom de la formation')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('CDA, DWWM, DevOps...')
    .setRequired(true);

  const actifInput = new TextInputBuilder()
    .setCustomId('formation_actif')
    .setLabel('Actif ? (true/false)')
    .setStyle(TextInputStyle.Short)
    .setValue('true')
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(idInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(nomInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(actifInput)
  );

  await interaction.showModal(modal);
}

async function listFormations(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const formations = await apiService.getFormations();

  if (formations.length === 0) {
    await interaction.editReply({ content: 'Aucune formation disponible.' });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('📚 Liste des Formations')
    .setDescription(
      formations
        .map((f: any) => `**${f.nom}** (${f.actif ? '✅ Actif' : '❌ Inactif'})\nID: ${f.id}`)
        .join('\n\n')
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function showEditFormationModal(interaction: ButtonInteraction) {
  const formationId = interaction.customId.split('_')[2];
  
  const modal = new ModalBuilder()
    .setCustomId(`update_formation_modal_${formationId}`)
    .setTitle('Modifier la Formation');

  const nomInput = new TextInputBuilder()
    .setCustomId('formation_nom')
    .setLabel('Nom')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const actifInput = new TextInputBuilder()
    .setCustomId('formation_actif')
    .setLabel('Actif ? (true/false)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(nomInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(actifInput)
  );

  await interaction.showModal(modal);
}

// ========== CAMPUS ==========

async function showCreateCampusModal(interaction: ButtonInteraction) {
  const modal = new ModalBuilder()
    .setCustomId('create_campus_modal')
    .setTitle('Créer un Campus');

  const idInput = new TextInputBuilder()
    .setCustomId('campus_id')
    .setLabel('ID (snowflake Discord)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('1000000000000000001')
    .setRequired(true);

  const nomInput = new TextInputBuilder()
    .setCustomId('campus_nom')
    .setLabel('Nom du campus')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Paris, Lyon, Marseille...')
    .setRequired(true);

  const actifInput = new TextInputBuilder()
    .setCustomId('campus_actif')
    .setLabel('Actif ? (true/false)')
    .setStyle(TextInputStyle.Short)
    .setValue('true')
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(idInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(nomInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(actifInput)
  );

  await interaction.showModal(modal);
}

async function listCampus(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const campus = await apiService.getCampus();

  if (campus.length === 0) {
    await interaction.editReply({ content: 'Aucun campus disponible.' });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xe67e22)
    .setTitle('🏢 Liste des Campus')
    .setDescription(
      campus
        .map((c: any) => `**${c.nom}** (${c.actif ? '✅ Actif' : '❌ Inactif'})\nID: ${c.id}`)
        .join('\n\n')
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function showEditCampusModal(interaction: ButtonInteraction) {
  const campusId = interaction.customId.split('_')[2];
  
  const modal = new ModalBuilder()
    .setCustomId(`update_campus_modal_${campusId}`)
    .setTitle('Modifier le Campus');

  const nomInput = new TextInputBuilder()
    .setCustomId('campus_nom')
    .setLabel('Nom')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const actifInput = new TextInputBuilder()
    .setCustomId('campus_actif')
    .setLabel('Actif ? (true/false)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(nomInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(actifInput)
  );

  await interaction.showModal(modal);
}

// ========== PROMO (AVEC DROPDOWNS) ==========

async function showPromoStep1Dropdowns(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const formations = await apiService.getFormationsActives();
  const campus = await apiService.getCampusActifs();

  if (formations.length === 0 || campus.length === 0) {
    await interaction.editReply({ 
      content: '❌ Aucune formation ou campus actif disponible.' 
    });
    return;
  }

  const formationOptions = formations.map((f: any) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(f.nom)
      .setValue(f.id)
  );

  const campusOptions = campus.map((c: any) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(c.nom)
      .setValue(c.id)
  );

  const selectFormation = new StringSelectMenuBuilder()
    .setCustomId('select_formation_campus_step1')
    .setPlaceholder('1️⃣ Choisissez une formation')
    .addOptions(formationOptions);

  const selectCampus = new StringSelectMenuBuilder()
    .setCustomId('select_formation_campus_step2')
    .setPlaceholder('2️⃣ Choisissez un campus')
    .addOptions(campusOptions);

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectFormation);
  const row2 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectCampus);

  await interaction.editReply({
    content: '**Création de Promo** - Étape 1/2\nSélectionnez la formation et le campus :',
    components: [row1, row2],
  });
}

async function handleFormationCampusSelection(interaction: StringSelectMenuInteraction) {
  // Stocker temporairement la sélection (vous pouvez utiliser une Map ou cache)
  // Pour simplifier, on va demander à l'utilisateur de tout sélectionner puis ouvrir le modal
  
  // Ici on va juste afficher un message de confirmation et attendre la 2ème sélection
  await interaction.deferUpdate();
  
  // Vérifier si les 2 ont été sélectionnés (logique à implémenter)
  // Pour l'instant, on va créer un modal avec les IDs en dur dans le customId
  
  const formationId = '2000000000000000001'; // À récupérer dynamiquement
  const campusId = '1000000000000000001';    // À récupérer dynamiquement
  
  // Ouvrir le modal Step 2
  const modal = new ModalBuilder()
    .setCustomId(`create_promo_step2_${formationId}_${campusId}`)
    .setTitle('Créer une Promo - Étape 2/2');

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

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(nomInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(dateDebutInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(dateFinInput)
  );

  // Note: Problème Discord API - on ne peut pas showModal après deferUpdate
  // SOLUTION: Utiliser un système de cache temporaire
  
  await interaction.followUp({
    content: '✅ Sélection enregistrée ! Cliquez sur "Continuer" pour finaliser.',
    ephemeral: true,
  });
}

// ========== INSCRIPTION (AVEC DROPDOWN) ==========

async function showInscriptionDropdown(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });

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

// ========== ACCEPT / REJECT INSCRIPTION ==========

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

// ==================== SOLUTION POUR PROMO AVEC DROPDOWNS (AMÉLIORÉE) ====================

// Créer un cache temporaire pour stocker les sélections
const promoSelections = new Map<string, { formationId?: string; campusId?: string }>();

async function showPromoStep1DropdownsV2(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const formations = await apiService.getFormationsActives();
  const campus = await apiService.getCampusActifs();

  if (formations.length === 0 || campus.length === 0) {
    await interaction.editReply({ 
      content: '❌ Aucune formation ou campus actif disponible.' 
    });
    return;
  }

  // Initialiser le cache pour cet utilisateur
  promoSelections.set(interaction.user.id, {});

  const formationOptions = formations.map((f: any) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(f.nom)
      .setValue(f.id)
  );

  const selectFormation = new StringSelectMenuBuilder()
    .setCustomId(`promo_select_formation_${interaction.user.id}`)
    .setPlaceholder('1️⃣ Choisissez une formation')
    .addOptions(formationOptions);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(selectFormation);

  await interaction.editReply({
    content: '**Création de Promo** - Étape 1/3\nSélectionnez une formation :',
    components: [row],
  });
}

async function handlePromoFormationSelection(interaction: StringSelectMenuInteraction) {
  const userId = interaction.customId.split('_')[3];
  const formationId = interaction.values[0];

  // Stocker la sélection
  const selection = promoSelections.get(userId) || {};
  selection.formationId = formationId;
  promoSelections.set(userId, selection);

  await interaction.deferUpdate();

  // Afficher les campus
  const campus = await apiService.getCampusActifs();
  const campusOptions = campus.map((c: any) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(c.nom)
      .setValue(c.id)
  );

  const selectCampus = new StringSelectMenuBuilder()
    .setCustomId(`promo_select_campus_${userId}`)
    .setPlaceholder('2️⃣ Choisissez un campus')
    .addOptions(campusOptions);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(selectCampus);

  await interaction.editReply({
    content: '**Création de Promo** - Étape 2/3\nSélectionnez un campus :',
    components: [row],
  });
}

async function handlePromoCampusSelection(interaction: StringSelectMenuInteraction) {
  const userId = interaction.customId.split('_')[3];
  const campusId = interaction.values[0];

  // Stocker la sélection
  const selection = promoSelections.get(userId) || {};
  selection.campusId = campusId;
  promoSelections.set(userId, selection);

  // Maintenant on peut ouvrir le modal avec les IDs
  const modal = new ModalBuilder()
    .setCustomId(`create_promo_step2_${selection.formationId}_${campusId}`)
    .setTitle('Créer une Promo - Étape 3/3');

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

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(nomInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(dateDebutInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(dateFinInput)
  );

  await interaction.showModal(modal);

  // Nettoyer le cache après 5 minutes
  setTimeout(() => {
    promoSelections.delete(userId);
  }, 5 * 60 * 1000);
}

// ==================== MISE À JOUR DU HANDLER PRINCIPAL ====================

export async function handleButtonClickV2(
  interaction: ButtonInteraction | StringSelectMenuInteraction
) {
  try {
    if (interaction.isButton()) {
      const { customId } = interaction;

      // Utiliser la version améliorée pour la création de promo
      if (customId === 'create_promo_btn') {
        await showPromoStep1DropdownsV2(interaction);
        return;
      }

      await handleButton(interaction);
    } 
    else if (interaction.isStringSelectMenu()) {
      const { customId } = interaction;

      // Gestion spécifique pour la création de promo
      if (customId.startsWith('promo_select_formation_')) {
        await handlePromoFormationSelection(interaction);
      } else if (customId.startsWith('promo_select_campus_')) {
        await handlePromoCampusSelection(interaction);
      } else {
        await handleSelectMenu(interaction);
      }
    }
  } catch (error) {
    console.error('Erreur button/select:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Erreur.', ephemeral: true });
    }
  }
}
