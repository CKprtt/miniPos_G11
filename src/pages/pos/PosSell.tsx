import React, { useEffect, useMemo, useState } from "react";
import { IonPage, IonContent, IonIcon, useIonViewWillEnter } from "@ionic/react";
import {
  homeOutline, cubeOutline, cartOutline, barChartOutline, logOutOutline,
  searchOutline, grid, restaurant, cafe, iceCream,
  addOutline, removeOutline, createOutline,
  cashOutline, cardOutline, qrCodeOutline,
  menuOutline, closeOutline,
} from "ionicons/icons";
import { useHistory, useLocation } from "react-router";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { collection, addDoc, getDocs, query, where, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { generateQrDemo } from "../../firebase/generateQrDemo";
import "./PosSell.css";

type ProductItem = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  photo?: string;
  ownerUid: string;
};

type CartItem = ProductItem & { qty: number };

export default function PosSell() {
  const history = useHistory();
  const location = useLocation();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState("dine-in");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingQr, setGeneratingQr] = useState(false);

  const isActive = (path: string) =>
    location.pathname.startsWith(path) ? "active" : "";

  const navigate = (path: string) => {
    history.push(path);
    setIsMobileMenuOpen(false);
  };

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

      const snapshot = await getDocs(
        query(collection(db, "products"), where("ownerUid", "==", currentUser.uid))
      );

      setProducts(
        snapshot.docs.map((item) => {
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
        })
      );
    } catch (error) {
      console.error("Load POS products error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ เพิ่ม useEffect
  useEffect(() => {
    setCart([]);
    loadProducts();
  }, []);

  useIonViewWillEnter(() => {
    setCart([]);
    loadProducts();
  });

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

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        selectedCategory === "all" ||
        normalizeCategory(p.category) === selectedCategory;
      const keyword = searchText.trim().toLowerCase();
      const matchSearch = keyword === "" || p.name.toLowerCase().includes(keyword);
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchText]);

  const getCartQty = (id: string) =>
    cart.find((item) => item.id === id)?.qty || 0;

  const addToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) { alert("จำนวนสินค้าในคลังไม่เพียงพอ"); return prev; }
        return prev.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      if (product.stock <= 0) { alert("สินค้าหมด"); return prev; }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const increaseQty = (id: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (item.qty >= item.stock) { alert("จำนวนสินค้าในคลังไม่เพียงพอ"); return item; }
        return { ...item, qty: item.qty + 1 };
      })
    );
  };

  const decreaseQty = (id: string) => {
    setCart((prev) =>
      prev.map((item) => item.id === id ? { ...item, qty: item.qty - 1 } : item)
          .filter((item) => item.qty > 0)
    );
  };

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  const vat = subtotal * 0.07;
  const total = subtotal + vat;
  const totalQty = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);

  const reduceStockNow = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) { alert("กรุณาเข้าสู่ระบบก่อน"); history.replace("/login"); return false; }

    for (const item of cart) {
      const productRef = doc(db, "products", item.id);
      const productSnap = await getDocs(
        query(collection(db, "products"), where("__name__", "==", item.id))
      );
      if (productSnap.empty) { alert(`ไม่พบสินค้า: ${item.name}`); return false; }
      const productData = productSnap.docs[0].data();
      const latestStock = Number(productData.stock || 0);
      if (latestStock < item.qty) { alert(`สต๊อก "${item.name}" ไม่พอ`); return false; }
      await updateDoc(productRef, { stock: latestStock - item.qty });
    }
    return true;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) { alert("ยังไม่มีรายการสินค้า"); return; }
    const currentUser = auth.currentUser;
    if (!currentUser) { alert("กรุณาเข้าสู่ระบบก่อน"); history.replace("/login"); return; }

    try {
      setGeneratingQr(true);
      if (paymentMethod !== "qrcode") {
        const stockOk = await reduceStockNow();
        if (!stockOk) return;
      }

      const docRef = await addDoc(collection(db, "sales"), {
        ownerUid: currentUser.uid,
        merchantName: auth.currentUser?.email || "ร้านของฉัน",
        cart, subtotal, vat, total, paymentMethod, orderType,
        createdAt: serverTimestamp(),
      });

      const orderId = docRef.id;
      if (paymentMethod === "qrcode") {
        const qrDemo = await generateQrDemo(total, orderId);
        history.push(`/receipt/${orderId}`, { orderId, qrDemo });
      } else {
        history.push(`/receipt/${orderId}`, { orderId });
      }
    } catch (e: any) {
      console.error("Checkout error:", e);
      alert(`เกิดข้อผิดพลาด: ${e.message}`);
    } finally {
      setGeneratingQr(false);
    }
  };

  const CartPanel = () => (
    <>
      <div className="cart-header">
        <h2>ออเดอร์ใหม่</h2>
        <button className="edit-order-btn"><IonIcon icon={createOutline} /></button>
      </div>

      <div className="order-tabs">
        {[
          { value: "dine-in", label: "ทานที่ร้าน" },
          { value: "takeaway", label: "กลับบ้าน" },
          { value: "delivery", label: "จัดส่ง" },
        ].map((t) => (
          <button key={t.value} className={`tab-btn ${orderType === t.value ? "active" : ""}`} onClick={() => setOrderType(t.value)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="cart-items-list">
        {cart.length === 0 ? (
          <div className="empty-cart">ยังไม่มีรายการสินค้า</div>
        ) : (
          cart.map((item) => (
            <div className="cart-item" key={item.id}>
              <div className="cart-item-img">
                <img src={item.photo || "https://via.placeholder.com/120"} alt="" />
              </div>
              <div className="cart-item-info">
                <div className="item-name">{item.name}</div>
                <div className="item-controls">
                  <button className="qty-btn" onClick={() => decreaseQty(item.id)}><IonIcon icon={removeOutline} /></button>
                  <span className="qty-val">{item.qty}</span>
                  <button className="qty-btn" onClick={() => increaseQty(item.id)}><IonIcon icon={addOutline} /></button>
                </div>
              </div>
              <div className="item-price">{(item.price * item.qty).toLocaleString()} ฿</div>
            </div>
          ))
        )}
      </div>

      <div className="cart-summary">
        <div className="summary-row"><span>ยอดรวม</span><span>{subtotal.toLocaleString()} ฿</span></div>
        <div className="summary-row"><span>VAT 7%</span><span>{vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿</span></div>
        <div className="summary-row total"><span>ยอดรวมสุทธิ</span><span>{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿</span></div>
      </div>

      <div className="payment-methods">
        {[
          { value: "cash", icon: cashOutline, label: "เงินสด" },
          { value: "card", icon: cardOutline, label: "บัตร" },
          { value: "qrcode", icon: qrCodeOutline, label: "QR Code" },
        ].map((m) => (
          <button key={m.value} className={`pay-method-btn ${paymentMethod === m.value ? "active" : ""}`} onClick={() => setPaymentMethod(m.value)}>
            <IonIcon icon={m.icon} /><span>{m.label}</span>
          </button>
        ))}
      </div>

      <button className="checkout-btn" onClick={handleCheckout} disabled={generatingQr}>
        {generatingQr ? "กำลังบันทึก..." : `ชำระเงิน ${total > 0 ? `${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿` : ""}`}
      </button>
    </>
  );

  const navItems = [
    { path: "/home", icon: homeOutline, label: "หลัก" },
    { path: "/products", icon: cubeOutline, label: "สินค้า" },
    { path: "/pos", icon: cartOutline, label: "ขาย" },
    { path: "/sales/history", icon: barChartOutline, label: "ยอดขาย" },
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
                {navItems.map((item) => (
                  <div key={item.path} className={`menu-item ${isActive(item.path)}`} onClick={() => navigate(item.path)}>
                    <IonIcon icon={item.icon} /><span>{item.label}</span>
                  </div>
                ))}
              </nav>
              <div className="logout-section mobile">
                <button className="logout-btn" onClick={handleLogout}><IonIcon icon={logOutOutline} /> ออกจากระบบ</button>
              </div>
            </div>
          </div>

          <main className="pos-layout">
            <div className="pos-products-area">
              <div className="pos-header">
                <div className="search-wrapper">
                  <IonIcon icon={searchOutline} />
                  <input type="text" placeholder="ค้นหาสินค้า..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                </div>
                <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(true)}><IonIcon icon={menuOutline} /></button>
              </div>

              <div className="category-tabs">
                {[
                  { value: "all", icon: grid, label: "ทั้งหมด" },
                  { value: "food", icon: restaurant, label: "อาหาร" },
                  { value: "drink", icon: cafe, label: "เครื่องดื่ม" },
                  { value: "dessert", icon: iceCream, label: "ของหวาน" },
                ].map((cat) => (
                  <div key={cat.value} className={`cat-item ${selectedCategory === cat.value ? "active" : ""}`} onClick={() => setSelectedCategory(cat.value)}>
                    <IonIcon icon={cat.icon} /><span>{cat.label}</span>
                  </div>
                ))}
              </div>

              <div className="pos-product-grid">
                {loading ? (
                  <div className="state-msg">กำลังโหลดข้อมูล...</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="state-msg">ไม่พบสินค้า</div>
                ) : (
                  filteredProducts.map((p) => {
                    const remaining = p.stock - getCartQty(p.id);
                    return (
                      <div className="pos-card" key={p.id}>
                        <div className="pos-card-img">
                          <img src={p.photo || "https://via.placeholder.com/300x200?text=No+Image"} alt={p.name} />
                        </div>
                        <div className="pos-card-body">
                          <div className="product-name">{p.name}</div>
                          <div className="product-price">{p.price.toLocaleString()} ฿</div>
                          <div className="product-stock">คงเหลือ {remaining} ชิ้น</div>
                          <button className="add-cart-btn" onClick={() => addToCart(p)} disabled={remaining <= 0}>
                            {remaining <= 0 ? "สินค้าหมด" : "เพิ่มเข้าตะกร้า"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pos-cart-area"><CartPanel /></div>
          </main>

          <button className="cart-fab" onClick={() => setIsCartOpen(true)} style={{ position: "fixed" }}>
            <IonIcon icon={cartOutline} />
            {totalQty > 0 && <span className="cart-fab-badge">{totalQty}</span>}
          </button>

          <div className={`mobile-cart-sheet ${isCartOpen ? "open" : ""}`}>
            <div className="sheet-backdrop" onClick={() => setIsCartOpen(false)} />
            <div className="sheet-content">
              <div className="sheet-handle" onClick={() => setIsCartOpen(false)} />
              <CartPanel />
            </div>
          </div>

          <nav className="bottom-nav">
            {navItems.map((item) => (
              <button key={item.path} className={`bottom-nav-item ${isActive(item.path)}`} onClick={() => history.push(item.path)}>
                <IonIcon icon={item.icon} /><span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </IonContent>
    </IonPage>
  );
}