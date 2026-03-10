import React, { useState } from "react";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import {
  personOutline,
  lockClosedOutline,
  logoFacebook,
  logoGoogle,
  logoApple,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../../firebase/config";
import "./Login.css";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const getPasswordHint = () => {
    if (!password) return "";
    return password.length < 6
      ? "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
      : "รหัสผ่านครบถ้วน";
  };

  const handleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!username || password.length < 6) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, username, password);
      alert("เข้าสู่ระบบสำเร็จ");
      history.push("/home");
    } catch (error: any) {
      console.error("Login error:", error);
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      } else if (error.code === "auth/invalid-email") {
        alert("รูปแบบอีเมลไม่ถูกต้อง");
      } else if (error.code === "auth/too-many-requests") {
        alert("ลองใหม่ภายหลัง");
      } else {
        alert("เข้าสู่ระบบไม่สำเร็จ");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      alert("เข้าสู่ระบบด้วย Google สำเร็จ");
      history.push("/home");
    } catch (error: any) {
      console.error("Google login error:", error);
      if (error.code === "auth/popup-closed-by-user") {
        alert("คุณปิดหน้าต่างเข้าสู่ระบบ Google");
      } else {
        alert("เข้าสู่ระบบด้วย Google ไม่สำเร็จ");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="login-page-content" fullscreen>
        <div className="login-container">
          <div className="login-wrapper">
            <div className="login-left">
              <h1 className="title">
                สวัสดี
                <br />
                ยินดีต้อนรับ
              </h1>
              <p className="subtitle">เริ่มต้นใช้งานระบบของคุณ</p>

              <button
                className="btn-link-register"
                onClick={() => history.push("/register")}
              >
                ลงทะเบียน
              </button>
            </div>

            <div className="login-right">
              <h2 className="login-header">เข้าสู่ระบบ</h2>

              <div className="input-box">
                <IonIcon icon={personOutline} className="input-icon-left" />
                <input
                  type="email"
                  className="custom-native-input"
                  placeholder="อีเมล"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="input-box">
                <IonIcon icon={lockClosedOutline} className="input-icon-left" />
                <input
                  type="password"
                  className="custom-native-input"
                  placeholder="รหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span
                  className="error-text"
                  style={{
                    color: password.length < 6 ? "#D64545" : "#59AC77",
                  }}
                >
                  {getPasswordHint()}
                </span>
              </div>

              <button
                type="button"
                className="forgot"
                onClick={() => history.push("/forgot-password")}
              >
                ลืมรหัสผ่าน ?
              </button>

              <button
                className="btn-link-login"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>

              <div className="divider">
                <span className="line" />
                <span className="divider-text">เข้าสู่ระบบด้วยวิธีอื่น</span>
                <span className="line" />
              </div>

              <div className="social-row">
                <div className="social-icon">
                  <IonIcon icon={logoFacebook} />
                </div>
                <div className="social-icon" onClick={handleGoogleLogin}>
                  <IonIcon icon={logoGoogle} />
                </div>
                <div className="social-icon">
                  <IonIcon icon={logoApple} />
                </div>
              </div>

              <div className="mobile-register-link">
                ยังไม่มีบัญชี?{" "}
                <button
                  style={{
                    cursor: "pointer",
                    color: "#59AC77",
                    fontWeight: 500,
                    background: "none",
                    border: "none",
                    padding: 0,
                    font: "inherit",
                  }}
                  onClick={() => history.push("/register")}
                >
                  ลงทะเบียน
                </button>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;