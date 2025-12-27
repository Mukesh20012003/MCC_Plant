// src/components/LoginPage.jsx
import LoginForm from "./LoginForm";

function LoginPage({ onLoginSuccess }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <LoginForm onLoginSuccess={onLoginSuccess} />
    </div>
  );
}

export default LoginPage;
