"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function CheckoutSuccessPage() {
  const [reference, setReference] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setReference(params.get("reference"));
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      <style>{`
        @keyframes cardIn {
          0% { opacity: 0; transform: translateY(30px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes circleDraw {
          0% { stroke-dashoffset: 302; }
          100% { stroke-dashoffset: 0; }
        }

        @keyframes checkDraw {
          0% { stroke-dashoffset: 60; }
          100% { stroke-dashoffset: 0; }
        }

        @keyframes pulseRing {
          0% { transform: scale(0.8); opacity: 0.5; }
          70% { transform: scale(1.25); opacity: 0; }
          100% { transform: scale(1.25); opacity: 0; }
        }

        .success-card {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border-radius: 28px;
          padding: 40px 28px;
          text-align: center;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
          animation: cardIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .icon-wrapper {
          position: relative;
          width: 110px;
          height: 110px;
          margin: 0 auto 28px;
        }

        .pulse-ring {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: rgba(34, 197, 94, 0.35);
          animation: pulseRing 1.8s ease-out infinite;
        }

        .check-svg {
          position: relative;
          width: 110px;
          height: 110px;
        }

        .circle-path {
          fill: none;
          stroke: #22c55e;
          stroke-width: 8;
          stroke-linecap: round;
          stroke-dasharray: 302;
          stroke-dashoffset: 302;
          animation: circleDraw 0.9s ease-out 0.2s forwards;
        }

        .check-path {
          fill: none;
          stroke: #22c55e;
          stroke-width: 10;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: checkDraw 0.5s ease-out 1s forwards;
        }

        .title {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 12px;
        }

        .message {
          font-size: 15px;
          line-height: 1.6;
          color: #64748b;
          margin: 0 0 28px;
        }

        .reference-box {
          background: #f1f5f9;
          border-radius: 16px;
          padding: 14px;
          margin-bottom: 28px;
        }

        .reference-label {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #94a3b8;
          margin: 0 0 6px;
        }

        .reference-value {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 13px;
          color: #334155;
          word-break: break-all;
          margin: 0;
        }

        .home-button {
          display: inline-block;
          width: 100%;
          padding: 15px 20px;
          border-radius: 16px;
          background: #0f172a;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .home-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.2);
        }
      `}</style>

      <div className="success-card">
        <div className="icon-wrapper">
          <div className="pulse-ring" />

          <svg className="check-svg" viewBox="0 0 110 110">
            <circle
              className="circle-path"
              cx="55"
              cy="55"
              r="48"
            />
            <path
              className="check-path"
              d="M35 57 L50 72 L78 42"
            />
          </svg>
        </div>

        <h1 className="title">Payment successful</h1>

        <p className="message">
          Your payment has been received. The seller will deliver your item,
          and you can complete the handshake once you receive it.
        </p>

        {reference && (
          <div className="reference-box">
            <p className="reference-label">Payment reference</p>
            <p className="reference-value">{reference}</p>
          </div>
        )}

        <Link href="/transactions" className="home-button">
          Go to my transactions
        </Link>
      </div>
    </main>
  );
}