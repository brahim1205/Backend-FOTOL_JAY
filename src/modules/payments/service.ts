import { v4 as uuidv4 } from 'uuid';
import prisma from '../../prisma';

// PayDunya configuration (simulé pour développement)
const PAYDUNYA_MASTER_KEY = process.env.PAYDUNYA_MASTER_KEY || 'test-master-key';
const PAYDUNYA_PRIVATE_KEY = process.env.PAYDUNYA_PRIVATE_KEY || 'test-private-key';
const PAYDUNYA_TOKEN = process.env.PAYDUNYA_TOKEN || 'test-token';
const PAYDUNYA_TEST_MODE = process.env.PAYDUNYA_TEST_MODE === 'true';

// Mock PayDunya service for development
class MockPaydunyaService {
  private invoices: Map<string, any> = new Map();

  createInvoice() {
    let config: any = {};

    return {
      setTotalAmount: (amount: number) => {
        config.amount = amount;
        return this;
      },
      setCurrency: (currency: string) => {
        config.currency = currency;
        return this;
      },
      setDescription: (desc: string) => {
        config.description = desc;
        return this;
      },
      setCallbackUrl: (url: string) => {
        config.callbackUrl = url;
        return this;
      },
      setReturnUrl: (url: string) => {
        config.returnUrl = url;
        return this;
      },
      setCancelUrl: (url: string) => {
        config.cancelUrl = url;
        return this;
      },
      create: async () => {
        const token = uuidv4();
        const invoice = {
          success: true,
          invoice_token: token,
          invoice_url: `https://paydunya.com/invoice/${token}`,
          response_text: 'Invoice created successfully',
          config: config
        };
        this.invoices.set(token, invoice);
        return invoice;
      },
      confirm: async (token: string) => {
        const invoice = this.invoices.get(token);
        if (invoice) {
          return {
            success: true,
            invoice: {
              status: 'completed',
              token: token
            }
          };
        }
        return {
          success: false,
          invoice: { status: 'not_found' }
        };
      }
    };
  }
}

const paydunya = new MockPaydunyaService();

export interface PaymentData {
  amount: number;
  currency: string;
  description: string;
  userId: string;
  type: 'credit_purchase' | 'vip_subscription' | 'product_sale';
  metadata?: any;
}

export interface PaydunyaResponse {
  success: boolean;
  invoice_url?: string;
  token?: string;
  response_text?: string;
  error?: string;
}

export class PaymentService {
  static async initiatePayment(paymentData: PaymentData): Promise<PaydunyaResponse> {
    try {
      const invoice = paydunya.createInvoice();

      // Configuration de la facture
      invoice.setTotalAmount(paymentData.amount);

      // Stocker la configuration pour référence
      (invoice as any).config = {
        amount: paymentData.amount,
        currency: paymentData.currency || 'XOF',
        description: paymentData.description
      };

      // Générer un token unique pour cette transaction
      const paymentToken = uuidv4();

      // Enregistrer la transaction en base
      await (prisma as any).paymentTransaction.create({
        data: {
          userId: paymentData.userId,
          type: paymentData.type,
          amount: paymentData.amount,
          currency: paymentData.currency || 'XOF',
          status: 'pending',
          paydunyaToken: paymentToken,
          metadata: {
            ...paymentData.metadata,
            description: paymentData.description
          }
        }
      });

      // Créer la facture PayDunya
      const response = await invoice.create();

      if (response.success) {
        // Mettre à jour avec le token PayDunya réel
        await (prisma as any).paymentTransaction.update({
          where: { paydunyaToken: paymentToken },
          data: {
            paydunyaRef: response.invoice_token,
            paydunyaToken: response.invoice_token
          }
        });

        return {
          success: true,
          invoice_url: response.invoice_url,
          token: response.invoice_token,
          response_text: response.response_text
        };
      } else {
        // Marquer comme échoué
        await (prisma as any).paymentTransaction.update({
          where: { paydunyaToken: paymentToken },
          data: { status: 'failed' }
        });

        return {
          success: false,
          error: response.response_text || 'Erreur lors de la création du paiement'
        };
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'initiation du paiement:', error);
      throw new Error('Impossible d\'initier le paiement');
    }
  }

  static async verifyPayment(token: string): Promise<any> {
    try {
      const invoice = paydunya.createInvoice();
      const response = await invoice.confirm(token);

      // Récupérer la transaction
      const transaction = await (prisma as any).paymentTransaction.findUnique({
        where: { paydunyaToken: token }
      });

      if (!transaction) {
        throw new Error('Transaction non trouvée');
      }

      if (response.success && response.invoice.status === 'completed') {
        // Mettre à jour le statut
        await (prisma as any).paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'completed',
            metadata: {
              ...transaction.metadata,
              paydunya_response: response
            }
          }
        });

        // Traiter le paiement selon le type
        await this.processSuccessfulPayment(transaction);

        return {
          success: true,
          status: 'completed',
          transaction: transaction
        };
      } else if (response.invoice.status === 'cancelled') {
        await (prisma as any).paymentTransaction.update({
          where: { id: transaction.id },
          data: { status: 'cancelled' }
        });

        return {
          success: false,
          status: 'cancelled',
          transaction: transaction
        };
      } else {
        return {
          success: false,
          status: 'pending',
          transaction: transaction
        };
      }
    } catch (error: any) {
      console.error('Erreur lors de la vérification du paiement:', error);
      throw new Error('Impossible de vérifier le paiement');
    }
  }

  private static async processSuccessfulPayment(transaction: any): Promise<void> {
    try {
      switch (transaction.type) {
        case 'credit_purchase':
          await this.processCreditPurchase(transaction);
          break;
        case 'vip_subscription':
          await this.processVipSubscription(transaction);
          break;
        case 'product_sale':
          await this.processProductSale(transaction);
          break;
        default:
          console.warn(`Type de paiement non reconnu: ${transaction.type}`);
      }
    } catch (error) {
      console.error('Erreur lors du traitement du paiement réussi:', error);
      // Ne pas throw ici pour ne pas casser le processus de vérification
    }
  }

  private static async processCreditPurchase(transaction: any): Promise<void> {
    // Créditer le compte utilisateur
    const creditAmount = Math.floor(transaction.amount / 100); // 1 crédit = 100 XOF

    await (prisma as any).credit.upsert({
      where: { userId: transaction.userId },
      update: { balance: { increment: creditAmount } },
      create: {
        userId: transaction.userId,
        balance: creditAmount
      }
    });

    // Créer une transaction de crédit
    await (prisma as any).creditTransaction.create({
      data: {
        userId: transaction.userId,
        type: 'earn',
        amount: creditAmount,
        description: 'Achat de crédits via PayDunya',
        reference: transaction.paydunyaRef
      }
    });
  }

  private static async processVipSubscription(transaction: any): Promise<void> {
    const plan = transaction.metadata?.plan || 'monthly';
    const endDate = new Date();

    if (plan === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Créer ou mettre à jour l'abonnement VIP
    await (prisma as any).vipSubscription.upsert({
      where: { userId: transaction.userId },
      update: {
        plan,
        endDate,
        isActive: true,
        paymentRef: transaction.paydunyaRef
      },
      create: {
        userId: transaction.userId,
        plan,
        endDate,
        isActive: true,
        paymentRef: transaction.paydunyaRef
      }
    });

    // Mettre à jour le statut VIP de l'utilisateur
    await (prisma as any).user.update({
      where: { id: transaction.userId },
      data: { isVip: true }
    });
  }

  private static async processProductSale(transaction: any): Promise<void> {
    // Pour les ventes de produits, créditer le vendeur
    // La logique dépend de votre modèle économique
    console.log('Traitement de la vente de produit:', transaction);
  }

  static async getPaymentHistory(userId: string, limit = 20, offset = 0): Promise<any[]> {
    return (prisma as any).paymentTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }

  static async getPaymentByToken(token: string): Promise<any> {
    return (prisma as any).paymentTransaction.findUnique({
      where: { paydunyaToken: token }
    });
  }

  static async createPayment(paymentData: PaymentData): Promise<any> {
    return this.initiatePayment(paymentData);
  }

  static async getPaymentStatus(transactionId: string): Promise<any> {
    return (prisma as any).paymentTransaction.findUnique({
      where: { id: transactionId }
    });
  }

  static async processCallback(callbackData: any): Promise<void> {
    // Logique de traitement du callback PayDunya
    console.log('Processing callback:', callbackData);
    // Ici vous pouvez implémenter la logique de vérification du callback
  }

  static async refundPayment(transactionId: string, reason: string): Promise<void> {
    // Logique de remboursement
    console.log('Processing refund for transaction:', transactionId, 'reason:', reason);
    // Ici vous pouvez implémenter la logique de remboursement via PayDunya
  }
}