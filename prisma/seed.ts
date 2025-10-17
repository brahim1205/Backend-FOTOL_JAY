import { PrismaClient } from '../src/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Créer un utilisateur admin unique
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: '$2b$12$gQkkFQvSFbFV3vGwo02X7uCrSKj0OfZGhGbulkYCDTfkkfNxyhAeu', // password: admin123
      firstName: 'Admin',
      lastName: 'FOTOLJAY',
      role: 'ADMIN',
      isVip: true,
      emailVerified: true,
    },
  });

  // Créer quelques utilisateurs de test
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      email: 'user1@example.com',
      password: '$2b$12$gQkkFQvSFbFV3vGwo02X7uCrSKj0OfZGhGbulkYCDTfkkfNxyhAeu', // password: admin123
      firstName: 'Jean',
      lastName: 'Dupont',
      role: 'USER',
      phone: '+221771234567',
      location: 'Dakar',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      email: 'user2@example.com',
      password: '$2b$12$gQkkFQvSFbFV3vGwo02X7uCrSKj0OfZGhGbulkYCDTfkkfNxyhAeu', // password: admin123
      firstName: 'Marie',
      lastName: 'Martin',
      role: 'VIP',
      isVip: true,
      phone: '+221772345678',
      location: 'Thiès',
    },
  });

  // Créer un utilisateur de test pour l'inscription
  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: '$2b$12$GJFsNoCPipZzjZS8kucvP.PCA5NIAiZsMSDz6Q6v7SH3H3AZDa6qS', // password: admin123
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      phone: '+221773456789',
      location: 'Dakar',
    },
  });

  // Créer des catégories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Électronique' },
      update: {},
      create: {
        name: 'Électronique',
        description: 'Téléphones, ordinateurs, accessoires électroniques',
        icon: '📱',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Véhicules' },
      update: {},
      create: {
        name: 'Véhicules',
        description: 'Voitures, motos, vélos',
        icon: '🚗',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Immobilier' },
      update: {},
      create: {
        name: 'Immobilier',
        description: 'Maisons, appartements, terrains',
        icon: '🏠',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Mode' },
      update: {},
      create: {
        name: 'Mode',
        description: 'Vêtements, chaussures, accessoires',
        icon: '👕',
      },
    }),
  ]);

  // Créer des localisations
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        name: 'Dakar',
        latitude: 14.7167,
        longitude: -17.4677,
      },
    }),
    prisma.location.create({
      data: {
        name: 'Thiès',
        latitude: 14.7894,
        longitude: -16.9263,
      },
    }),
    prisma.location.create({
      data: {
        name: 'Saint-Louis',
        latitude: 16.0179,
        longitude: -16.4896,
      },
    }),
  ]);

  // Créer des produits de test
  const products = await Promise.all([
    prisma.product.create({
      data: {
        title: 'iPhone 13 Pro Max',
        description: 'iPhone 13 Pro Max 256GB en excellent état. Garantie 6 mois.',
        price: 850000,
        images: ['https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&h=600&fit=crop'],
        status: 'APPROVED',
        sellerId: user1.id,
        location: 'Dakar',
        category: 'Électronique',
        condition: 'Neuf',
        categoryId: categories[0].id,
        locationId: locations[0].id,
        expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      },
    }),
    prisma.product.create({
      data: {
        title: 'Honda CB 600',
        description: 'Moto Honda CB 600 Hornet 2008, très bien entretenue.',
        price: 1200000,
        images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'],
        status: 'APPROVED',
        sellerId: user2.id,
        location: 'Thiès',
        category: 'Véhicules',
        condition: 'Occasion',
        categoryId: categories[1].id,
        locationId: locations[1].id,
        expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.product.create({
      data: {
        title: 'Appartement 3 pièces',
        description: 'Bel appartement 3 pièces à Dakar Plateau, meublé.',
        price: 2500000,
        images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop'],
        status: 'APPROVED',
        sellerId: user1.id,
        location: 'Dakar',
        category: 'Immobilier',
        condition: 'Neuf',
        categoryId: categories[2].id,
        locationId: locations[0].id,
        expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  // Créer des crédits pour les utilisateurs
  await Promise.all([
    prisma.credit.upsert({
      where: { userId: user1.id },
      update: {},
      create: {
        userId: user1.id,
        balance: 500,
      },
    }),
    prisma.credit.upsert({
      where: { userId: user2.id },
      update: {},
      create: {
        userId: user2.id,
        balance: 1000,
      },
    }),
  ]);

  // Créer des abonnements VIP
  await prisma.vipSubscription.upsert({
    where: { userId: user2.id },
    update: {},
    create: {
      userId: user2.id,
      plan: 'monthly',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      isActive: true,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin user: admin@example.com / admin123');
  console.log('👥 Test users: user1@example.com, user2@example.com / admin123');
  console.log(`📦 Created ${products.length} products`);
  console.log(`📂 Created ${categories.length} categories`);
  console.log(`📍 Created ${locations.length} locations`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });