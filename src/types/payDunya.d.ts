declare module 'paydunya' {
  interface PaydunyaConfig {
    masterKey: string;
    privateKey: string;
    token: string;
    mode: 'test' | 'live';
  }

  interface InvoiceData {
    total_amount: number;
    description: string;
    items: Array<{
      name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
  }

  interface StoreData {
    name: string;
    website_url: string;
  }

  interface CustomData {
    [key: string]: any;
  }

  interface ActionsData {
    callback_url: string;
    return_url: string;
    cancel_url: string;
  }

  interface InvoiceResponse {
    response_text: {
      invoice_token: string;
      token: string;
      url: string;
      response_code: string;
      response_text: string;
      description: string;
      total_amount: number;
      currency: string;
    };
  }

  class Paydunya {
    constructor(config: PaydunyaConfig);
    invoice(): Invoice;
  }

  interface Invoice {
    setItems(items: InvoiceData['items']): void;
    setTotalAmount(amount: number): void;
    setDescription(description: string): void;
    setCallbackUrl(url: string): void;
    setReturnUrl(url: string): void;
    setCancelUrl(url: string): void;
    setCustomData(data: CustomData): void;
    create(): Promise<InvoiceResponse>;
    confirm(token: string): Promise<{
      response_text: {
        invoice_status: 'completed' | 'pending' | 'cancelled' | 'expired';
        total_amount: number;
        currency: string;
        invoice_token: string;
      };
    }>;
  }

  export = Paydunya;
}