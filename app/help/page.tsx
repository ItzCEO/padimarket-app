import Link from "next/link";

export default function HelpPage() {
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
  href="/?settings=1"
  style={{
    color: "#0b9e77",
    fontWeight: 700,
    textDecoration: "none",
  }}
>
  ← Back to settings
</Link>

        <h1 style={{ fontSize: "34px", marginTop: "20px" }}>
          Help & Support
        </h1>

        <p style={{ color: "var(--pm-muted)", lineHeight: 1.7 }}>
          Need help using PadiMarket? Here are answers to common questions.
        </p>

        <section style={{ marginTop: "28px" }}>
          <h2>Creating an account</h2>
          <p style={{ color: "var(--pm-muted)", lineHeight: 1.7 }}>
            Go to the Sign Up page, enter your email and password, then confirm
            your email address. After that, you can sign in and start buying or
            selling.
          </p>
        </section>

        <section style={{ marginTop: "24px" }}>
          <h2>Resetting your password</h2>
          <p style={{ color: "var(--pm-muted)", lineHeight: 1.7 }}>
            On the Sign In page, click <strong>Forgot password?</strong> Enter
            your registered email address and follow the reset link sent to
            your email.
          </p>
        </section>

        <section style={{ marginTop: "24px" }}>
          <h2>List an item</h2>
          <p style={{ color: "var(--pm-muted)", lineHeight: 1.7 }}>
            Go to the Sell page, add clear photos, write an honest description,
            choose the correct category and condition, then publish your
            listing.
          </p>
        </section>

        <section style={{ marginTop: "24px" }}>
          <h2>Report a problem</h2>
          <p style={{ color: "var(--pm-muted)", lineHeight: 1.7 }}>
            If you see a suspicious listing, fake account, or unsafe buyer or
            seller, contact us at:
          </p>
          <p>
            <strong>support@padimarket.com</strong>
          </p>
        </section>

        <section style={{ marginTop: "24px" }}>
          <h2>Stay safe</h2>
          <ul style={{ color: "var(--pm-muted)", lineHeight: 1.8 }}>
            <li>Meet in safe, public places.</li>
            <li>Inspect items before paying.</li>
            <li>Do not share your bank details or OTP.</li>
            <li>Do not send money to unknown accounts.</li>
          </ul>
        </section>
      </div>
      <section id="safety">
  <h2>Safety guidelines</h2>

  <p>
    Stay safe when buying or selling on PadiMarket. Meet in public places,
    inspect items before payment, and never send money to someone you have
    not met.
  </p>

  <ul>
    <li>Meet sellers or buyers in a safe, public location.</li>
    <li>Inspect items carefully before making payment.</li>
    <li>Do not share your bank PIN, password, or verification codes.</li>
    <li>Report suspicious listings or users to PadiMarket support.</li>
  </ul>
</section>
    </main>
  );
}