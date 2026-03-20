import { NextRequest, NextResponse } from "next/server";
import MercadoPago, { Preference } from "mercadopago";

const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://doggy-onramp.vercel.app";

export async function GET() {
  return NextResponse.json({ tokenExists: !!MP_ACCESS_TOKEN, prefix: MP_ACCESS_TOKEN?.substring(0, 15) });
}

interface CreateOrderBody {
  mxnAmount: number;
  doggyAmount: number;
  usdcAmount: number;
  usdcMxnRate: number;
  userWallet: string;
  particleUserId: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderBody = await req.json();
    const { mxnAmount, doggyAmount, usdcAmount, usdcMxnRate, userWallet, particleUserId } = body;

    if (!mxnAmount || !doggyAmount || !userWallet) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    if (mxnAmount < 10) {
      return NextResponse.json({ error: "Monto mínimo $10 MXN" }, { status: 400 });
    }

    // Initialize MP SDK
    const client = new MercadoPago({ accessToken: MP_ACCESS_TOKEN });

    // Create preference using SDK
    const preference = await new Preference(client).create({
      body: {
        items: [
          {
            id: "doggy-token",
            title: "DOGGY Token",
            description: `Compra de ${doggyAmount.toFixed(2)} DOGGY via SPEI`,
            quantity: 1,
            unit_price: mxnAmount,
            currency_id: "MXN",
            category_id: "crypto",
          },
        ],
        payment_methods: {
          excluded_payment_types: [
            { id: "credit_card" },
            { id: "debit_card" },
            { id: "ticket" },
            { id: "digital_wallet" },
            { id: "digital_currency" },
          ],
          installments: 1,
        },
        back_urls: {
          success: `${BASE_URL}/app?purchase=success`,
          failure: `${BASE_URL}/app?purchase=failed`,
          pending: `${BASE_URL}/app?purchase=pending`,
        },
        auto_return: "approved",
        external_reference: JSON.stringify({ particleUserId, userWallet, doggyAmount, mxnAmount, usdcAmount }),
      },
    });

    return NextResponse.json({
      id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
    });
  } catch (err: any) {
    console.error("MP SDK Error:", err.message, err.cause);
    return NextResponse.json({ error: `Error MP: ${err.message || JSON.stringify(err)}` }, { status: 500 });
  }
}
