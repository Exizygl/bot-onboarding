// ==================== SRC/CRON/CRONJOBS.TS ====================
import { Client } from 'discord.js';
import cron from 'node-cron';
import { apiService } from '../services/apiService';
import { PromoManager } from '../managers/promoManager';
import { config } from '../config/config';

export function startCronJobs(client: Client) {
  
  // Vérifier les promos à démarrer toutes les heures
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Vérification des promos à démarrer...');
    
    try {
      const promosToStart = await apiService.getPromosToStart();
      
      if (!promosToStart || promosToStart.length === 0) {
        console.log('  ℹ️ Aucune promo à démarrer');
        return;
      }

      const guild = await client.guilds.fetch(config.guildId);

      for (const promo of promosToStart) {
        try {
          await PromoManager.startPromo(guild, promo);
          
          // Notifier dans un channel (optionnel)
          const channel = await guild.channels.fetch(config.channels.manageInscriptions);
          if (channel?.isTextBased()) {
            await channel.send(`🚀 La promo **${promo.nom}** a démarré !`);
          }
        } catch (error) {
          console.error(`Erreur démarrage ${promo.nom}:`, error);
        }
      }

    } catch (error) {
      console.error('Erreur lors de la vérification des promos à démarrer:', error);
    }
  });

  // Vérifier les promos à archiver toutes les heures
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Vérification des promos à archiver...');
    
    try {
      const promosToArchive = await apiService.getPromosToArchive();
      
      if (!promosToArchive || promosToArchive.length === 0) {
        console.log('  ℹ️ Aucune promo à archiver');
        return;
      }

      const guild = await client.guilds.fetch(config.guildId);

      for (const promo of promosToArchive) {
        try {
          await PromoManager.archivePromo(guild, promo);
          
          // Notifier dans un channel (optionnel)
          const channel = await guild.channels.fetch(config.channels.manageInscriptions);
          if (channel?.isTextBased()) {
            await channel.send(`📦 La promo **${promo.nom}** a été archivée.`);
          }
        } catch (error) {
          console.error(`Erreur archivage ${promo.nom}:`, error);
        }
      }

    } catch (error) {
      console.error('Erreur lors de la vérification des promos à archiver:', error);
    }
  });

  console.log('✅ Cron jobs démarrés');
  console.log('  - Vérification démarrage promos: toutes les heures');
  console.log('  - Vérification archivage promos: toutes les heures');
}