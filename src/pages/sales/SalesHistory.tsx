import React, { useMemo, useState, useEffect } from "react";
import { IonPage, IonContent, IonIcon, useIonViewWillEnter } from "@ionic/react";
import {
  homeOutline, cubeOutline, cartOutline, barChartOutline,
  logOutOutline, menuOutline, closeOutline
} from "ionicons/icons";
import { useHistory, useLocation } from "react-router";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import "./SalesHistory.css";

type SaleItem = { productId: string; name: string; price: number; qty: number; total: number; };
type SaleRecord = {
  id: string; createdAt?: any;
  subtotal: number; vat: number; total: number;
  paymentMethod: string; orderType: string; items: SaleItem[];
};

export default function SalesHistory() {
  const history = useHistory();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [salesData, setSalesData] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const isActive = (path: string) => location.pathname.startsWith(path) ? "active" : "";
  const navigate = (path: string) => { history.push(path); setIsMobileMenuOpen(false); };

  const loadSales = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) { setSalesData([]); setLoading(false); return; }

      const q = query(collection(db, "sales"), where("ownerUid", "==", currentUser.uid));
      const snapshot = await getDocs(q);
      const list: SaleRecord[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        // ✅ รองรับทั้ง field "items" และ "cart"
        const items = Array.isArray(d.items) && d.items.length > 0 ? d.items
          : Array.isArray(d.cart) ? d.cart : [];
        return {
          id: docSnap.id, createdAt: d.createdAt,
          subtotal: Number(d.subtotal || 0), vat: Number(d.vat || 0), total: Number(d.total || 0),
          paymentMethod: d.paymentMethod || "", orderType: d.orderType || "",
          items,
        };
      });
      list.sort((a, b) => {
        const aT = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bT = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bT - aT;
      });
      setSalesData(list);
    } catch (error: any) {
      console.error("Load sales error:", error);
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSales(); }, []);
  useIonViewWillEnter(() => { loadSales(); });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsMobileMenuOpen(false);
      alert("ออกจากระบบสำเร็จ");
      history.replace("/login");
    } catch { alert("ออกจากระบบไม่สำเร็จ"); }
  };

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalSalesAmount   = useMemo(() => salesData.reduce((s, r) => s + r.total, 0), [salesData]);
  const totalBills         = useMemo(() => salesData.length, [salesData]);
  const totalItemsSold     = useMemo(() => salesData.reduce((s, r) => s + r.items.reduce((ss, i) => ss + Number(i.qty || 0), 0), 0), [salesData]);
  const monthlySalesAmount = useMemo(() => {
    const now = new Date();
    return salesData.reduce((s, r) => {
      if (!r.createdAt?.toDate) return s;
      const d = r.createdAt.toDate();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() ? s + r.total : s;
    }, 0);
  }, [salesData]);
  const weeklySalesAmount  = useMemo(() => {
    const now = new Date(); const last7 = new Date(); last7.setDate(now.getDate() - 6);
    return salesData.reduce((s, r) => {
      if (!r.createdAt?.toDate) return s;
      return r.createdAt.toDate() >= last7 ? s + r.total : s;
    }, 0);
  }, [salesData]);
  const latestUpdateText   = useMemo(() => {
    if (!salesData.length || !salesData[0].createdAt?.toDate) return "-";
    const d = salesData[0].createdAt.toDate();
    return `${d.toLocaleDateString("th-TH")} ${d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}`;
  }, [salesData]);

  const sidebarLinks = [
    { path: "/home",          icon: homeOutline,     label: "หน้าหลัก" },
    { path: "/products",      icon: cubeOutline,     label: "สินค้า" },
    { path: "/pos",           icon: cartOutline,     label: "ขาย" },
    { path: "/sales/history", icon: barChartOutline, label: "สรุปยอดขาย" },
  ];

  return (
    <IonPage>
      <IonContent>
        <div className="layout-container">
          <aside className="sidebar">
            <div className="logo-section"><div className="logo-circle">miniPOS</div></div>
            <nav className="menu-list">
              {sidebarLinks.map(({ path, icon, label }) => (
                <div key={path} className={`menu-item ${isActive(path)}`} onClick={() => history.push(path)}>
                  <IonIcon icon={icon} /><span>{label}</span>
                </div>
              ))}
            </nav>
            <div className="logout-section">
              <button className="logout-btn" onClick={handleLogout}><IonIcon icon={logOutOutline} /> ออกจากระบบ</button>
            </div>
          </aside>

          <div className={`mobile-menu-overlay ${isMobileMenuOpen ? "open" : ""}`} onClick={() => setIsMobileMenuOpen(false)}>
            <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-menu-header">
                <div className="logo-circle sm">miniPOS</div>
                <button className="close-menu-btn" onClick={() => setIsMobileMenuOpen(false)}><IonIcon icon={closeOutline} /></button>
              </div>
              <nav className="menu-list mobile">
                {sidebarLinks.map(({ path, icon, label }) => (
                  <div key={path} className={`menu-item ${isActive(path)}`} onClick={() => navigate(path)}>
                    <IonIcon icon={icon} /><span>{label}</span>
                  </div>
                ))}
              </nav>
              <div className="logout-section mobile">
                <button className="logout-btn" onClick={handleLogout}><IonIcon icon={logOutOutline} /> ออกจากระบบ</button>
              </div>
            </div>
          </div>

          <main className="main-content">
            <div className="page-header">
              <h1>สรุปยอดขาย</h1>
              <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(true)}><IonIcon icon={menuOutline} /></button>
            </div>

            <div className="summary-cards-container">
              <div className="summary-card">
                <div className="summary-item">
                  <div className="sum-label">ยอดขายรวม</div>
                  <div className="sum-value large">{loading ? "..." : `${fmt(totalSalesAmount)} ฿`}</div>
                </div>
                <div className="summary-item">
                  <div className="sum-label sub">ยอดขายรายเดือน</div>
                  <div className="sum-value medium">{loading ? "..." : `${fmt(monthlySalesAmount)} ฿`}</div>
                </div>
                <div className="summary-item">
                  <div className="sum-label sub">ยอดขายรายสัปดาห์</div>
                  <div className="sum-value medium">{loading ? "..." : `${fmt(weeklySalesAmount)} ฿`}</div>
                </div>
              </div>

              <div className="summary-card center-content">
                <div className="sum-label">ยอดรายการรวม</div>
                <div className="sum-value highlight">{loading ? "..." : `${totalBills.toLocaleString()} รายการ`}</div>
                <div className="card-footer-time">{latestUpdateText}</div>
              </div>

              <div className="summary-card center-content">
                <div className="sum-label">ยอดสินค้าที่ขายออก</div>
                <div className="sum-value highlight">{loading ? "..." : `${totalItemsSold.toLocaleString()} ชิ้น`}</div>
                <div className="card-footer-time">{latestUpdateText}</div>
              </div>
            </div>

            <h2 className="section-title">ประวัติการขาย</h2>

            <div className="table-container">
              <div className="custom-table-header">
                <div className="th col-id">ลำดับที่</div>
                <div className="th col-date">วันที่</div>
                <div className="th col-time">เวลา</div>
                <div className="th col-amount">ยอดเงิน</div>
                <div className="th col-detail">รายละเอียดบิล</div>
              </div>
              <div className="custom-table-body">
                {loading ? (
                  <div className="state-msg">กำลังโหลดข้อมูล...</div>
                ) : salesData.length === 0 ? (
                  <div className="state-msg">ยังไม่มีประวัติการขาย</div>
                ) : (
                  salesData.map((item, index) => {
                    const d = item.createdAt?.toDate ? item.createdAt.toDate() : null;
                    return (
                      <div className={`custom-table-row ${index % 2 !== 0 ? "even" : ""}`} key={item.id}>
                        <div className="td col-id">{index + 1}</div>
                        <div className="td col-date">{d ? d.toLocaleDateString("th-TH") : "-"}</div>
                        <div className="td col-time">{d ? d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "-"}</div>
                        <div className="td col-amount">{fmt(item.total)}</div>
                        <div className="td col-detail">
                          <span className="detail-link">{item.items.length > 0 ? item.items.map(x => `${x.name} x${x.qty}`).join(", ") : "-"}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="sale-card-list">
              {loading ? (
                <div className="state-msg">กำลังโหลดข้อมูล...</div>
              ) : salesData.length === 0 ? (
                <div className="state-msg">ยังไม่มีประวัติการขาย</div>
              ) : (
                salesData.map((item, index) => {
                  const d = item.createdAt?.toDate ? item.createdAt.toDate() : null;
                  const dateText = d ? `${d.toLocaleDateString("th-TH")} · ${d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}` : "-";
                  const itemsText = item.items.length > 0 ? item.items.map(x => `${x.name} x${x.qty}`).join("  ·  ") : "-";
                  return (
                    <div className="sale-card" key={item.id}>
                      <div className="sale-card-top">
                        <span className="sale-card-index">ลำดับ {index + 1}</span>
                        <span className="sale-card-total">{fmt(item.total)} ฿</span>
                      </div>
                      <div className="sale-card-items">{itemsText}</div>
                      <div className="sale-card-datetime">{dateText}</div>
                    </div>
                  );
                })
              )}
            </div>
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
}
