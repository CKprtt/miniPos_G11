import { IonRouterOutlet } from "@ionic/react";
import { Route, Redirect, HashRouter } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase/config";

// Auth
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";

// Home
import Home from "../pages/home/Home";

// Products
import ProductList from "../pages/products/ProductList";
import AddProduct from "../pages/products/AddProduct";
import EditProduct from "../pages/products/EditProduct";

// POS
import PosSell from "../pages/pos/PosSell";
import ReceiptPreview from "../pages/pos/ReceiptPreview";

// Sales
import SalesHistory from "../pages/sales/SalesHistory";

export default function AppRouter() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    return null;
  }

  return (
    <HashRouter>
      <IonRouterOutlet>
        <Route
          exact
          path="/login"
          render={() => (user ? <Redirect to="/home" /> : <Login />)}
        />

        <Route
          exact
          path="/register"
          render={() => (user ? <Redirect to="/home" /> : <Register />)}
        />

        <Route
          exact
          path="/forgot-password"
          render={() => (user ? <Redirect to="/home" /> : <ForgotPassword />)}
        />

        <Route
          exact
          path="/home"
          render={() => (user ? <Home /> : <Redirect to="/login" />)}
        />

        <Route
          exact
          path="/products"
          render={() => (user ? <ProductList /> : <Redirect to="/login" />)}
        />

        <Route
          exact
          path="/products/add"
          render={() => (user ? <AddProduct /> : <Redirect to="/login" />)}
        />

        <Route
          exact
          path="/products/edit/:id"
          render={() => (user ? <EditProduct /> : <Redirect to="/login" />)}
        />

        <Route
          exact
          path="/pos"
          render={() => (user ? <PosSell /> : <Redirect to="/login" />)}
        />

        <Route
          exact
          path="/receipt/:id"
          render={() => (user ? <ReceiptPreview /> : <Redirect to="/login" />)}
        />

        <Route
          exact
          path="/sales/history"
          render={() => (user ? <SalesHistory /> : <Redirect to="/login" />)}
        />

        <Route exact path="/">
          <Redirect to={user ? "/home" : "/login"} />
        </Route>

        <Route path="*">
          <Redirect to={user ? "/home" : "/login"} />
        </Route>
      </IonRouterOutlet>
    </HashRouter>
  );
}