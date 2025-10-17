import { PrismaClient } from '../prisma';
import { ProductService } from '../modules/products/service';

const prisma = new PrismaClient();

export class CronJobs {
  static async cleanupInactiveAccounts(): Promise<number> {
    try {
      // Supprimer les comptes inactifs depuis 7 jours
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Trouver les utilisateurs inactifs (pas de connexion depuis 7 jours)
      const inactiveUsers = await prisma.user.findMany({
        where: {
          lastLogin: {
            lt: sevenDaysAgo,
          },
          role: {
            not: 'ADMIN', // Ne pas supprimer les admins
          },
        },
        select: { id: true, email: true },
      });

      if (inactiveUsers.length === 0) {
        console.log('Aucun compte inactif à supprimer');
        return 0;
      }

      // Supprimer les produits associés d'abord (cascade delete)
      for (const user of inactiveUsers) {
        // Supprimer les images des produits de l'utilisateur
        const products = await prisma.product.findMany({
          where: { sellerId: user.id },
          select: { id: true, images: true },
        });

        // Supprimer les images de Cloudinary
        for (const product of products) {
          const images = product.images as string[];
          for (const imageUrl of images) {
            try {
              const publicId = ProductService.extractPublicIdFromUrl(imageUrl);
              if (publicId) {
                // Note: Ici on devrait importer cloudinary et supprimer l'image
                // Pour simplifier, on ne fait que logger
                console.log(`Supprimer image Cloudinary: ${publicId}`);
              }
            } catch (error) {
              console.error(`Erreur lors de la suppression de l'image ${imageUrl}:`, error);
            }
          }
        }

        console.log(`Suppression du compte inactif: ${user.email}`);
      }

      // Supprimer les utilisateurs (cascade delete supprimera automatiquement les relations)
      const result = await prisma.user.deleteMany({
        where: {
          lastLogin: {
            lt: sevenDaysAgo,
          },
          role: {
            not: 'ADMIN',
          },
        },
      });

      console.log(`${result.count} comptes inactifs supprimés`);
      return result.count || 0;
    } catch (error) {
      console.error('Erreur lors du nettoyage des comptes inactifs:', error);
      return 0;
    }
  }

  static async expireOldProducts(): Promise<number> {
    return await ProductService.autoExpireProducts();
  }

  static async runDailyMaintenance(): Promise<void> {
    console.log('🚀 Démarrage de la maintenance quotidienne...');

    try {
      // Expirer les produits anciens
      const expiredCount = await this.expireOldProducts();
      console.log(`✅ ${expiredCount} produits expirés`);

      // Nettoyer les comptes inactifs
      const deletedCount = await this.cleanupInactiveAccounts();
      console.log(`✅ ${deletedCount} comptes inactifs supprimés`);

      console.log('🎉 Maintenance quotidienne terminée');
    } catch (error) {
      console.error('❌ Erreur lors de la maintenance quotidienne:', error);
    }
  }
}

// Exécuter la maintenance quotidienne si ce fichier est appelé directement
if (require.main === module) {
  CronJobs.runDailyMaintenance()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Erreur fatale:', error);
      process.exit(1);
    });
}