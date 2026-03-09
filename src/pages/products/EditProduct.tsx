import React, { useState, useEffect, useRef } from "react";
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
import { useHistory, useParams } from "react-router";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import "./EditProduct.css";

export default function EditProduct() {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    stock: "",
    price: "",
    category: "",
  });

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          alert("กรุณาเข้าสู่ระบบก่อน");
          history.replace("/login");
          return;
        }

        const productRef = doc(db, "products", id);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          alert("ไม่พบข้อมูลสินค้า");
          history.replace("/products");
          return;
        }

        const data = productSnap.data();

        if (data.ownerUid !== currentUser.uid) {
          alert("คุณไม่มีสิทธิ์เข้าถึงสินค้านี้");
          history.replace("/products");
          return;
        }

        setFormData({
          name: data.name || "",
          stock: String(data.stock ?? 0),
          price: String(data.price ?? 0),
          category: data.category || "",
        });

        setPhoto(data.photo || null);
      } catch (error) {
        console.error("Load product error:", error);
        alert("โหลดข้อมูลสินค้าไม่สำเร็จ");
        history.replace("/products");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, history]);

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

  const handleSave = async () => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        alert("กรุณาเข้าสู่ระบบก่อน");
        history.replace("/login");
        return;
      }

      if (
        !formData.name.trim() ||
        !formData.stock.trim() ||
        !formData.price.trim() ||
        !formData.category.trim()
      ) {
        alert("กรุณากรอกข้อมูลให้ครบ");
        return;
      }

      setSaving(true);

      const productRef = doc(db, "products", id);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        alert("ไม่พบข้อมูลสินค้า");
        history.replace("/products");
        return;
      }

      if (productSnap.data().ownerUid !== currentUser.uid) {
        alert("คุณไม่มีสิทธิ์แก้ไขสินค้านี้");
        history.replace("/products");
        return;
      }

      await updateDoc(productRef, {
        name: formData.name.trim(),
        stock: Number(formData.stock),
        price: Number(formData.price),
        category: formData.category,
        photo: photo || "",
        updatedAt: serverTimestamp(),
      });

      alert("บันทึกข้อมูลสำเร็จ");
      history.push("/products");
    } catch (error) {
      console.error("Update product error:", error);
      alert("บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        alert("กรุณาเข้าสู่ระบบก่อน");
        history.replace("/login");
        return;
      }

      const confirmDelete = window.confirm("ยืนยันการลบสินค้านี้?");
      if (!confirmDelete) return;

      const productRef = doc(db, "products", id);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        alert("ไม่พบข้อมูลสินค้า");
        history.replace("/products");
        return;
      }

      if (productSnap.data().ownerUid !== currentUser.uid) {
        alert("คุณไม่มีสิทธิ์ลบสินค้านี้");
        history.replace("/products");
        return;
      }

      await deleteDoc(productRef);
      alert("ลบสินค้าเรียบร้อย");
      history.push("/products");
    } catch (error) {
      console.error("Delete product error:", error);
      alert("ลบสินค้าไม่สำเร็จ");
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

  if (loading) {
    return (
      <IonPage>
        <IonContent>
          <div style={{ padding: "24px", fontFamily: "Kanit, sans-serif" }}>
            กำลังโหลดข้อมูล...
          </div>
        </IonContent>
      </IonPage>
    );
  }

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
              <h1 className="unified-page-title">แก้ไขรายการสินค้า</h1>
              <div className="top-bar-space" />
            </div>

            <div className="edit-product-container">
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
                  <button type="button" className="img-btn primary" onClick={takePhoto}>
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
                    <label>จำนวนคงเหลือ</label>
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
  <div className="custom-ion-select">
    <select
      value={formData.category}
      onChange={(e) => handleInputChange("category", e.target.value)}
      className="native-select"
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

                <div className="form-footer-dual">
                  <button type="button" className="delete-btn" onClick={handleDelete}>
                    ลบสินค้า
                  </button>
                  <button
                    type="button"
                    className="save-btn"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "กำลังบันทึก..." : "บันทึก"}
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