import { createSupabaseServerClient } from "@/lib/supabase-server";

type CreditSellerWalletArgs = {
  transactionId: string;
  sellerId: string;
  orderAmount: number;
  platformFeePercent?: number;
};

export async function creditSellerWallet({
  transactionId,
  sellerId,
  orderAmount,
  platformFeePercent = 15,
}: CreditSellerWalletArgs) {
  const supabase = await createSupabaseServerClient();

  const amount = Number(orderAmount);

  if (!amount || amount <= 0) {
    throw new Error("Invalid transaction amount.");
  }

  const platformFee = (amount * platformFeePercent) / 100;
  const sellerEarnings = amount - platformFee;

  const { data: existingEarning } = await supabase
    .from("wallet_transactions")
    .select("id")
    .eq("transaction_id", transactionId)
    .eq("seller_id", sellerId)
    .eq("type", "order_earning")
    .maybeSingle();

  if (existingEarning) {
    return {
      alreadyCredited: true,
      sellerEarnings: 0,
    };
  }

  const { data: seller, error: sellerError } = await supabase
    .from("sellers")
    .select("wallet_balance")
    .eq("id", sellerId)
    .single();

  if (sellerError || !seller) {
    throw new Error("Seller wallet not found.");
  }

  const currentBalance = Number(seller.wallet_balance || 0);
  const newBalance = currentBalance + sellerEarnings;

  const { error: updateError } = await supabase
    .from("sellers")
    .update({
      wallet_balance: newBalance,
    })
    .eq("id", sellerId);

  if (updateError) {
    throw new Error("Unable to update seller wallet.");
  }

  const { error: walletTransactionError } = await supabase
    .from("wallet_transactions")
    .insert({
      seller_id: sellerId,
      transaction_id: transactionId,
      reference: `EARNING-${transactionId}-${Date.now()}`,
      amount: sellerEarnings,
      type: "order_earning",
      status: "success",
    });

  if (walletTransactionError) {
    throw new Error("Unable to record seller earning.");
  }

  return {
    alreadyCredited: false,
    sellerEarnings,
    platformFee,
    newBalance,
  };
}