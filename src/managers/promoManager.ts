import { 
    Guild, 
    ChannelType, 
    PermissionFlagsBits,
    CategoryChannel,
    TextChannel,
    Collection
  } from 'discord.js';
  import { config } from '../config/config';
  import { apiService } from '../services/apiService';
  
  export class PromoManager {
    
    /**
     * Démarre une promo : clone la section template et configure les permissions
     */
    // Dans votre fichier promoManager.ts existant, remplacez la méthode startPromo

static async startPromo(guild: Guild, promo: any) {
  try {
    console.log(`🚀 Démarrage de la promo: ${promo.nom}`);

    // 1. Créer le rôle Discord pour la promo
    const promoRole = await guild.roles.create({
      name: `Promo ${promo.nom}`,
      color: 0x3498db,
      reason: `Démarrage promo ${promo.nom}`,
    });

    // 2. Récupérer la section template
    const templateCategory = await guild.channels.fetch(config.categories.template) as CategoryChannel;
    if (!templateCategory) {
      throw new Error('Section template introuvable !');
    }

    // 3. Créer la nouvelle section
    const newCategory = await guild.channels.create({
      name: `🎓 ${promo.nom}`,
      type: ChannelType.GuildCategory,
      reason: `Section pour la promo ${promo.nom}`,
    });

    // 4. Récupérer le rôle formateur depuis le cache
    const formateurRole = await guild.roles.fetch(config.roles.formateur);
    if (!formateurRole) {
      throw new Error('Rôle Formateur introuvable !');
    }

    // 5. Cloner tous les channels du template
    const templateChannels = templateCategory.children.cache;
    
    for (const [, channel] of templateChannels) {
      if (channel.type !== ChannelType.GuildText && 
          channel.type !== ChannelType.GuildVoice) continue;

      // Cloner le channel avec permissions
      const newChannel = await guild.channels.create({
        name: channel.name,
        type: channel.type,
        parent: newCategory.id,
        permissionOverwrites: [
          // @everyone ne peut pas voir
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          // Le rôle de la promo peut voir
          {
            id: promoRole.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
          // Les formateurs peuvent tout faire
          {
            id: formateurRole.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ManageMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ],
      });

      // Si c'est un channel "annonces", seuls les formateurs peuvent écrire
      if (channel.name.toLowerCase().includes('annonce')) {
        await newChannel.permissionOverwrites.edit(promoRole.id, {
          SendMessages: false,
        });
      }

      console.log(`  ✅ Channel créé: ${newChannel.name}`);
    }

    // 6. Mettre à jour la promo dans l'API
    await apiService.updatePromo(promo.id, {
      snowflake: promoRole.id,
      statut: {
        id: 2,
        libelle: 'actif',
      },
    });

    // 7. Attribuer les rôles aux utilisateurs acceptés
    await this.assignRolesToUsers(guild, promo, promoRole.id);

    console.log(`✅ Promo ${promo.nom} démarrée avec succès !`);
    return { category: newCategory, role: promoRole };

  } catch (error) {
    console.error('Erreur démarrage promo:', error);
    throw error;
  }
}
  
    /**
     * Archive une promo : supprime la section et retire les rôles
     */
    static async archivePromo(guild: Guild, promo: any) {
      try {
        console.log(`📦 Archivage de la promo: ${promo.nom}`);
  
        // 1. Trouver la section de la promo
        const categories = guild.channels.cache.filter(
          c => c.type === ChannelType.GuildCategory && 
               c.name.includes(promo.nom)
        ) as Collection<string, CategoryChannel>;
  
        const promoCategory = categories.first();
        
        if (promoCategory) {
          // 2. Supprimer tous les channels de la section
          const channels = promoCategory.children.cache;
          for (const [, channel] of channels) {
            await channel.delete('Archivage de la promo');
            console.log(`  🗑️ Channel supprimé: ${channel.name}`);
          }
  
          // 3. Supprimer la section
          await promoCategory.delete('Archivage de la promo');
          console.log(`  🗑️ Section supprimée`);
        }
  
        // 4. Supprimer le rôle Discord
        if (promo.snowflake) {
          const role = guild.roles.cache.get(promo.snowflake);
          if (role) {
            await role.delete('Archivage de la promo');
            console.log(`  🗑️ Rôle supprimé`);
          }
        }
  
        // 5. Retirer les rôles des utilisateurs
        await this.removeRolesFromUsers(guild, promo);
  
        // 6. Mettre à jour la promo dans l'API
        await apiService.updatePromo(promo.id, {
          statut: {
            id: 3,
            libelle: 'archivé',
          },
        });
  
        console.log(`✅ Promo ${promo.nom} archivée avec succès !`);
  
      } catch (error) {
        console.error('Erreur archivage promo:', error);
        throw error;
      }
    }
  
    /**
     * Attribue les rôles aux utilisateurs qui ont une identification acceptée
     */
    private static async assignRolesToUsers(guild: Guild, promo: any, roleId: string) {
      if (!promo.identifications) return;
  
      for (const identification of promo.identifications) {
        if (identification.statutIdentification?.libelle !== 'accepté') continue;
  
        try {
          const member = await guild.members.fetch(identification.utilisateur.id);
          await member.roles.add(roleId);
          console.log(`  👤 Rôle attribué à ${member.user.tag}`);
        } catch (error) {
          console.error(`Erreur attribution rôle pour ${identification.utilisateur.id}:`, error);
        }
      }
    }
  
    /**
     * Retire le rôle de la promo aux utilisateurs
     */
    private static async removeRolesFromUsers(guild: Guild, promo: any) {
      if (!promo.identifications || !promo.snowflake) return;
  
      for (const identification of promo.identifications) {
        try {
          const member = await guild.members.fetch(identification.utilisateur.id);
          await member.roles.remove(promo.snowflake);
          console.log(`  👤 Rôle retiré à ${member.user.tag}`);
        } catch (error) {
          console.error(`Erreur retrait rôle pour ${identification.utilisateur.id}:`, error);
        }
      }
    }
  }
  
  