import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../firebase'

export default function LoginScreen() {
  const provider = new GoogleAuthProvider()

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error('サインインエラー:', error.message)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-container">
        <h1>KanriHack</h1>
        <p>面談記録アプリ</p>
        <button className="google-signin-button" onClick={handleGoogleSignIn}>
          Google でサインイン
        </button>
      </div>
    </div>
  )
}
