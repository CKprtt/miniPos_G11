import React, { useEffect, useMemo, useState } from "react";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import {
  homeOutline,
  cubeOutline,
  cartOutline,
  barChartOutline,
  logOutOutline,
  searchOutline,
  optionsOutline,
  grid,
  restaurant,
  cafe,
  iceCream,
} from "ionicons/icons";
import { useHistory, useLocation } from "react-router";
import { useParams } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import QRCode from "react-qr-code";
import { QrDemoData } from "../../firebase/generateQrDemo";
import "./ReceiptPreview.css";

type CartItem = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  photo?: string;
  ownerUid: string;
  qty: number;
};

type ReceiptState = {
  orderId?: string;
  qrDemo?: QrDemoData;
};

type ReceiptData = {
  cart: CartItem[];
  orderType: string;
  paymentMethod: string;
  subtotal: number;
  vat: number;
  total: number;
  orderId: string;
  qrDemo?: QrDemoData;
  merchantName?: string;
};

export default function ReceiptPreview() {
  const history = useHistory();
  const location = useLocation<ReceiptState | undefined>();
  const { id } = useParams<{ id: string }>();

  const state = location.state;
  const orderId = id || state?.orderId || "";

  const [receiptData, setReceiptData] = useState<ReceiptData>({
    cart: [],
    orderType: "dine-in",
    paymentMethod: "cash",
    subtotal: 0,
    vat: 0,
    total: 0,
    orderId,
    qrDemo: state?.qrDemo,
    merchantName: "ร้านของฉัน",
  });

  const [loading, setLoading] = useState(true);
  const [stockUpdating, setStockUpdating] = useState(false);
  const [stockUpdated, setStockUpdated] = useState(false);

  const { cart, orderType, paymentMethod, subtotal, vat, total, qrDemo, merchantName } =
    receiptData;

  useEffect(() => {
    const loadReceipt = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const saleRef = doc(db, "sales", orderId);
        const saleSnap = await getDoc(saleRef);

        if (!saleSnap.exists()) {
          setLoading(false);
          return;
        }

        const data = saleSnap.data();

        setReceiptData({
          cart: data.cart || [],
          orderType: data.orderType || "dine-in",
          paymentMethod: data.paymentMethod || "cash",
          subtotal: Number(data.subtotal || 0),
          vat: Number(data.vat || 0),
          total: Number(data.total || 0),
          orderId,
          qrDemo: state?.qrDemo,
          merchantName: data.merchantName || auth.currentUser?.email || "ร้านของฉัน",
        });
      } catch (error) {
        console.error("loadReceipt error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReceipt();
  }, [orderId, state?.qrDemo]);

  const isActive = (path: string) =>
    location.pathname.startsWith(path) ? "active" : "";

  const now = useMemo(() => new Date(), []);
  const currentDate = useMemo(() => now.toLocaleDateString("th-TH"), [now]);
  const currentTime = useMemo(
    () =>
      now.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [now]
  );

  const displayOrderId = useMemo(() => {
    if (orderId) return `ORD-${orderId.slice(-6).toUpperCase()}`;
    return "-";
  }, [orderId]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      history.replace("/login");
    } catch {
      alert("ออกจากระบบไม่สำเร็จ");
    }
  };

  const reduceStock = async (): Promise<boolean> => {
    if (stockUpdated) return true;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("กรุณาเข้าสู่ระบบก่อน");
      history.replace("/login");
      return false;
    }

    if (cart.length === 0) {
      alert("ไม่พบข้อมูลออเดอร์");
      return false;
    }

    try {
      setStockUpdating(true);

      for (const item of cart) {
        const productRef = doc(db, "products", item.id);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          alert(`ไม่พบสินค้า: ${item.name}`);
          return false;
        }

        const data = productSnap.data();

        if (data.ownerUid !== currentUser.uid) {
          alert(`ไม่มีสิทธิ์: ${item.name}`);
          return false;
        }

        const latestStock = Number(data.stock || 0);
        if (latestStock < item.qty) {
          alert(`สต๊อก "${item.name}" ไม่พอ`);
          return false;
        }

        await updateDoc(productRef, { stock: latestStock - item.qty });
      }

      setStockUpdated(true);
      return true;
    } catch (e) {
      console.error("reduceStock error:", e);
      alert("อัปเดตสต๊อกไม่สำเร็จ");
      return false;
    } finally {
      setStockUpdating(false);
    }
  };

  const handlePaymentSuccess = async () => {
    const ok = await reduceStock();
    if (!ok) return;
    alert("ชำระเงินสำเร็จ");
    history.replace("/pos");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent>
          <div style={{ padding: "24px" }}>กำลังโหลดใบเสร็จ...</div>
        </IonContent>
      </IonPage>
    );
  }

  if (!orderId || cart.length === 0) {
    return (
      <IonPage>
        <IonContent>
          <div style={{ padding: "24px" }}>
            ไม่พบข้อมูลออเดอร์
            <div style={{ marginTop: "16px" }}>
              <button onClick={() => history.replace("/pos")}>กลับไปหน้า POS</button>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent fullscreen scrollY={true}>
        <div className="layout-container">
          <aside className="sidebar">
            <div className="logo-section">
              <div className="logo-circle">miniPOS</div>
            </div>

            <nav className="menu-list">
              <div
                className={`menu-item ${isActive("/home")}`}
                onClick={() => history.push("/home")}
              >
                <IonIcon icon={homeOutline} />
                <span>หน้าหลัก</span>
              </div>

              <div
                className={`menu-item ${isActive("/products")}`}
                onClick={() => history.push("/products")}
              >
                <IonIcon icon={cubeOutline} />
                <span>สินค้า</span>
              </div>

              <div
                className={`menu-item ${isActive("/pos")}`}
                onClick={() => history.push("/pos")}
              >
                <IonIcon icon={cartOutline} />
                <span>ขาย</span>
              </div>

              <div
                className={`menu-item ${isActive("/sales")}`}
                onClick={() => history.push("/sales/history")}
              >
                <IonIcon icon={barChartOutline} />
                <span>สรุปยอดขาย</span>
              </div>
            </nav>

            <div className="logout-section">
              <button className="logout-btn" onClick={handleLogout}>
                <IonIcon icon={logOutOutline} /> ออกจากระบบ
              </button>
            </div>
          </aside>

          <main className="pos-layout">
            <div className="pos-products-area">
              <div className="pos-header">
                <div className="search-wrapper">
                  <IonIcon icon={searchOutline} />
                  <input type="text" placeholder="ค้นหา..." disabled />
                </div>
                <button className="icon-btn filter-btn">
                  <IonIcon icon={optionsOutline} />
                </button>
              </div>

              <div className="category-tabs">
                <div className="cat-item active">
                  <IonIcon icon={grid} />
                  <span>ทั้งหมด</span>
                </div>
                <div className="cat-item">
                  <IonIcon icon={restaurant} />
                  <span>อาหาร</span>
                </div>
                <div className="cat-item">
                  <IonIcon icon={cafe} />
                  <span>เครื่องดื่ม</span>
                </div>
                <div className="cat-item">
                  <IonIcon icon={iceCream} />
                  <span>ของหวาน</span>
                </div>
              </div>

              <div className="pos-product-grid">
                {cart.map((p) => (
                  <div className="pos-card" key={p.id}>
                    <div className="pos-card-img">
                      <img
                        src={
                          p.photo && p.photo.trim() !== ""
                            ? p.photo
                            : "https://via.placeholder.com/300x200?text=No+Image"
                        }
                        alt={p.name}
                      />
                    </div>
                    <div className="pos-card-body">
                      <div className="product-name">{p.name}</div>
                      <div className="product-price">
                        {p.price} ฿ x {p.qty}
                      </div>
                      <button className="add-cart-btn" disabled>
                        อยู่ในออเดอร์
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="receipt-sidebar-area">
              <div className="receipt-scroll-area">
                <div className="receipt-paper">
                  <div className="receipt-top-actions">
                    <button
                      className="receipt-back-btn"
                      onClick={() => history.goBack()}
                    >
                      กลับ
                    </button>
                  </div>

                  <h2 className="receipt-title">ใบเสร็จชำระเงิน</h2>
                  <div className="receipt-divider" />

                  <div className="receipt-info-row">
                    <span>ชื่อร้านค้า:</span>
                    <span>{merchantName}</span>
                  </div>
                  <div className="receipt-info-row">
                    <span>วันที่:</span>
                    <span>{currentDate}</span>
                  </div>
                  <div className="receipt-info-row">
                    <span>เวลา:</span>
                    <span>{currentTime}</span>
                  </div>
                  <div className="receipt-info-row">
                    <span>เลขออเดอร์:</span>
                    <span>{displayOrderId}</span>
                  </div>
                  <div className="receipt-info-row">
                    <span>ประเภทออเดอร์:</span>
                    <span>{orderType}</span>
                  </div>
                  <div className="receipt-info-row">
                    <span>การชำระเงิน:</span>
                    <span>
                      {paymentMethod === "qrcode"
                        ? "QR Code"
                        : paymentMethod === "cash"
                        ? "เงินสด"
                        : "บัตร"}
                    </span>
                  </div>

                  {paymentMethod === "qrcode" && (
                    <>
                      <div className="receipt-divider" />

                      <div className="qr-wrapper">
                        <div className="qr-box">
                          <QRCode
                            value={`${window.location.origin}/receipt/${orderId}`}
                            size={140}
                          />
                        </div>
                      </div>

                      {qrDemo && (
                        <>
                          <div className="receipt-info-row">
                            <span>ร้าน:</span>
                            <span>{qrDemo.merchantName}</span>
                          </div>
                          <div className="receipt-info-row">
                            <span>PromptPay:</span>
                            <span>{qrDemo.promptpayId}</span>
                          </div>
                          <div className="receipt-info-row">
                            <span>ยอดที่ต้องชำระ:</span>
                            <span style={{ fontWeight: 700, color: "#59AC77" }}>
                              {qrDemo.amount.toFixed(2)} ฿
                            </span>
                          </div>
                        </>
                      )}

                      <div className="qr-note">
                        สแกน QR เพื่อเปิดใบเสร็จบนโทรศัพท์
                      </div>
                    </>
                  )}

                  <div className="receipt-divider" />

                  <div className="receipt-items-header">
                    <span>รายการ</span>
                    <span>ราคา</span>
                  </div>

                  <div className="receipt-items-list">
                    {cart.map((item) => (
                      <div className="receipt-item-row" key={item.id}>
                        <span>
                          {item.name} x {item.qty}
                        </span>
                        <span>{(item.price * item.qty).toFixed(2)} ฿</span>
                      </div>
                    ))}
                  </div>

                  <div className="receipt-divider" />

                  <div className="receipt-summary-row sm">
                    <span>ยอดรวม</span>
                    <span>{subtotal.toFixed(2)} ฿</span>
                  </div>
                  <div className="receipt-summary-row sm">
                    <span>VAT 7%</span>
                    <span>{vat.toFixed(2)} ฿</span>
                  </div>
                  <div className="receipt-summary-row total">
                    <span>ยอดรวมสุทธิ</span>
                    <span>{total.toFixed(2)} ฿</span>
                  </div>

                  <div className="receipt-divider" />
                  <div className="receipt-footer-msg">ขอบคุณที่มาอุดหนุน</div>
                </div>

                <div className="receipt-action-area">
                  {paymentMethod === "qrcode" ? (
                    <button
                      className="print-receipt-btn"
                      onClick={handlePaymentSuccess}
                      disabled={stockUpdating}
                    >
                      {stockUpdating ? "กำลังบันทึก..." : "ยืนยันชำระเงินแล้ว"}
                    </button>
                  ) : (
                    <button
                      className="print-receipt-btn"
                      onClick={handlePrint}
                      disabled={stockUpdating}
                    >
                      พิมพ์ใบเสร็จ
                    </button>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
}