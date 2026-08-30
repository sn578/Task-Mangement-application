import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });
const socket = io('http://localhost:5000');

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (token) {
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchTasks();
    }

    socket.on('taskUpdated', (data) => {
      if (data.action === 'create') {
        setTasks(prev => [...prev, data.task]);
      } else if (data.action === 'update') {
        setTasks(prev => prev.map(t => t._id === data.task._id ? data.task : t));
      } else if (data.action === 'delete') {
        setTasks(prev => prev.filter(t => t._id !== data.id));
      }
    });

    return () => socket.off('taskUpdated');
  }, [token]);

  const fetchTasks = async () => {
    try {
      const res = await API.get('/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isRegistering ? '/auth/register' : '/auth/login';
      const res = await API.post(endpoint, { username, password });
      if (isRegistering) {
        alert('Registered successfully! Please login.');
        setIsRegistering(false);
      } else {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Authentication error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setTasks([]);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(`/tasks/${editingId}`, { title, description, dueDate });
        setEditingId(null);
      } else {
        await API.post('/tasks', { title, description, dueDate });
      }
      setTitle('');
      setDescription('');
      setDueDate('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (task) => {
    setEditingId(task._id);
    setTitle(task.title);
    setDescription(task.description || '');
    setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
  };

  const deleteTask = async (id) => {
    try {
      await API.delete(`/tasks/${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition">{isRegistering ? 'Sign Up' : 'Sign In'}</button>
          </form>
          <p onClick={() => setIsRegistering(!isRegistering)} className="text-blue-600 text-center mt-4 cursor-pointer text-sm hover:underline">
            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm mb-6">
          <h1 className="text-xl font-bold text-gray-800">Task Management Application</h1>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition">Logout</button>
        </header>

        <form onSubmit={handleSaveTask} className="bg-white p-6 rounded-xl shadow-sm mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">{editingId ? 'Edit Task' : 'Add New Task'}</h2>
          <input type="text" placeholder="Task Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          <input type="text" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition">{editingId ? 'Update Task' : 'Create Task'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setTitle(''); setDescription(''); setDueDate(''); }} className="bg-gray-300 text-gray-700 px-4 rounded-lg font-semibold hover:bg-gray-400 transition">Cancel</button>}
          </div>
        </form>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">Your Tasks</h2>
          {tasks.length === 0 ? (
            <p className="text-gray-500 bg-white p-6 rounded-xl text-center shadow-sm">No tasks found. Create one above!</p>
          ) : (
            tasks.map(task => (
              <div key={task._id} className="bg-white p-5 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{task.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">Status: {task.status}</span>
                    {task.dueDate && <span className="bg-gray-100 px-2 py-1 rounded">Due: {task.dueDate.split('T')[0]}</span>}
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => handleEdit(task)} className="flex-1 md:flex-none bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-amber-600 transition">Edit</button>
                  <button onClick={() => deleteTask(task._id)} className="flex-1 md:flex-none bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-600 transition">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}