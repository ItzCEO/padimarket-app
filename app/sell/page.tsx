"use client";


import Image from "next/image";
import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase-client";
import RequireAuth from "@/components/RequireAuth";


const categories = [
  "Books & School",
  "Fashion",
  "Electronics",
  "Home & Living",
  "Children's Items",
  "Household",
];


const conditions = ["New", "Like new", "Good", "Fair"];


const sizeOptions: Record<string, string[]> = {
  "Fashion": [
    "XS", "S", "M", "L", "XL", "XXL", "3XL", "Custom size",
  ],
  "Children's Items": [
    "0-3 months", "3-6 months", "6-12 months", "1-2 years",
    "2-3 years", "3-4 years", "5-6 years", "7-8 years",
    "9-10 years", "11-12 years", "Baby shoe size", "Kids shoe size",
  ],
  "Home & Living": [
    "Single", "Small double", "Double", "Queen", "King",
    "Super king", "Custom size",
  ],
};


const lagosLGAs = [
  "Agege",
  "Ajeromi-Ifelodun",
  "Alimosho",
  "Amuwo-Odofin",
  "Apapa",
  "Badagry",
  "Epe",
  "Eti-Osa",
  "Ibeju-Lekki",
  "Ifako-Ijaiye",
  "Ikeja",
  "Ikorodu",
  "Kosofe",
  "Lagos Island",
  "Lagos Mainland",
  "Mushin",
  "Ojo",
  "Oshodi-Isolo",
  "Shomolu",
  "Surulere",
];


function SellContent() {
  const [notice, setNotice] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("Good");
  const [selectedLGA, setSelectedLGA] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [customSize, setCustomSize] = useState("");
  const [productImages, setProductImages] = useState<
    { file: File; preview: string }[]
  >([]);
  const [quantity, setQuantity] = useState(1);


  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);


    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));


    setProductImages((currentImages) =>
      [...currentImages, ...newImages].slice(0, 6)
    );


    event.target.value = "";
  }


  function removeImage(index: number) {
    setProductImages((currentImages) =>
      currentImages.filter((_, position) => position !== index)
    );
  }


  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Publishing your listing...");


    const form = event.currentTarget;
    const formData = new FormData(form);


    const title = String(formData.get("title") || "").trim();
    const price = Number(formData.get("price") || 0);
    const description = String(formData.get("description") || "").trim();
    const sellerName = String(formData.get("sellerName") || "").trim();
    const contact = String(formData.get("contact") || "").trim();


    const size =
      selectedSize === "Custom size" ? customSize : selectedSize || null;


    const location = selectedArea
      ? `${selectedArea}, ${selectedLGA}`
      : selectedLGA;


    const supabase = createSupabaseClient();
const { data: userData, error: userError } = await supabase.auth.getUser();

if (userError || !userData.user) {
  setNotice("Please sign in before publishing a listing.");
  return;
}

const sellerId = userData.user.id;

    let imageUrl: string | null = null;


    if (productImages.length > 0) {
      const imageFile = productImages[0].file;
      const fileExtension = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExtension}`;


      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, imageFile);


      if (uploadError) {
        setNotice(`Could not upload photo: ${uploadError.message}`);
        return;
      }


      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);


      imageUrl = data.publicUrl;
    }


    const { error } = await supabase.from("products").insert({
  title,
  description,
  price,
  category: selectedCategory,
  condition: selectedCondition,
  quantity,
  location,
  size,
  seller_name: sellerName,
  seller_phone: contact,
  seller_id: sellerId,
  image_url: imageUrl,
});

    if (error) {
      setNotice(`Could not publish listing: ${error.message}`);
      return;
    }


    setNotice("Your listing has been published successfully.");
    form.reset();
    setSelectedCategory("");
    setSelectedSize("");
    setCustomSize("");
    setSelectedLGA("");
    setSelectedArea("");
    setProductImages([]);
    setQuantity(1);
  }


  return (
    <main className="sell-page">
      <div className="glow glow-one" />
      <div className="glow glow-two" />


      <header className="topbar">
        <a className="logo" href="/" aria-label="PadiMarket home">
          <Image
            className="logo-image"
            src="/logo-new.png"
            alt="PadiMarket logo"
            width={56}
            height={56}
            priority
          />
          <span className="logo-text">
            Padi<span>Market</span>
          </span>
        </a>


        <div className="top-actions">
          <a className="pill ghost" href="/">
            ← Back home
          </a>
        </div>
      </header>


      <div className="shell">
        <section className="page-intro">
          <span className="mini-label">Start selling</span>
          <h1>List your item</h1>
          <p>
            Describe what you are selling clearly. Good photos, honest
            conditions, and accurate prices help buyers trust your listing.
          </p>
        </section>


        <form className="sell-form clay" onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>Item details</h2>


            <label>
              Item title
              <input
                type="text"
                name="title"
                required
                placeholder="For example: Secondary school textbook bundle"
              />
            </label>


            <label>
              Category
              <select
                required
                value={selectedCategory}
                onChange={(event) => {
                  setSelectedCategory(event.target.value);
                  setSelectedSize("");
                }}
              >
                <option value="" disabled>
                  Choose a category
                </option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>


            {sizeOptions[selectedCategory] && (
              <>
                <label>
                  Size
                  <select
                    required
                    value={selectedSize}
                    onChange={(event) => {
                      setSelectedSize(event.target.value);
                      if (event.target.value !== "Custom size") {
                        setCustomSize("");
                      }
                    }}
                  >
                    <option value="" disabled>
                      Choose a size
                    </option>
                    {sizeOptions[selectedCategory].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>


                {selectedSize === "Custom size" && (
                  <label>
                    Describe the custom size
                    <input
                      type="text"
                      required
                      value={customSize}
                      onChange={(event) => setCustomSize(event.target.value)}
                      placeholder="For example: Waist 32, Length 26, or EU shoe size 42"
                    />
                  </label>
                )}
              </>
            )}


            <div className="two-columns">
              <label>
                Price (₦)
                <input
                  type="number"
                  name="price"
                  required
                  min="0"
                  placeholder="For example: 6500"
                />
              </label>


              <label>
                Quantity available
                <input
                  type="number"
                  required
                  min="1"
                  value={quantity}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setQuantity(value > 0 ? value : 1);
                  }}
                />
              </label>
            </div>


            <div className="two-columns">
              <label>
                Condition
                <select
                  value={selectedCondition}
                  onChange={(event) =>
                    setSelectedCondition(event.target.value)
                  }
                >
                  {conditions.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </label>
            </div>


            <div className="two-columns">
              <label>
                Local Government Area
                <select
                  required
                  value={selectedLGA}
                  onChange={(event) => {
                    setSelectedLGA(event.target.value);
                    setSelectedArea("");
                  }}
                >
                  <option value="" disabled>
                    Choose your LGA
                  </option>
                  {lagosLGAs.map((lga) => (
                    <option key={lga} value={lga}>
                      {lga}
                    </option>
                  ))}
                </select>
              </label>


              <label>
                Area / Environment
                <input
                  type="text"
                  required
                  disabled={!selectedLGA}
                  value={selectedArea}
                  onChange={(event) => setSelectedArea(event.target.value)}
                  placeholder={
                    selectedLGA
                      ? "Enter your area, estate, street, or community"
                      : "Choose an LGA first"
                  }
                />
              </label>
            </div>


            <label>
              Description
              <textarea
                name="description"
                required
                rows={5}
                placeholder="Describe the item, its condition, what is included, and why you are selling it."
              />
            </label>
          </div>


          <div className="form-section">
            <h2>Photos</h2>


            <label className="upload-box">
              <span className="upload-icon" aria-hidden="true">
                📷
              </span>
              <strong>Add product photos</strong>
              <span>
                Choose up to 6 clear photos. The first photo will be the main photo.
              </span>


              <input
                className="file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
              />
            </label>


            {productImages.length > 0 && (
              <div className="image-previews">
                {productImages.map((image, index) => (
                  <div className="image-preview" key={image.preview}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.preview} alt={`Product photo ${index + 1}`} />


                    {index === 0 && <span className="main-photo">Main</span>}


                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => removeImage(index)}
                      aria-label={`Remove product photo ${index + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>


          <div className="form-section">
            <h2>Contact details</h2>


            <div className="two-columns">
              <label>
                Your name
                <input
                  type="text"
                  name="sellerName"
                  required
                  placeholder="Enter your full name"
                />
              </label>


              <label>
                Phone or WhatsApp
                <input
                  type="tel"
                  name="contact"
                  required
                  placeholder="Enter your contact number"
                />
                <span className="field-note">
                  This number will remain private. Buyers will contact you
                  through PadiMarket messages.
                </span>
              </label>
            </div>


            <div className="privacy-note">
              For your safety, buyers will see your display name and general
              location only. Your phone number and exact address will not be
              shown publicly.
            </div>
          </div>


          <div className="form-actions">
            <button type="submit" className="pill primary large">
              Publish listing
            </button>
          </div>
        </form>


        <section className="seller-tips clay">
          <h2>Tips for a better listing</h2>
          <div className="tips">
            <div className="tip">
              <span>📸</span>
              <div>
                <strong>Use clear photos</strong>
                <p>Show the item from different angles in good lighting.</p>
              </div>
            </div>


            <div className="tip">
              <span>📝</span>
              <div>
                <strong>Be honest</strong>
                <p>
                  Mention scratches, missing parts, or anything a buyer should
                  know.
                </p>
              </div>
            </div>


            <div className="tip">
              <span>🔒</span>
              <div>
                <strong>Protect your privacy</strong>
                <p>
                  Share your general area only. Arrange meetups in safe,
                  public places.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>


      {notice && (
        <div className="notice clay">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss notice">
            ✕
          </button>
        </div>
      )}


      <style jsx global>{`
        * {
          box-sizing: border-box;
        }


        body {
          margin: 0;
          background: var(--pm-bg);
          color: var(--pm-text);
          font-family: "Plus Jakarta Sans", Arial, sans-serif;
        }


        button,
        input,
        select,
        textarea {
          font: inherit;
        }


        button {
          cursor: pointer;
          border: 0;
          background: transparent;
        }


        button:focus-visible,
        a:focus-visible,
        input:focus-visible,
        select:focus-visible,
        textarea:focus-visible {
          outline: 3px solid #12b886;
          outline-offset: 3px;
        }


        .sell-page {
          position: relative;
          min-height: 100vh;
          overflow-x: hidden;
          padding-bottom: 50px;
          color: var(--pm-text);
        }


        .glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.55;
          pointer-events: none;
        }


        .glow-one {
          width: 480px;
          height: 480px;
          top: -160px;
          right: -120px;
          background: #b8f2de;
        }


        .glow-two {
          width: 430px;
          height: 430px;
          top: 500px;
          left: -170px;
          background: #d9e4ff;
        }


        [data-theme="dark"] .glow-one {
          background: #12463a;
        }


        [data-theme="dark"] .glow-two {
          background: #1d2b45;
        }


        .topbar {
          position: relative;
          z-index: 2;
          max-width: 1240px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 28px;
        }


        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: var(--pm-text);
        }


        .logo-image {
          width: 56px;
          height: 56px;
          object-fit: contain;
          border-radius: 16px;
        }


        .logo-text {
          font-size: 25px;
          font-weight: 800;
          letter-spacing: -1.1px;
        }


        .logo-text span {
          color: #0b9e77;
        }


        .top-actions {
          display: flex;
        }


        .pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 13px 21px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          transition: transform 0.15s;
        }


        .pill.primary {
          background: linear-gradient(145deg, #17d39a, #0b9e77);
          color: white;
        }


        .pill.primary:hover {
          transform: translateY(-1px);
        }


        .pill.ghost {
          background: var(--pm-surface);
          color: var(--pm-text);
          box-shadow: var(--pm-shadow);
        }


        .pill.large {
          padding: 17px 30px;
          font-size: 15px;
        }


        .shell {
          position: relative;
          z-index: 2;
          max-width: 900px;
          margin: 0 auto;
          padding: 0 28px;
        }


        .clay {
          background: var(--pm-surface);
          border-radius: 32px;
          box-shadow: var(--pm-shadow);
          border: 1px solid var(--pm-border);
        }


        .page-intro {
          text-align: center;
          margin: 20px auto 32px;
          max-width: 620px;
        }


        .mini-label {
          display: inline-block;
          margin-bottom: 12px;
          color: #0b7a5d;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }


        [data-theme="dark"] .mini-label {
          color: #7ff0c4;
        }


        h1 {
          margin: 0 0 14px;
          font-size: clamp(36px, 5vw, 54px);
          line-height: 1.08;
          letter-spacing: -2.4px;
          font-weight: 800;
        }


        .page-intro p {
          margin: 0;
          color: var(--pm-muted);
          font-size: 15px;
          line-height: 1.8;
        }


        .sell-form {
          padding: 38px;
        }


        .form-section + .form-section {
          margin-top: 34px;
          padding-top: 30px;
          border-top: 1px solid var(--pm-border);
        }


        h2 {
          margin: 0 0 20px;
          font-size: 22px;
        }


        label {
          display: grid;
          gap: 9px;
          margin-bottom: 18px;
          font-size: 13px;
          font-weight: 700;
          color: var(--pm-muted);
        }


        input,
        select,
        textarea {
          width: 100%;
          border: 1px solid var(--pm-border);
          border-radius: 18px;
          background: var(--pm-bg);
          padding: 16px 18px;
          color: var(--pm-text);
          font-size: 14px;
        }


        input::placeholder,
        textarea::placeholder {
          color: var(--pm-muted);
          opacity: 1;
        }


        textarea {
          resize: vertical;
          line-height: 1.7;
        }


        .two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }


        .field-note {
          color: #0b9e77;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.6;
        }


        [data-theme="dark"] .field-note {
          color: #7ff0c4;
        }


        .privacy-note {
          margin-top: 4px;
          padding: 16px 18px;
          border-radius: 18px;
          background: #e8fbf4;
          color: #0b7a5d;
          font-size: 13px;
          line-height: 1.7;
        }


        [data-theme="dark"] .privacy-note {
          background: #123529;
          color: #7ff0c4;
        }


        .upload-box {
          display: grid;
          justify-items: center;
          gap: 8px;
          padding: 38px 20px;
          border-radius: 24px;
          background: var(--pm-bg);
          color: var(--pm-muted);
          text-align: center;
          cursor: pointer;
        }


        .file-input {
          display: none;
        }


        .image-previews {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 18px;
        }


        .image-preview {
          position: relative;
          aspect-ratio: 1;
          border-radius: 20px;
          overflow: hidden;
          background: var(--pm-bg);
        }


        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }


        .main-photo {
          position: absolute;
          top: 10px;
          left: 10px;
          padding: 6px 10px;
          border-radius: 999px;
          background: #0b9e77;
          color: white;
          font-size: 10px;
          font-weight: 800;
        }


        .remove-image {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #172033;
          color: white;
          font-size: 12px;
          display: grid;
          place-items: center;
        }


        .upload-box strong {
          color: var(--pm-text);
          font-size: 16px;
        }


        .upload-icon {
          font-size: 42px;
        }


        .form-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 32px;
        }


        .seller-tips {
          margin-top: 34px;
          padding: 34px;
        }


        .tips {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }


        .tip {
          display: flex;
          gap: 14px;
          padding: 20px;
          border-radius: 22px;
          background: var(--pm-bg);
        }


        .tip strong {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
        }


        .tip p {
          margin: 0;
          color: var(--pm-muted);
          font-size: 13px;
          line-height: 1.6;
        }


        .notice {
          position: fixed;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 30;
          display: flex;
          align-items: center;
          gap: 18px;
          width: min(92%, 560px);
          padding: 18px 20px;
          border-radius: 22px;
          background: #172033;
          color: #f3f5f7;
          font-size: 13px;
          line-height: 1.5;
        }


        .notice button {
          margin-left: auto;
          color: inherit;
          padding: 8px;
        }


        @media (max-width: 600px) {
          .image-previews {
            grid-template-columns: repeat(2, 1fr);
          }
        }


        @media (max-width: 800px) {
          .topbar {
            padding: 16px;
          }


          .logo-text {
            font-size: 22px;
          }


          .shell {
            padding: 0 16px;
          }


          .sell-form,
          .seller-tips {
            padding: 25px;
            border-radius: 26px;
          }


          .two-columns {
            grid-template-columns: 1fr;
            gap: 0;
          }


          .tips {
            grid-template-columns: 1fr;
          }


          .form-actions {
            flex-direction: column;
          }


          .form-actions .pill {
            width: 100%;
          }


          .notice {
            bottom: 20px;
          }
        }
      `}</style>
    </main>
  );
}
export default function SellPage() {
  return (
    <RequireAuth>
      <SellContent />
    </RequireAuth>
  );
}