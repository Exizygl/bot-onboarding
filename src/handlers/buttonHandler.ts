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
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { apiService } from '../services/apiService';
import { config } from '../config/config';

// Caches
const userActionsCache = new Map<string, { action: string; data?: any }>();
const promoSelections = new Map<string, { formationId?: string; campusId?: string }>();

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

async function handleButton(interaction: ButtonInteraction) {
  const { customId } = interaction;

  if (customId === 'identify_btn') {
    await showIdentifyModal(interaction);
  } else if (customId === 'update_identity_btn') {
    await showUpdateIdentityModal(interaction);
  } else if (customId.startsWith('open_update_identity_modal_')) {
    await openUpdateIdentityModal(interaction);
  } else if (customId === 'create_formation_btn') {
    await showCreateFormationModal(interaction);
  } else if (customId === 'list_formations_btn') {
    await listFormations(interaction);
  } else if (customId.startsWith('open_edit_formation_modal_')) {
    await openEditFormationModal(interaction);
  } else if (customId === 'create_campus_btn') {
    await showCreateCampusModal(interaction);
  } else if (customId === 'list_campus_btn') {
    await listCampus(interaction);
  } else if (customId.startsWith('open_edit_campus_modal_')) {
    await openEditCampusModal(interaction);
  } else if (customId === 'create_promo_btn') {
    await showPromoStep1Dropdowns(interaction);
  } else if (customId === 'inscription_btn') {
    await showInscriptionDropdown(interaction);
  }else if (customId.startsWith('accept_')) {
  await handleAcceptInscription(interaction);
} else if (customId.startsWith('reject_')) {
  await handleRejectInscription(interaction);
}
}

async function handleSelectMenu(interaction: StringSelectMenuInteraction) {
  const { customId } = interaction;

  if (customId.startsWith('promo_select_formation_')) {
    await handlePromoFormationSelection(interaction);
  } else if (customId.startsWith('promo_select_campus_')) {
    await handlePromoCampusSelection(interaction);
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

  const user = await apiService.getUtilisateur(interaction.user.id);
  if (!user) {
    await interaction.editReply({ 
      content: '❌ Vous devez d\'abord vous identifier.' 
    });
    return;
  }

  userActionsCache.set(interaction.user.id, {
    action: 'update_identity',
    data: { nom: user.nom, prenom: user.prenom }
  });

  const button = new ButtonBuilder()
    .setCustomId(`open_update_identity_modal_${interaction.user.id}`)
    .setLabel('✏️ Ouvrir le formulaire')
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  await interaction.editReply({
    content: `**Modifier mes informations**\n\nInformations actuelles :\n• Nom : **${user.nom}**\n• Prénom : **${user.prenom}**\n\nCliquez ci-dessous :`,
    components: [row],
  });

  setTimeout(() => userActionsCache.delete(interaction.user.id), 5 * 60 * 1000);
}

async function openUpdateIdentityModal(interaction: ButtonInteraction) {
  const userId = interaction.customId.split('_')[4];
  const cachedData = userActionsCache.get(userId);

  if (!cachedData) {
    await interaction.reply({ content: '❌ Session expirée.', ephemeral: true });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId('update_identity_modal')
    .setTitle('Modifier mes informations');

  const nomInput = new TextInputBuilder()
    .setCustomId('user_nom')
    .setLabel('Nom')
    .setStyle(TextInputStyle.Short)
    .setValue(cachedData.data.nom)
    .setRequired(true);

  const prenomInput = new TextInputBuilder()
    .setCustomId('user_prenom')
    .setLabel('Prénom')
    .setStyle(TextInputStyle.Short)
    .setValue(cachedData.data.prenom)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(nomInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(prenomInput)
  );

  await interaction.showModal(modal);
  userActionsCache.delete(userId);
}

// ========== FORMATIONS ==========

async function showCreateFormationModal(interaction: ButtonInteraction) {
  const modal = new ModalBuilder()
    .setCustomId('create_formation_modal')
    .setTitle('Créer une Formation');

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
    new ActionRowBuilder<TextInputBuilder>().addComponents(nomInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(actifInput)
  );

  await interaction.showModal(modal);
}

async function listFormations(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const formations = await apiService.getFormations();

  if (formations.length === 0) {
    await interaction.editReply({ content: 'Aucune formation.' });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('📚 Liste des Formations')
    .setDescription(
      formations
        .map((f: any, i: number) => `**${i + 1}. ${f.nom}** (${f.actif ? '✅' : '❌'})\nID: \`${f.id}\``)
        .join('\n\n')
    )
    .setTimestamp();

  const buttons: ButtonBuilder[] = [];
  
  formations.slice(0, 25).forEach((f: any, i: number) => {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`open_edit_formation_modal_${f.id}`)
        .setLabel(`✏️ ${i + 1}. ${f.nom.substring(0, 20)}`)
        .setStyle(ButtonStyle.Secondary)
    );
  });

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(i, i + 5)));
  }

  await interaction.editReply({ embeds: [embed], components: rows });
}

async function openEditFormationModal(interaction: ButtonInteraction) {
  const formationId = interaction.customId.split('_')[4];
  const formations = await apiService.getFormations();
  const formation = formations.find((f: any) => f.id === formationId);

  if (!formation) {
    await interaction.reply({ content: '❌ Formation introuvable.', ephemeral: true });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(`update_formation_modal_${formationId}`)
    .setTitle(`Modifier ${formation.nom}`);

  const nomInput = new TextInputBuilder()
    .setCustomId('formation_nom')
    .setLabel('Nom')
    .setStyle(TextInputStyle.Short)
    .setValue(formation.nom)
    .setRequired(true);

  const actifInput = new TextInputBuilder()
    .setCustomId('formation_actif')
    .setLabel('Actif ? (true/false)')
    .setStyle(TextInputStyle.Short)
    .setValue(formation.actif ? 'true' : 'false')
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
    .setLabel('ID (snowflake)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('1000000000000000001')
    .setRequired(true);

  const nomInput = new TextInputBuilder()
    .setCustomId('campus_nom')
    .setLabel('Nom')
    .setStyle(TextInputStyle.Short)
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
    await interaction.editReply({ content: 'Aucun campus.' });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xe67e22)
    .setTitle('🏢 Liste des Campus')
    .setDescription(
      campus
        .map((c: any, i: number) => `**${i + 1}. ${c.nom}** (${c.actif ? '✅' : '❌'})\nID: \`${c.id}\``)
        .join('\n\n')
    )
    .setTimestamp();

  const buttons: ButtonBuilder[] = [];
  
  campus.slice(0, 25).forEach((c: any, i: number) => {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`open_edit_campus_modal_${c.id}`)
        .setLabel(`✏️ ${i + 1}. ${c.nom.substring(0, 20)}`)
        .setStyle(ButtonStyle.Secondary)
    );
  });

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(i, i + 5)));
  }

  await interaction.editReply({ embeds: [embed], components: rows });
}

async function openEditCampusModal(interaction: ButtonInteraction) {
  const campusId = interaction.customId.split('_')[4];
  const campusList = await apiService.getCampus();
  const campus = campusList.find((c: any) => c.id === campusId);

  if (!campus) {
    await interaction.reply({ content: '❌ Campus introuvable.', ephemeral: true });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(`update_campus_modal_${campusId}`)
    .setTitle(`Modifier ${campus.nom}`);

  const nomInput = new TextInputBuilder()
    .setCustomId('campus_nom')
    .setLabel('Nom')
    .setStyle(TextInputStyle.Short)
    .setValue(campus.nom)
    .setRequired(true);

  const actifInput = new TextInputBuilder()
    .setCustomId('campus_actif')
    .setLabel('Actif ? (true/false)')
    .setStyle(TextInputStyle.Short)
    .setValue(campus.actif ? 'true' : 'false')
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
      content: '❌ Aucune formation ou campus actif.' 
    });
    return;
  }

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

  const selection = promoSelections.get(userId) || {};
  selection.formationId = formationId;
  promoSelections.set(userId, selection);

  await interaction.deferUpdate();

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

  const selection = promoSelections.get(userId) || {};
  selection.campusId = campusId;
  promoSelections.set(userId, selection);

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

  setTimeout(() => promoSelections.delete(userId), 5 * 60 * 1000);
}

// ========== INSCRIPTION ==========

async function showInscriptionDropdown(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const promos = await apiService.getPromos();
  const promosEnAttente = promos.filter((p: any) => 
    p.statutPromo?.libelle === 'en attente'
  );

  if (promosEnAttente.length === 0) {
    await interaction.editReply({ content: '❌ Aucune promo disponible.' });
    return;
  }

  const options = promosEnAttente.map((promo: any) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(promo.nom)
      .setValue(promo.id)
      .setDescription(`Début: ${promo.dateDebut}`)
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

// ========== ACCEPT / REJECT ==========

async function handleAcceptInscription(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const identificationId = interaction.customId.split('_')[1];

  try {
    // Récupérer l'identification complète depuis l'API
    const identification = await apiService.getIdentification(identificationId);
    
    if (!identification) {
      await interaction.editReply({ content: '❌ Identification introuvable.' });
      return;
    }

    // Mettre à jour le statut à "accepté" (ID 2)
    await apiService.updateIdentification(identificationId, 2);

    const guild = interaction.guild!;
    const member = await guild.members.fetch(identification.utilisateur.id);
    await member.roles.add(config.roles.apprenant);

    // Notifier l'utilisateur
    const user = await interaction.client.users.fetch(identification.utilisateur.id);
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

  const identificationId = interaction.customId.split('_')[1];

  try {
    // Récupérer l'identification complète depuis l'API
    const identification = await apiService.getIdentification(identificationId);
    
    if (!identification) {
      await interaction.editReply({ content: '❌ Identification introuvable.' });
      return;
    }

    // Mettre à jour le statut à "refusé" (ID 3)
    await apiService.updateIdentification(identificationId, 3);

    // Notifier l'utilisateur
    const user = await interaction.client.users.fetch(identification.utilisateur.id);
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