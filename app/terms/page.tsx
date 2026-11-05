import Link from "next/link";

export default function TermsPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--pm-bg)",
        color: "var(--pm-text)",
        padding: "40px 20px",
        fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          background: "var(--pm-surface)",
          borderRadius: "28px",
          padding: "36px",
          border: "1px solid var(--pm-border)",
          boxShadow: "var(--pm-shadow)",
        }}
      >
        <Link
          href="/?screen=settings"
          style={{
            color: "#0b9e77",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          ← Back to settings
        </Link>

        <h1 style={{ fontSize: "34px", marginTop: "20px" }}>
          Terms & Privacy
        </h1>

        <p style={{ color: "var(--pm-muted)", lineHeight: 1.7 }}>
          These terms explain how PadiMarket works and how we handle your
          information.
        </p>

        <section style={{ marginTop: "28px" }}>
          <h2>About PadiMarket</h2>
          <p style={{ color: "var(--pm-muted)", lineHeight: 1.7 }}>
            PadiMarket is an online marketplace where people can buy and sell
            items within their local community.
          </p>
        </section>

        <section style={{ marginTop: "24px" }}>
          <h2>Your account</h2>
          <p style={{ color: "var(--pm-muted)", lineHeight: 1.7 }}>
            You are responsible for keeping your password safe and for the
            information you provide on your account. Do not share your account
            with another person.
          </p>
        </section>

        <section style={{ marginTop: "24px" }}>
          <h2>Buying and selling</h2>
          <p style={{ color: "var(--pm-muted)", lineHeight: 1.7 }}>
            Sellers must describe items honestly and use real photos. Buyers
            should inspect items before payment. PadiMarket helps people
            connect, but users are responsible for their own transactions.
          </p>
        </section>

        <section style={{ marginTop: "24px" }}>
          <h2>Prohibited items</h2>
          <p style={{ color: "var(--pm-muted)", lineHeight: 1.7 }}>
            You may not list illegal items, stolen goods, weapons, drugs,
            counterfeit products, or anything that violates the law.
          </p>
        </section>

        <section style={{ marginTop: "24px" }}>
          <h2>Your privacy</h2>
          <p style={{ color: "var(--pm-muted)", lineHeight: 1.7 }}>
            We collect your email address, name, profile information, and any
            details you add to your listings. Your contact number and exact
            address are not shown publicly.
          </p>
        </section>

        <section style={{ marginTop: "24px" }}>
          <h2>Profile pictures and listings</h2>
          <p style={{ color: "var(--pm-muted)", lineHeight: 1.7 }}>
            Photos you upload may be displayed on your profile or listings. Do
            not upload photos that you do not have permission to use.
          </p>
        </section>

        <section style={{ marginTop: "24px" }}>
          <h2>Contact us</h2>
          <p style={{ color: "var(--pm-muted)", lineHeight: 1.7 }}>
            For questions about these terms or your privacy, contact:
          </p>
          <p>
            <strong>support@padimarket.com</strong>
          </p>
        </section>
      </div>
    </main>
  );
}