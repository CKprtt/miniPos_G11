import React, { useState } from 'react';
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { mailOutline, arrowBackOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { resetPassword } from "../../firebase/authService";
import "./Login.css"; // เรียกใช้ CSS ตัวเดิม

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const handleReset = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!email) {
      alert("กรุณากรอกอีเมลของคุณ");
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email);
      alert(`ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านไปที่ ${email} แล้ว`);
      history.push("/login");
    } catch (error: any) {
      console.error("Reset password error:", error);

      if (error.code === "auth/invalid-email") {
        alert("รูปแบบอีเมลไม่ถูกต้อง");
      } else if (error.code === "auth/user-not-found") {
        alert("ไม่พบบัญชีผู้ใช้นี้");
      } else {
        alert("ส่งลิงก์รีเซ็ตรหัสผ่านไม่สำเร็จ");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="login-page-content">
        <div className="login-container">
          <div className="login-wrapper">
            
            {/* ฝั่งซ้าย (สีเขียว) - จะซ่อนเมื่อเป็นมือถือ */}
            <div className="login-left">
              <h1 className="title">จำรหัสผ่าน<br />ได้แล้ว ?</h1>
              <p className="subtitle">กลับไปเข้าสู่ระบบเพื่อใช้งานต่อ</p>
              <a href="/login" className="btn-link-register">
                 เข้าสู่ระบบ
              </a>
            </div>

            {/* ฝั่งขวา (ฟอร์ม) */}
            <div className="login-right">
              <h2 className="login-header">ลืมรหัสผ่าน</h2>
              <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px', fontSize: '14px' }}>
                กรุณากรอกอีเมลที่ใช้ลงทะเบียน<br/>เราจะส่งรหัสยืนยันไปให้คุณ
              </p>

              <div className="input-box">
                <IonIcon icon={mailOutline} className="input-icon-left" />
                <input 
                  type="email" 
                  className="custom-native-input" 
                  placeholder="อีเมลของคุณ"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                className="btn-link-login"
                onClick={handleReset}
                style={{ marginTop: '20px' }}
                disabled={loading}
              >
                {loading ? "กำลังส่ง..." : "ส่งรหัสยืนยัน"}
              </button>
              
              {/* ลิงก์กลับหน้า Login สำหรับมือถือ (เพราะฝั่งซ้ายจะถูกซ่อน) */}
              <div className="mobile-register-link">
                  <a href="/login">
                    <IonIcon icon={arrowBackOutline} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                    กลับสู่หน้าเข้าสู่ระบบ
                  </a>
              </div>
            </div>

          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;