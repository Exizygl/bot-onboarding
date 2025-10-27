import { 
  ModalSubmitInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  TextChannel,
  Guild
} from 'discord.js';
import { apiService } from '../services/apiService';
import { config } from '../config/config';

export async function handleModalSubmit(interaction: ModalSubmitInteraction) {
  try {
    if (interaction.customId === 'identify_modal') {
      await handleIdentifyModal(interaction);
    } else if (interaction.customId === 'update_identity_modal') {
      await handleUpdateIdentityModal(interaction);
    } else if (interaction.customId === 'create_formation_modal') {
      await handleCreateFormationModal(interaction);
    } else if (interaction.customId.startsWith('update_formation_modal_')) {
      await handleUpdateFormationModal(interaction);
    } else if (interaction.customId === 'create_campus_modal') {
      await handleCreateCampusModal(interaction);
    } else if (interaction.customId.startsWith('update_campus_modal_')) {
      await handleUpdateCampusModal(interaction);
    } else if (interaction.customId.startsWith('create_promo_step2_')) {
      await handleCreatePromoStep2Modal(interaction);
    } else if (interaction.customId.startsWith('inscription_modal_')) {
      await handleInscriptionModal(interaction);
    }
  } catch (error) {
    console.error('Erreur modal:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: '❌ Une erreur est survenue.', 
        ephemeral: true 
      }).catch(() => {});
    }
  }
}

// ========== IDENTIFICATION ==========

async function handleIdentifyModal(interaction: ModalSubmitInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const nom = interaction.fields.getTextInputValue('user_nom');
  const prenom = interaction.fields.getTextInputValue('user_prenom');
  const userId = interaction.user.id;

  try {
    await apiService.createUtilisateur({
      id: userId,
      nom,
      prenom,
      rolesId: [config.roles.apprenant],
    });

    await changeUserNickname(interaction.guild!, userId, prenom, nom);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ Identification réussie !')
      .setDescription(`Bienvenue **${prenom} ${nom}** !`)
      .addFields({ name: 'Pseudo Discord', value: `Changé en : ${prenom} ${nom}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    if (error.message?.includes('exists')) {
      await interaction.editReply({ 
        content: '❌ Vous êtes déjà identifié. Utilisez "Modifier mes informations".' 
      });
    } else {
      await interaction.editReply({ content: '❌ Erreur lors de l\'identification.' });
    }
  }
}

async function handleUpdateIdentityModal(interaction: ModalSubmitInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const nom = interaction.fields.getTextInputValue('user_nom');
  const prenom = interaction.fields.getTextInputValue('user_prenom');
  const userId = interaction.user.id;

  try {
    const user = await apiService.getUtilisateur(userId);
    if (!user) {
      await interaction.editReply({ 
        content: '❌ Vous devez d\'abord vous identifier.' 
      });
      return;
    }

    await apiService.updateUtilisateur(userId, { nom, prenom });
    await changeUserNickname(interaction.guild!, userId, prenom, nom);

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('✅ Informations mises à jour !')
      .setDescription(`Vos informations ont été modifiées : **${prenom} ${nom}**`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    await interaction.editReply({ content: '❌ Erreur lors de la mise à jour.' });
  }
}

async function changeUserNickname(guild: Guild, userId: string, prenom: string, nom: string) {
  try {
    const member = await guild.members.fetch(userId);
    await member.setNickname(`${prenom} ${nom}`);
    console.log(`✅ Pseudo changé pour ${userId}: ${prenom} ${nom}`);
  } catch (error) {
    console.error('Erreur changement pseudo:', error);
  }
}

// ========== FORMATIONS (CORRIGÉ) ==========

async function handleCreateFormationModal(interaction: ModalSubmitInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const nom = interaction.fields.getTextInputValue('formation_nom');
  const actif = interaction.fields.getTextInputValue('formation_actif').toLowerCase() === 'true';

  try {
    const guild = interaction.guild!;
    
    // 1. Créer le rôle Discord AVANT (pour avoir son ID)
    const role = await guild.roles.create({
      name: `Formation ${nom}`,
      color: 0x9b59b6,
      reason: `Création formation ${nom}`,
    });

    // 2. Créer la formation dans l'API avec l'ID du rôle
    const formation = await apiService.createFormation({ 
      id: role.id,  // Utiliser l'ID du rôle Discord
      nom, 
      actif 
    });

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ Formation créée !')
      .addFields(
        { name: 'Nom', value: nom },
        { name: 'ID', value: role.id },
        { name: 'Actif', value: actif ? 'Oui' : 'Non' },
        { name: 'Rôle Discord', value: `<@&${role.id}>` }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur création formation:', error);
    await interaction.editReply({ content: '❌ Erreur lors de la création.' });
  }
}

async function handleUpdateFormationModal(interaction: ModalSubmitInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const formationId = interaction.customId.split('_')[3];
  const nom = interaction.fields.getTextInputValue('formation_nom');
  const actif = interaction.fields.getTextInputValue('formation_actif').toLowerCase() === 'true';

  try {
    await apiService.updateFormation(formationId, { nom, actif });

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('✅ Formation mise à jour !')
      .addFields(
        { name: 'Nom', value: nom },
        { name: 'Actif', value: actif ? 'Oui' : 'Non' }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    await interaction.editReply({ content: '❌ Erreur lors de la mise à jour.' });
  }
}

// ========== CAMPUS (CORRIGÉ) ==========

async function handleCreateCampusModal(interaction: ModalSubmitInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const nom = interaction.fields.getTextInputValue('campus_nom');
  const actif = interaction.fields.getTextInputValue('campus_actif').toLowerCase() === 'true';

  try {
    const guild = interaction.guild!;
    
    // 1. Créer le rôle Discord AVANT (pour avoir son ID)
    const role = await guild.roles.create({
      name: `Campus ${nom}`,
      color: 0xe67e22,
      reason: `Création campus ${nom}`,
    });

    // 2. Créer le campus dans l'API avec l'ID du rôle
    const campus = await apiService.createCampus({ 
      id: role.id,  // Utiliser l'ID du rôle Discord
      nom, 
      actif 
    });

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ Campus créé !')
      .addFields(
        { name: 'Nom', value: nom },
        { name: 'ID', value: role.id },
        { name: 'Actif', value: actif ? 'Oui' : 'Non' },
        { name: 'Rôle Discord', value: `<@&${role.id}>` }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur création campus:', error);
    await interaction.editReply({ content: '❌ Erreur lors de la création.' });
  }
}

async function handleUpdateCampusModal(interaction: ModalSubmitInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const campusId = interaction.customId.split('_')[3];
  const nom = interaction.fields.getTextInputValue('campus_nom');
  const actif = interaction.fields.getTextInputValue('campus_actif').toLowerCase() === 'true';

  try {
    await apiService.updateCampus(campusId, { nom, actif });

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('✅ Campus mis à jour !')
      .addFields(
        { name: 'Nom', value: nom },
        { name: 'Actif', value: actif ? 'Oui' : 'Non' }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    await interaction.editReply({ content: '❌ Erreur lors de la mise à jour.' });
  }
}

// ========== PROMO ==========

async function handleCreatePromoStep2Modal(interaction: ModalSubmitInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const formationId = interaction.customId.split('_')[3];
  const campusId = interaction.customId.split('_')[4];

  const nom = interaction.fields.getTextInputValue('promo_nom');
  const dateDebut = interaction.fields.getTextInputValue('promo_date_debut');
  const dateFin = interaction.fields.getTextInputValue('promo_date_fin');

  try {
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
    await interaction.editReply({ content: '❌ Erreur lors de la création.' });
  }
}

// ========== INSCRIPTION ==========

async function handleInscriptionModal(interaction: ModalSubmitInteraction) {
  const userId = interaction.customId.split('_')[2];
  const promoId = interaction.customId.split('_')[3];

  await interaction.deferReply({ ephemeral: true });

  const nom = interaction.fields.getTextInputValue('user_nom');
  const prenom = interaction.fields.getTextInputValue('user_prenom');

  console.log('=== INSCRIPTION DEBUG ===');
  console.log('User ID:', userId);
  console.log('Promo ID:', promoId);
  console.log('Nom:', nom, 'Prénom:', prenom);

  try {
    // Créer ou récupérer utilisateur
    let utilisateur;
    try {
      utilisateur = await apiService.createUtilisateur({
        id: userId,
        nom,
        prenom,
        rolesId: [config.roles.apprenant],
      });
      console.log('✅ Utilisateur créé');
    } catch (error: any) {
      if (error.message?.includes('exists') || error.message?.includes('Conflict')) {
        utilisateur = { id: userId };
        console.log('ℹ️ Utilisateur existe déjà');
      } else {
        console.error('❌ Erreur création utilisateur:', error);
        throw error;
      }
    }

    // Créer identification
    const identification = await apiService.createIdentification({
      statutIdentificationId: 1,
      promoId,
      utilisateurId: userId,
    });
    console.log('✅ Identification créée:', identification.id);

    // Récupérer le channel
    const channel = await interaction.client.channels.fetch(
      config.channels.manageInscriptions
    );
    console.log('Channel récupéré:', channel?.id, 'Type:', channel?.type);

    // Vérifier que c'est un TextChannel (type 0 = GuildText)
    if (!channel || channel.type !== 0) {
      console.error('❌ Channel introuvable ou mauvais type');
      await interaction.editReply({ 
        content: '❌ Salon d\'inscriptions mal configuré. Vérifiez l\'ID dans le .env' 
      });
      return;
    }

    // Import du type
    const { ChannelType } = await import('discord.js');
    
    // Cast en TextChannel de manière sûre
    if (channel.type !== ChannelType.GuildText) {
      console.error('❌ Le channel n\'est pas un salon textuel');
      await interaction.editReply({ content: '❌ Le channel doit être un salon textuel.' });
      return;
    }

    const textChannel = channel as TextChannel;

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle('📝 Nouvelle demande d\'inscription')
      .addFields(
        { name: 'Utilisateur', value: `<@${userId}>` },
        { name: 'Nom', value: nom, inline: true },
        { name: 'Prénom', value: prenom, inline: true },
        { name: 'Promo', value: promoId }
      )
      .setFooter({ text: `ID: ${identification.id}` })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>()
  .addComponents(
    new ButtonBuilder()
      .setCustomId(`accept_${identification.id}`)
      .setLabel('✅ Accepter')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`reject_${identification.id}`)
      .setLabel('❌ Refuser')
      .setStyle(ButtonStyle.Danger)
  );

    // Créer le thread
    const thread = await textChannel.threads.create({
      name: `Demande ${nom} ${prenom}`,
      autoArchiveDuration: 60,
      reason: 'Nouvelle demande d\'inscription',
    });
    console.log('✅ Thread créé:', thread.id);

    await thread.send({ embeds: [embed], components: [row] });
    console.log('✅ Message envoyé dans le thread');

    await interaction.editReply({ content: '✅ Demande envoyée !' });
    console.log('=== FIN INSCRIPTION ===');

  } catch (error) {
    console.error('❌ ERREUR INSCRIPTION:', error);
    await interaction.editReply({ 
      content: '❌ Erreur lors de l\'inscription. Vérifiez la console.' 
    });
  }
}