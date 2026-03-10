import React, { useState, useRef } from "react";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import {
  homeOutline,
  cubeOutline,
  cartOutline,
  barChartOutline,
  logOutOutline,
  cameraOutline,
  imagesOutline,
  chevronDownOutline,
  arrowBackOutline,
} from "ionicons/icons";
import { useHistory } from "react-router";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import "./AddProduct.css";

export default function AddProduct() {
  const history = useHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    stock: "",
    price: "",
    category: "",
  });

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 50,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (image.base64String) {
        setPhoto(`data:image/jpeg;base64,${image.base64String}`);
      }
    } catch (e) {
      console.log("takePhoto error:", e);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleBack = () => {
    if (history.length > 1) {
      history.goBack();
    } else {
      history.replace("/products");
    }
  };

  const handleSubmit = async () => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        alert("กรุณาเข้าสู่ระบบก่อน");
        history.replace("/login");
        return;
      }

      if (
        !formData.name.trim() ||
        !formData.price.trim() ||
        !formData.stock.trim() ||
        !formData.category.trim()
      ) {
        alert("กรุณากรอกข้อมูลให้ครบ");
        return;
      }

      setUploading(true);

      await addDoc(collection(db, "products"), {
        name: formData.name.trim(),
        price: Number(formData.price),
        stock: Number(formData.stock),
        category: formData.category.trim().toLowerCase(),
        photo: photo || "",
        ownerUid: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      alert("เพิ่มสินค้าเรียบร้อย");
      history.push("/products");
    } catch (error: any) {
      alert(`เพิ่มสินค้าไม่สำเร็จ: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("ออกจากระบบสำเร็จ");
      history.replace("/login");
    } catch {
      alert("ออกจากระบบไม่สำเร็จ");
    }
  };

  return (
    <IonPage>
      <IonContent>
        <div className="layout-container">
          <aside className="sidebar">
            <div className="logo-section">
              <div className="logo-circle">miniPOS</div>
            </div>

            <nav className="menu-list">
              <div className="menu-item" onClick={() => history.push("/home")}>
                <IonIcon icon={homeOutline} />
                <span>หน้าหลัก</span>
              </div>

              <div
                className="menu-item active"
                onClick={() => history.push("/products")}
              >
                <IonIcon icon={cubeOutline} />
                <span>สินค้า</span>
              </div>

              <div className="menu-item" onClick={() => history.push("/pos")}>
                <IonIcon icon={cartOutline} />
                <span>ขาย</span>
              </div>

              <div
                className="menu-item"
                onClick={() => history.push("/sales/history")}
              >
                <IonIcon icon={barChartOutline} />
                <span>สรุปยอดขาย</span>
              </div>
            </nav>

            <div className="logout-section">
              <button className="logout-btn" onClick={handleLogout}>
                <IonIcon icon={logOutOutline} />
                ออกจากระบบ
              </button>
            </div>
          </aside>

          <main className="main-content">
            <div className="unified-top-bar">
              <button className="back-btn" onClick={handleBack}>
                <IonIcon icon={arrowBackOutline} />
              </button>
              <h1 className="unified-page-title">เพิ่มรายการสินค้า</h1>
              <div className="top-bar-space" />
            </div>

            <div className="add-product-container">
              <div className="image-section">
                <div
                  className="image-placeholder"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photo ? (
                    <div className="image-inner-frame">
                      <img src={photo} alt="Preview" className="preview-img" />
                    </div>
                  ) : (
                    <div className="placeholder-content">
                      <IonIcon icon={cameraOutline} />
                      <span>รูปสินค้า</span>
                      <small>แตะเพื่อเลือกรูปหรืออัปโหลด</small>
                    </div>
                  )}
                </div>

                <div className="image-actions">
                  <button
                    type="button"
                    className="img-btn primary"
                    onClick={takePhoto}
                  >
                    <IonIcon icon={cameraOutline} />
                    ถ่ายภาพ
                  </button>

                  <button
                    type="button"
                    className="img-btn secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <IonIcon icon={imagesOutline} />
                    อัปโหลดรูปภาพ
                  </button>

                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="form-card">
                <div className="form-grid">
                  <div className="form-group">
                    <label>ชื่อสินค้า</label>
                    <input
                      type="text"
                      placeholder="กรอกชื่อสินค้า"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>จำนวน</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="กรอกจำนวน"
                      value={formData.stock}
                      onChange={(e) => handleInputChange("stock", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>ราคา</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="กรอกราคา"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>หมวดหมู่</label>
                    <div className="select-wrapper">
                      <select
                        value={formData.category}
                        onChange={(e) => handleInputChange("category", e.target.value)}
                      >
                        <option value="" disabled>
                          เลือกหมวดหมู่
                        </option>
                        <option value="food">อาหาร</option>
                        <option value="drink">เครื่องดื่ม</option>
                        <option value="dessert">ของหวาน</option>
                      </select>
                      <IonIcon icon={chevronDownOutline} className="select-arrow" />
                    </div>
                  </div>
                </div>

                <div className="form-footer">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={handleBack}
                  >
                    ยกเลิก
                  </button>

                  <button
                    type="button"
                    className="submit-btn"
                    onClick={handleSubmit}
                    disabled={uploading}
                  >
                    {uploading ? "กำลังเพิ่มสินค้า..." : "เพิ่มสินค้า"}
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
}