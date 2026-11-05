"use client";


import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase-client";


type Bank = {
  name: string;
  code: string;
};


type WalletTransaction = {
  id: string;
  transaction_id: string | null;
  amount: number;
  type: string;
  status: string;
  created_at: string;
};


export default function WithdrawalsPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);


  const [savedBank, setSavedBank] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [walletHistory, setWalletHistory] = useState<WalletTransaction[]>([]);


  useEffect(() => {
    const loadBanks = async () => {
      const response = await fetch("/api/banks");
      const data = await response.json();


      if (response.ok) {
        const uniqueBanks = (data.banks || []).filter(
          (bank: Bank, index: number, array: Bank[]) =>
            array.findIndex(
              (item) => item.name === bank.name && item.code === bank.code
            ) === index
        );


        setBanks(uniqueBanks);
      } else {
        setMessage(data.error || "Unable to load banks.");
      }
    };


    const loadSavedBank = async () => {
      const supabase = createSupabaseClient();


      const {
        data: { session },
      } = await supabase.auth.getSession();


      const token = session?.access_token;


      if (!token) return;


      const response = await fetch("/api/seller/bank-details", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });


      const data = await response.json();


      if (response.ok) {
        setSavedBank(data.bankAccount);
        setWalletBalance(data.walletBalance || 0);
      }
    };


    const loadWalletHistory = async () => {
      const supabase = createSupabaseClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user?.id;

      if (!userId) return;

      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("id, transaction_id, amount, type, status, created_at")
        .eq("seller_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setWalletHistory(data);
      }
    };

    loadBanks();
    loadSavedBank();
    loadWalletHistory();
  }, []);


  const verifyAccount = async () => {
    setMessage("");
    setAccountName("");


    if (!accountNumber || !bankCode) {
      setMessage("Enter your account number and select your bank.");
      return;
    }


    setVerifying(true);


    try {
      const response = await fetch("/api/bank/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountNumber,
          bankCode,
        }),
      });


      const data = await response.json();


      if (!response.ok) {
        setMessage(data.error || "We could not verify this account.");
        return;
      }


      setAccountName(data.accountName);
      setMessage("Account verified successfully.");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  };


  const saveBankDetails = async () => {
    if (!accountName) {
      setMessage("Verify your account before saving.");
      return;
    }


    setSaving(true);
    setMessage("");


    try {
      const supabase = createSupabaseClient();


      const {
        data: { session },
      } = await supabase.auth.getSession();


      const token = session?.access_token;


      if (!token) {
        setMessage("Please sign in again.");
        return;
      }


      const selectedBank = banks.find((bank) => bank.code === bankCode);


      const response = await fetch("/api/seller/bank-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bankName: selectedBank?.name,
          bankCode,
          accountNumber,
          accountName,
        }),
      });


      const data = await response.json();


      if (!response.ok) {
        setMessage(data.error || "We could not save your bank details.");
        return;
      }


      setMessage("Bank details saved successfully.");


      const savedResponse = await fetch("/api/seller/bank-details", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });


      const savedData = await savedResponse.json();


      if (savedResponse.ok) {
        setSavedBank(savedData.bankAccount);
        setWalletBalance(savedData.walletBalance || 0);
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };


  const withdrawFunds = async () => {
    setMessage("");
    setWithdrawing(true);


    const amount = Number(withdrawAmount);


    if (!amount || amount < 1000) {
      setMessage("Minimum withdrawal is ₦1,000.");
      setWithdrawing(false);
      return;
    }


    if (amount > walletBalance) {
      setMessage("Insufficient funds.");
      setWithdrawing(false);
      return;
    }


    try {
      const supabase = createSupabaseClient();


      const {
        data: { session },
      } = await supabase.auth.getSession();


      const token = session?.access_token;


      if (!token) {
        setMessage("Please sign in again.");
        return;
      }


      const response = await fetch("/api/seller/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
        }),
      });


      const data = await response.json();


      if (!response.ok) {
        setMessage(data.error || "We could not process this withdrawal.");
        return;
      }


      setMessage(
        `Withdrawal of ₦${Number(data.amount).toLocaleString(
          "en-NG"
        )} is being sent to your bank.`
      );


      setWalletBalance(data.newBalance);
      setWithdrawAmount("");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setWithdrawing(false);
    }
  };


  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid var(--pm-border)",
    background: "var(--pm-bg)",
    color: "var(--pm-text)",
  };


  const card: React.CSSProperties = {
    background: "var(--pm-surface)",
    borderRadius: 20,
    padding: 22,
    border: "1px solid var(--pm-border)",
    boxShadow: "var(--pm-shadow)",
  };


  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--pm-bg)",
        color: "var(--pm-text)",
        fontFamily: "Plus Jakarta Sans, Arial, sans-serif",
      }}
    >
      <header
        style={{
          background: "var(--pm-surface)",
          borderBottom: "1px solid var(--pm-border)",
          padding: "18px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
            Withdrawals
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--pm-muted)", fontSize: 14 }}>
            Manage your wallet and payout account
          </p>
        </div>


        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/transactions"
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              background: "var(--pm-bg)",
              color: "var(--pm-text)",
              border: "1px solid var(--pm-border)",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            View my transactions
          </Link>

          <Link
            href="/seller/dashboard"
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              background: "var(--pm-bg)",
              color: "var(--pm-text)",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Back to dashboard
          </Link>
        </div>
      </header>


      <main
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "28px 20px 60px",
          display: "grid",
          gap: 20,
        }}
      >
        {/* Message */}
        {message && (
          <div
            style={{
              background: "var(--pm-surface)",
              border: "1px solid var(--pm-border)",
              borderRadius: 16,
              padding: 16,
              fontWeight: 700,
              color: "#b7791f",
            }}
          >
            {message}
          </div>
        )}


        {/* Wallet */}
        <div style={card}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            My Wallet
          </h2>


          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              marginTop: 18,
            }}
          >
            <div
              style={{
                background: "var(--pm-bg)",
                borderRadius: 16,
                padding: 18,
                border: "1px solid var(--pm-border)",
              }}
            >
              <p style={{ margin: 0, color: "var(--pm-muted)", fontSize: 13 }}>
                Available balance
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 24, fontWeight: 800 }}>
                ₦{Number(walletBalance).toLocaleString("en-NG")}
              </p>
            </div>


            <div
              style={{
                background: "var(--pm-bg)",
                borderRadius: 16,
                padding: 18,
                border: "1px solid var(--pm-border)",
              }}
            >
              <p style={{ margin: 0, color: "var(--pm-muted)", fontSize: 13 }}>
                Pending clearance
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 24, fontWeight: 800 }}>
                ₦0.00
              </p>
            </div>


            <div
              style={{
                background: "var(--pm-bg)",
                borderRadius: 16,
                padding: 18,
                border: "1px solid var(--pm-border)",
              }}
            >
              <p style={{ margin: 0, color: "var(--pm-muted)", fontSize: 13 }}>
                Total withdrawn
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 24, fontWeight: 800 }}>
                ₦0.00
              </p>
            </div>
          </div>
        </div>


        {/* Wallet history */}
        <div style={card}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            Wallet history
          </h2>


          {walletHistory.length === 0 ? (
            <p style={{ margin: "12px 0 0", color: "var(--pm-muted)" }}>
              No wallet activity yet.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              {walletHistory.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    background: "var(--pm-bg)",
                    border: "1px solid var(--pm-border)",
                    borderRadius: 16,
                    padding: 16,
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 800 }}>
                      {item.type === "credit"
                        ? `Sale credit: ₦${Number(item.amount).toLocaleString("en-NG")}`
                        : `Withdrawal: ₦${Number(item.amount).toLocaleString("en-NG")}`}
                    </p>

                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 13,
                        color: "var(--pm-muted)",
                      }}
                    >
                      {new Date(item.created_at).toLocaleString()} · {item.status}
                    </p>
                  </div>

                  {item.type === "credit" && item.transaction_id && (
                    <Link
                      href={`/transactions/${item.transaction_id}`}
                      style={{
                        padding: "10px 16px",
                        borderRadius: 999,
                        background: "var(--pm-surface)",
                        color: "var(--pm-text)",
                        border: "1px solid var(--pm-border)",
                        fontWeight: 700,
                        fontSize: 13,
                        textDecoration: "none",
                      }}
                    >
                      View transaction
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Saved bank + withdrawal */}
        {savedBank && (
          <div style={card}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
              Your payout account
            </h2>


            <p style={{ margin: "12px 0 0", fontSize: 15 }}>
              <strong>{savedBank.bank_name}</strong>
            </p>


            <p style={{ margin: "4px 0 0", fontSize: 15 }}>
              {savedBank.account_number} · {savedBank.account_name}
            </p>


            <p style={{ margin: "12px 0 0", color: "var(--pm-muted)", fontSize: 13 }}>
              This is the account that receives money from your PadiMarket wallet.
            </p>


            <div style={{ marginTop: 20 }}>
              <p style={{ margin: "0 0 10px", color: "var(--pm-muted)", fontSize: 13 }}>
                Available balance: ₦
                {Number(walletBalance).toLocaleString("en-NG")}
              </p>


              <label style={{ fontWeight: 700, fontSize: 14 }}>
                Withdraw amount
              </label>


              <input
                value={withdrawAmount}
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, "");


                  setWithdrawAmount(value);


                  if (message === "Insufficient funds.") {
                    setMessage("");
                  }
                }}
                placeholder="Enter amount in Naira"
                inputMode="numeric"
                style={{ ...inputStyle, marginTop: 8 }}
              />


              <button
                onClick={withdrawFunds}
                disabled={withdrawing || !withdrawAmount}
                style={{
                  width: "100%",
                  marginTop: 14,
                  padding: "14px 18px",
                  borderRadius: 999,
                  border: "none",
                  background:
                    withdrawing || !withdrawAmount ? "#6b7280" : "#0b9e77",
                  color: "#ffffff",
                  fontWeight: 800,
                  cursor:
                    withdrawing || !withdrawAmount ? "not-allowed" : "pointer",
                }}
              >
                {withdrawing
                  ? "Processing withdrawal..."
                  : "Withdraw to bank"}
              </button>
            </div>
          </div>
        )}


        {/* Add bank details — hidden after saving */}
        {!savedBank && (
          <div style={card}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
              Personal Bank Details
            </h2>


            <p style={{ color: "var(--pm-muted)", fontSize: 14, marginTop: 8 }}>
              Enter your account number and select your bank. We will confirm the
              account name before saving.
            </p>


            <p
              style={{
                margin: "10px 0 0",
                padding: "12px 14px",
                background: "var(--pm-bg)",
                border: "1px solid var(--pm-border)",
                borderRadius: 12,
                color: "var(--pm-muted)",
                fontSize: 13,
              }}
            >
              For security, you can add your payout bank account only once.
              Please make sure the account belongs to you before saving.
            </p>


            <div
              style={{
                display: "grid",
                gap: 14,
                marginTop: 18,
              }}
            >
              <div>
                <label style={{ fontWeight: 700, fontSize: 14 }}>
                  Account number
                </label>


                <input
                  value={accountNumber}
                  onChange={(event) =>
                    setAccountNumber(
                      event.target.value.replace(/\D/g, "").slice(0, 10)
                    )
                  }
                  placeholder="Enter 10-digit account number"
                  inputMode="numeric"
                  style={{ ...inputStyle, marginTop: 8 }}
                />
              </div>


              <div>
                <label style={{ fontWeight: 700, fontSize: 14 }}>
                  Select bank
                </label>


                <select
                  value={bankCode}
                  onChange={(event) => setBankCode(event.target.value)}
                  style={{ ...inputStyle, marginTop: 8 }}
                >
                  <option value="">Select your bank</option>
                  {banks.map((bank, index) => (
                    <option
                      key={`${bank.code}-${index}`}
                      value={bank.code}
                    >
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>


              <button
                onClick={verifyAccount}
                disabled={verifying}
                style={{
                  padding: "14px 18px",
                  borderRadius: 999,
                  border: "none",
                  background: verifying ? "#7fd7bd" : "#0b9e77",
                  color: "#04231b",
                  fontWeight: 800,
                  cursor: verifying ? "wait" : "pointer",
                }}
              >
                {verifying ? "Verifying account..." : "Verify account"}
              </button>


              {accountName && (
                <div
                  style={{
                    background: "var(--pm-bg)",
                    border: "1px solid var(--pm-border)",
                    borderRadius: 16,
                    padding: 16,
                  }}
                >
                  <p style={{ margin: 0, color: "var(--pm-muted)", fontSize: 13 }}>
                    Account name
                  </p>
                  <p style={{ margin: "6px 0 0", fontWeight: 800, fontSize: 18 }}>
                    {accountName}
                  </p>
                </div>
              )}


              <button
                onClick={saveBankDetails}
                disabled={saving || !accountName}
                style={{
                  padding: "14px 18px",
                  borderRadius: 999,
                  border: "none",
                  background: saving || !accountName ? "#6b7280" : "#172033",
                  color: "#ffffff",
                  fontWeight: 800,
                  cursor: saving || !accountName ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving..." : "Save bank details"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}