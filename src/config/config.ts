export const config = {
    discordToken: process.env.DISCORD_TOKEN!,
    guildId: process.env.DISCORD_GUILD_ID!,
    apiBaseUrl: process.env.API_BASE_URL!,
    channels: {
      createPromo: process.env.CHANNEL_CREATE_PROMO!,
      inscriptionRequests: process.env.CHANNEL_INSCRIPTION_REQUESTS!,
      manageInscriptions: process.env.CHANNEL_MANAGE_INSCRIPTIONS!,
    },
    roles: {
      admin: process.env.ROLE_ADMIN!,
      formateur: process.env.ROLE_FORMATEUR!,
      apprenant: process.env.ROLE_APPRENANT!,
    },
    categories: {
      promos: process.env.CATEGORY_PROMOS!,
    },
  };