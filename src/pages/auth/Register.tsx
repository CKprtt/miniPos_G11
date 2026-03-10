import React, { useState } from "react";
import { IonPage, IonContent, IonIcon, IonLoading } from "@ionic/react";
import {
  personOutline,
  lockClosedOutline,
  mailOutline,
  callOutline,
  locationOutline,
  logoFacebook,
  logoGoogle,
  logoApple,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { registerUser } from "../../firebase/authService";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "../../firebase/config";
import "./Register.css";

const Register: React.FC = () => {
  const history = useHistory();

  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const getPasswordHint = () => {
    if (!password) return "";
    return password.length < 6
      ? "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
      : "รหัสผ่านปลอดภัย";
  };

  const handleRegister = async () => {
    if (!shopName || !email || !password || !phone || !address) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    if (password.length < 6) {
      alert("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    try {
      setLoading(true);
      await registerUser({ shopName, email, password, phone, address });
      await signOut(auth);
      alert("ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ");

      // สำคัญ: ห้ามใช้ window.location.replace("/login")
      history.replace("/login");
    } catch (error: any) {
      console.error("Register error:", error);
      alert("สมัครสมาชิกไม่สำเร็จ: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      await signInWithPopup(auth, provider);
      history.push("/home");
    } catch (error: any) {
      console.error("Google Login Error:", error);
      alert("เข้าสู่ระบบด้วย Google ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonLoading isOpen={loading} message={"กำลังบันทึกข้อมูล..."} />
      <IonContent className="login-page-content" fullscreen>
        <div className="login-container">
          <div className="login-wrapper">
            <div className="login-right">
              <div className="login-form-inner">
                <h2 className="login-header">ลงทะเบียน</h2>

                <div className="input-box">
                  <IonIcon icon={personOutline} className="input-icon-left" />
                  <input
                    className="custom-native-input"
                    placeholder="ชื่อร้าน"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                  />
                </div>

                <div className="input-box">
                  <IonIcon icon={mailOutline} className="input-icon-left" />
                  <input
                    type="email"
                    className="custom-native-input"
                    placeholder="อีเมล"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="input-box">
                  <IonIcon icon={lockClosedOutline} className="input-icon-left" />
                  <input
                    type="password"
                    className="custom-native-input"
                    placeholder="รหัสผ่าน"
                    value={password}
                    maxLength={20}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <span
                  className="error-text"
                  style={{
                    color:
                      password.length > 0 && password.length < 6
                        ? "#d93025"
                        : "#2e7d32",
                  }}
                >
                  {getPasswordHint()}
                </span>

                <div className="input-box">
                  <IonIcon icon={callOutline} className="input-icon-left" />
                  <input
                    className="custom-native-input"
                    placeholder="เบอร์โทร"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="input-box">
                  <IonIcon icon={locationOutline} className="input-icon-left" />
                  <input
                    className="custom-native-input"
                    placeholder="ที่อยู่"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <button
                  className="btn-link-login"
                  onClick={handleRegister}
                  disabled={loading}
                >
                  {loading ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
                </button>

                <div className="divider">
                  <span className="line" />
                  <span className="divider-text">ลงทะเบียนด้วยวิธีอื่น</span>
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
                  มีบัญชีแล้ว?{" "}
                  <span
                    style={{ cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => history.push("/login")}
                  >
                    เข้าสู่ระบบ
                  </span>
                </div>
              </div>
            </div>

            <div className="login-left">
              <h1 className="title">
                สวัสดี
                <br />
                ยินดีต้อนรับ
              </h1>
              <p className="subtitle">มาเป็นส่วนหนึ่งกับเรา</p>
              <span
                className="btn-link-register"
                onClick={() => history.push("/login")}
                style={{ cursor: "pointer" }}
              >
                เข้าสู่ระบบ
              </span>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;