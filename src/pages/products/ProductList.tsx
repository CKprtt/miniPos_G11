import React, { useState, useEffect } from "react";
import { IonPage, IonContent, IonIcon, useIonViewWillEnter } from "@ionic/react";
import {
  homeOutline, cubeOutline, cartOutline, barChartOutline, logOutOutline,
  add, optionsOutline, grid, restaurant, cafe, iceCream,
  searchOutline, menuOutline, closeOutline
} from "ionicons/icons";
import { useHistory, useLocation } from "react-router";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import "./ProductList.css";

type ProductItem = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  photo?: string;
  ownerUid: string;
};

export default function ProductList() {
  const history = useHistory();
  const location = useLocation();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isActive = (path: string) => location.pathname.startsWith(path) ? "active" : "";

  const navigate = (path: string) => { history.push(path); setIsMobileMenuOpen(false); };

  const normalizeCategory = (category: string) => {
    const c = (category || "").trim().toLowerCase();
    if (c === "food" || c === "อาหาร") return "food";
    if (c === "drink" || c === "เครื่องดื่ม") return "drink";
    if (c === "dessert" || c === "ของหวาน") return "dessert";
    return c;
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) { setProducts([]); return; }
      const q = query(collection(db, "products"), where("ownerUid", "==", currentUser.uid));
      const snapshot = await getDocs(q);
      const list: ProductItem[] = snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          name: data.name || "",
          price: Number(data.price || 0),
          stock: Number(data.stock || 0),
          category: data.category || "",
          photo: data.photo || "",
          ownerUid: data.ownerUid || "",
        };
      });
      setProducts(list);
    } catch (error) {
      console.error("Load products error:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ เพิ่ม useEffect
  useEffect(() => { loadProducts(); }, []);
  useIonViewWillEnter(() => { loadProducts(); });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsMobileMenuOpen(false);
      alert("ออกจากระบบสำเร็จ");
      history.replace("/login");
    } catch { alert("ออกจากระบบไม่สำเร็จ"); }
  };

  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === "all" || normalizeCategory(p.category) === selectedCategory;
    const keyword = searchText.trim().toLowerCase();
    const matchSearch = keyword === "" || p.name.toLowerCase().includes(keyword) || p.category.toLowerCase().includes(keyword);
    return matchCategory && matchSearch;
  });

  const categories = [
    { key: "all",     icon: grid,       label: "ทั้งหมด" },
    { key: "food",    icon: restaurant, label: "อาหาร" },
    { key: "drink",   icon: cafe,       label: "เครื่องดื่ม" },
    { key: "dessert", icon: iceCream,   label: "ของหวาน" },
  ];

  return (
    <IonPage>
      <IonContent>
        <div className="layout-container">
          <aside className="sidebar">
            <div className="logo-section"><div className="logo-circle">miniPOS</div></div>
            <nav className="menu-list">
              <div className={`menu-item ${isActive("/home")}`} onClick={() => history.push("/home")}><IonIcon icon={homeOutline} /><span>หน้าหลัก</span></div>
              <div className={`menu-item ${isActive("/products")}`} onClick={() => history.push("/products")}><IonIcon icon={cubeOutline} /><span>สินค้า</span></div>
              <div className={`menu-item ${isActive("/pos")}`} onClick={() => history.push("/pos")}><IonIcon icon={cartOutline} /><span>ขาย</span></div>
              <div className={`menu-item ${isActive("/sales")}`} onClick={() => history.push("/sales/history")}><IonIcon icon={barChartOutline} /><span>สรุปยอดขาย</span></div>
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
                <div className={`menu-item ${isActive("/home")}`} onClick={() => navigate("/home")}><IonIcon icon={homeOutline} /><span>หน้าหลัก</span></div>
                <div className={`menu-item ${isActive("/products")}`} onClick={() => navigate("/products")}><IonIcon icon={cubeOutline} /><span>สินค้า</span></div>
                <div className={`menu-item ${isActive("/pos")}`} onClick={() => navigate("/pos")}><IonIcon icon={cartOutline} /><span>ขาย</span></div>
                <div className={`menu-item ${isActive("/sales")}`} onClick={() => navigate("/sales/history")}><IonIcon icon={barChartOutline} /><span>สรุปยอดขาย</span></div>
              </nav>
              <div className="logout-section mobile">
                <button className="logout-btn" onClick={handleLogout}><IonIcon icon={logOutOutline} /> ออกจากระบบ</button>
              </div>
            </div>
          </div>

          <main className="main-content">
            <div className="page-header">
              <h1>รายการสินค้า</h1>
              <div className="header-actions">
                <div className="search-wrapper">
                  <IonIcon icon={searchOutline} />
                  <input type="text" placeholder="ค้นหา..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                </div>
                <button className="icon-btn filter-btn"><IonIcon icon={optionsOutline} /></button>
                <button className="primary-btn add-btn" onClick={() => history.push("/products/add")}>
                  <IonIcon icon={add} /><span>เพิ่มรายการ</span>
                </button>
                <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(true)}><IonIcon icon={menuOutline} /></button>
              </div>
            </div>

            <div className="category-tabs">
              {categories.map((cat) => (
                <div key={cat.key} className={`cat-item ${selectedCategory === cat.key ? "active" : ""}`} onClick={() => setSelectedCategory(cat.key)}>
                  <IonIcon icon={cat.icon} /><span>{cat.label}</span>
                </div>
              ))}
            </div>

            <div className="product-grid">
              {loading ? (
                <div className="state-msg">กำลังโหลดข้อมูล...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="state-msg">ยังไม่มีสินค้า</div>
              ) : (
                filteredProducts.map((p) => (
                  <div className="product-card" key={p.id}>
                    <div className="card-img">
                      {p.photo && p.photo.trim() !== "" ? (
                        <img src={p.photo} alt={p.name} />
                      ) : (
                        <span className="card-img-empty">ไม่มีรูปสินค้า</span>
                      )}
                    </div>
                    <div className="card-body">
                      <div className="product-name">{p.name}</div>
                      <div className="product-price">{p.price.toLocaleString()} ฿</div>
                      <div className="product-stock">คงเหลือ {p.stock} ชิ้น</div>
                      <button className="edit-btn-card" onClick={() => history.push(`/products/edit/${p.id}`)}>แก้ไขรายการ</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
}