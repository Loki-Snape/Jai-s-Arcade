import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axiosClient from '../api/axiosClient';

const initialForm = { username: '', email: '', password: '' };

export default function Auth() {
  const [form, setForm] = useState(initialForm);
  const [mode, setMode] = useState('login');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const onChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      const payload = mode === 'register' ? form : { email: form.email, password: form.password };
      const response = await axiosClient.post(`/api/auth/${mode}`, payload);
      window.localStorage.setItem('arcade_token', response.data.token);
      setMessage('Authenticated successfully. Redirecting to lobby...');
      navigate('/');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Authentication failed');
    }
  };

  return (
    <main className="page-shell auth-shell">
      <Navbar />
      <section className="auth-card">
        <div className="section-heading">
          <h1>{mode === 'login' ? 'Welcome back' : 'Create your arcade profile'}</h1>
          <button type="button" className="text-button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            Switch to {mode === 'login' ? 'register' : 'login'}
          </button>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          {mode === 'register' && (
            <label>
              Username
              <input name="username" value={form.username} onChange={onChange} autoComplete="username" />
            </label>
          )}
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={onChange} autoComplete="email" />
          </label>
          <label>
            Password
            <input name="password" type="password" value={form.password} onChange={onChange} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </label>
          <button type="submit" className="play-button">
            {mode === 'login' ? 'Login' : 'Register'}
          </button>
          {message && <p className="form-message">{message}</p>}
        </form>
      </section>
    </main>
  );
}
