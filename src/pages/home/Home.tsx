import React, { useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { IonPage, IonContent, IonIcon, useIonViewWillEnter } from "@ionic/react";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";
import {
  homeOutline,
  cubeOutline,
  cartOutline,
  barChartOutline,
  logOutOutline,
  addOutline,
  menuOutline,
  closeOutline,
  chevronForwardOutline,
  storefrontOutline
} from "ionicons/icons";
import "./Home.css";

type SaleItem = {
  productId: string;
  name: string;
  qty: number;
  price?: number;
};

type SaleRecord = {
  id: string;
  createdAt?: any;
  total: number;
  items: SaleItem[];
};

type ProductRecord = {
  id: string;
  name: string;
  stock: number;
  category: string;
  photo?: string;
};

type SaleTableRow = {
  id: string;
  productName: string;
  timeText: string;
  qty: number;
  totalPrice: number;
};

const CATEGORY_ICONS: Record<string, string> = {
  อาหาร: "🍽️",
  เครื่องดื่ม: "🧋",
  ของหวาน: "🍮",
  food: "🍽️",
  drink: "🧋",
  dessert: "🍮",
};

export default function Home() {
  const history = useHistory();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [shopName, setShopName] = useState("ร้านของฉัน");
  const [productCount, setProductCount] = useState(0);
  const [productRows, setProductRows] = useState<ProductRecord[]>([]);
  const [todaySalesCount, setTodaySalesCount] = useState(0);
  const [todaySalesAmount, setTodaySalesAmount] = useState(0);
  const [todaySalesRows, setTodaySalesRows] = useState<SaleRecord[]>([]);
  const [todaySalesTableRows, setTodaySalesTableRows] = useState<SaleTableRow[]>([]);
  const [bestSellingName, setBestSellingName] = useState("ยังไม่มีข้อมูล");
  const [bestSellingQty, setBestSellingQty] = useState(0);
  const [loading, setLoading] = useState(true);

  const isActive = (path: string) =>
    location.pathname === path ? "active" : "";

  const navigate = (path: string) => {
    history.push(path);
    setIsMobileMenuOpen(false);
  };

  const isSameDay = (date: Date, compare: Date) =>
    date.getDate() === compare.getDate() &&
    date.getMonth() === compare.getMonth() &&
    date.getFullYear() === compare.getFullYear();

  const normalizeCategoryLabel = (category: string) => {
    const raw = (category || "").trim();
    const c = raw.toLowerCase();
    if (c === "food") return "อาหาร";
    if (c === "drink") return "เครื่องดื่ม";
    if (c === "dessert") return "ของหวาน";
    if (raw === "อาหาร" || raw === "เครื่องดื่ม" || raw === "ของหวาน") return raw;
    return category || "-";
  };

  const resetHomeState = () => {
    setShopName("ร้านของฉัน");
    setProductCount(0);
    setProductRows([]);
    setTodaySalesCount(0);
    setTodaySalesAmount(0);
    setTodaySalesRows([]);
    setTodaySalesTableRows([]);
    setBestSellingName("ยังไม่มีข้อมูล");
    setBestSellingQty(0);
  };

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) { resetHomeState(); return; }

      try {
        const userSnap = await getDoc(doc(db, "users", currentUser.uid));
        setShopName(
          userSnap.exists()
            ? userSnap.data().shopName || currentUser.email || "ร้านของฉัน"
            : currentUser.email || "ร้านของฉัน"
        );
      } catch {
        setShopName(currentUser.email || "ร้านของฉัน");
      }

      let productList: ProductRecord[] = [];
      const productMapById: Record<string, ProductRecord> = {};
      const existingProductIds = new Set<string>();

      try {
        const productSnapshot = await getDocs(
          query(collection(db, "products"), where("ownerUid", "==", currentUser.uid))
        );
        let totalStock = 0;
        productSnapshot.forEach((item) => {
          const data = item.data();
          const stock = Number(data.stock || 0);
          totalStock += stock;
          const productItem: ProductRecord = {
            id: item.id,
            name: data.name || "-",
            stock,
            category: data.category || "-",
            photo: data.photo || ""
          };
          productList.push(productItem);
          productMapById[item.id] = productItem;
          existingProductIds.add(item.id);
        });
        productList.sort((a, b) => b.stock - a.stock);
        setProductCount(totalStock);
        setProductRows(productList.slice(0, 6));
      } catch {
        setProductCount(0);
        setProductRows([]);
      }

      try {
        const salesSnapshot = await getDocs(
          query(collection(db, "sales"), where("ownerUid", "==", currentUser.uid))
        );
        const allSales: SaleRecord[] = salesSnapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            createdAt: data.createdAt,
            total: Number(data.total || 0),
            items: Array.isArray(data.items) ? data.items : []
          };
        });

        const bestSellerMap: Record<string, number> = {};
        allSales.forEach((sale) => {
          sale.items.forEach((item) => {
            const productId = item.productId || "";
            if (!productId || !existingProductIds.has(productId)) return;
            bestSellerMap[productId] = (bestSellerMap[productId] || 0) + Number(item.qty || 0);
          });
        });

        let topProductId = "";
        let topQty = 0;
        Object.entries(bestSellerMap).forEach(([productId, qty]) => {
          if (qty > topQty) { topProductId = productId; topQty = qty; }
        });

        if (topProductId && productMapById[topProductId]) {
          setBestSellingName(productMapById[topProductId].name || "ยังไม่มีข้อมูล");
          setBestSellingQty(topQty);
        } else {
          setBestSellingName("ยังไม่มีข้อมูล");
          setBestSellingQty(0);
        }

        const now = new Date();
        const todaySales = allSales
          .filter((s) => s.createdAt?.toDate && isSameDay(s.createdAt.toDate(), now))
          .sort((a, b) =>
            (b.createdAt?.toDate?.().getTime() || 0) - (a.createdAt?.toDate?.().getTime() || 0)
          );

        setTodaySalesCount(todaySales.length);
        setTodaySalesAmount(todaySales.reduce((sum, s) => sum + s.total, 0));
        setTodaySalesRows(todaySales.slice(0, 5));

        const saleTableRows: SaleTableRow[] = [];
        todaySales.forEach((sale) => {
          const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : null;
          const timeText = saleDate
            ? saleDate.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
            : "-";
          sale.items.forEach((item, index) => {
            const qty = Number(item.qty || 0);
            const itemName = item.name || productMapById[item.productId]?.name || "-";
            const unitPrice =
              typeof item.price === "number"
                ? Number(item.price)
                : qty > 0 ? Number(sale.total || 0) / qty : 0;
            saleTableRows.push({
              id: `${sale.id}-${item.productId || index}`,
              productName: itemName,
              timeText,
              qty,
              totalPrice: unitPrice * qty
            });
          });
        });
        setTodaySalesTableRows(saleTableRows.slice(0, 10));
      } catch {
        setTodaySalesCount(0);
        setTodaySalesAmount(0);
        setTodaySalesRows([]);
        setTodaySalesTableRows([]);
        setBestSellingName("ยังไม่มีข้อมูล");
        setBestSellingQty(0);
      }
    } finally {
      setLoading(false);
    }
  };

  useIonViewWillEnter(() => { loadHomeData(); });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsMobileMenuOpen(false);
      alert("ออกจากระบบสำเร็จ");
      history.replace("/login");
    } catch {
      alert("ออกจากระบบไม่สำเร็จ");
    }
  };

  const menuItems = [
    { path: "/home", icon: homeOutline, label: "หน้าหลัก" },
    { path: "/products", icon: cubeOutline, label: "สินค้า" },
    { path: "/pos", icon: cartOutline, label: "ขาย" },
    { path: "/sales/history", icon: barChartOutline, label: "สรุปยอดขาย" }
  ];

  return (
    <IonPage>
      <IonContent>
        <div className="home-container">

          {/* ===== SIDEBAR (desktop) ===== */}
          <aside className="sidebar">
            <div className="logo-section">
              <div className="logo-circle">miniPOS</div>
            </div>
            <nav className="menu-list">
              {menuItems.map((item) => (
                <div
                  key={item.path}
                  className={`menu-item ${isActive(item.path)}`}
                  onClick={() => history.push(item.path)}
                >
                  <IonIcon icon={item.icon} />
                  <span>{item.label}</span>
                </div>
              ))}
            </nav>
            <div className="logout-section">
              <button className="logout-btn" onClick={handleLogout}>
                <IonIcon icon={logOutOutline} /> ออกจากระบบ
              </button>
            </div>
          </aside>

          {/* ===== MOBILE DRAWER ===== */}
          <div
            className={`mobile-menu-overlay ${isMobileMenuOpen ? "open" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-menu-header">
                <div className="logo-circle sm">miniPOS</div>
                <button className="close-menu-btn" onClick={() => setIsMobileMenuOpen(false)}>
                  <IonIcon icon={closeOutline} />
                </button>
              </div>
              <nav className="menu-list mobile">
                {menuItems.map((item) => (
                  <div
                    key={item.path}
                    className={`menu-item ${isActive(item.path)}`}
                    onClick={() => navigate(item.path)}
                  >
                    <IonIcon icon={item.icon} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </nav>
              <div className="logout-section mobile">
                <button className="logout-btn" onClick={handleLogout}>
                  <IonIcon icon={logOutOutline} /> ออกจากระบบ
                </button>
              </div>
            </div>
          </div>

          {/* ===== MAIN ===== */}
          <div className="main-content">

            {/* Header */}
            <div className="home-header-row">
              <div className="header-left">
                <IonIcon icon={storefrontOutline} className="header-shop-icon" />
                <h1 className="header-title">{shopName}</h1>
              </div>
              <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(true)}>
                <IonIcon icon={menuOutline} />
              </button>
            </div>

            {/* Stat Cards */}
            <div className="stats-container">
              <div className="stat-card">
                <img src="https://cdn-icons-png.flaticon.com/512/3045/3045613.png" alt="stock" />
                <div className="stat-card-body">
                  <div className="stat-label">จำนวนสินค้าในคลัง</div>
                  <div className="stat-value">{loading ? "..." : `${productCount} ชิ้น`}</div>
                </div>
              </div>

              <div className="stat-card">
                <img src="https://cdn-icons-png.flaticon.com/512/3502/3502688.png" alt="orders" />
                <div className="stat-card-body">
                  <div className="stat-label">รายการขายวันนี้</div>
                  <div className="stat-value">{loading ? "..." : `${todaySalesCount} รายการ`}</div>
                </div>
              </div>

              <div className="stat-card">
                <img src="https://cdn-icons-png.flaticon.com/512/2454/2454282.png" alt="sales" />
                <div className="stat-card-body">
                  <div className="stat-label">ยอดขายวันนี้</div>
                  <div className="stat-value">
                    {loading ? "..." : `${todaySalesAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2, maximumFractionDigits: 2
                    })} บาท`}
                  </div>
                </div>
              </div>

              <div className="promo-card">
                <div className="promo-text">
                  <h3>สินค้าที่ยอดขายดีที่สุด</h3>
                  <p>{loading ? "กำลังโหลด..." : bestSellingQty > 0 ? bestSellingName : "ยังไม่มีข้อมูล"}</p>
                  {!loading && bestSellingQty > 0 && <p>ขายได้ทั้งหมด {bestSellingQty} ชิ้น</p>}
                </div>
                <div className="promo-img-wrapper">
                  <div className="promo-logo">miniPOS</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="action-links">
              <button className="btn-action btn-sell" onClick={() => history.push("/pos")}>
                <IonIcon icon={cartOutline} /> ขายสินค้า
              </button>
              <button className="btn-action btn-add" onClick={() => history.push("/products")}>
                <IonIcon icon={addOutline} /> เพิ่มสินค้า
              </button>
            </div>

            {/* ===== PRODUCT TABLE ===== */}
            <div className="section">
              <div className="section-header">
                <span>สินค้าในคลัง</span>
                <button className="see-all-btn" onClick={() => history.push("/products")}>
                  ดูทั้งหมด <IonIcon icon={chevronForwardOutline} />
                </button>
              </div>

              {/* meta: count + legend */}
              <div className="table-meta-row">
                <span className="table-meta-count">{productRows.length} รายการ</span>
                <div className="table-legend">
                  <span className="legend-dot ok" />
                  <span className="legend-text">ปกติ</span>
                  <span className="legend-dot low" />
                  <span className="legend-text">ต่ำ (≤5)</span>
                </div>
              </div>

              <div className="card-table">
                <div className="card-section-label">รายการสินค้า</div>
                {loading ? (
                  <div className="empty-state">กำลังโหลด...</div>
                ) : productRows.length === 0 ? (
                  <div className="empty-state">ยังไม่มีสินค้าในคลัง</div>
                ) : (
                  productRows.map((p) => {
                    const label = normalizeCategoryLabel(p.category);
                    return (
                      <div className="row-item" key={p.id}>
                      
                        <div className="row-left">
                          <span className="row-name">{p.name}</span>
                          <span className="row-sub">{label}</span>
                        </div>
                        <span className={`stock-badge ${p.stock <= 5 ? "low" : "ok"}`}>
                          {p.stock <= 5 ? "" : ""}{p.stock} ชิ้น
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ===== SALE TABLE ===== */}
            <div className="section">
              <div className="section-header">
                <span>ประวัติขายวันนี้</span>
                <button className="see-all-btn" onClick={() => history.push("/sales/history")}>
                  ดูทั้งหมด <IonIcon icon={chevronForwardOutline} />
                </button>
              </div>

              {/* meta: count + total */}
              <div className="table-meta-row">
                <span className="table-meta-count">{todaySalesTableRows.length} รายการ</span>
                {todaySalesTableRows.length > 0 && (
                  <span className="table-total-badge">
                    รวม ฿{todaySalesAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2, maximumFractionDigits: 2
                    })}
                  </span>
                )}
              </div>

              <div className="card-table">
                <div className="card-section-label">ประวัติการขาย</div>
                {loading ? (
                  <div className="empty-state">กำลังโหลด...</div>
                ) : todaySalesTableRows.length === 0 ? (
                  <div className="empty-state">ยังไม่มีรายการขายวันนี้</div>
                ) : (
                  todaySalesTableRows.map((row, i) => (
                    <div className="sale-row" key={row.id}>
                      <div className="sale-timeline">
                        <div className="sale-dot" />
                        {i < todaySalesTableRows.length - 1 && <div className="sale-line" />}
                      </div>
                      <div className="sale-info">
                        <div className="sale-name">{row.productName}</div>
                        <div className="sale-meta">
                          <span className="sale-time">{row.timeText} น.</span>
                          <span className="sale-qty">x{row.qty}</span>
                        </div>
                      </div>
                      <div className="sale-price-col">
                        <div className="sale-price">
                          ฿{row.totalPrice.toLocaleString(undefined, {
                            minimumFractionDigits: 2, maximumFractionDigits: 2
                          })}
                        </div>
                        <div className="sale-price-unit">บาท</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>{/* end main-content */}

          {/* ===== BOTTOM NAV (mobile) ===== */}
          <nav className="bottom-nav">
            {menuItems.map((item) => (
              <button
                key={item.path}
                className={`bottom-nav-item ${isActive(item.path)}`}
                onClick={() => history.push(item.path)}
              >
                <IonIcon icon={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

        </div>
      </IonContent>
    </IonPage>
  );
}