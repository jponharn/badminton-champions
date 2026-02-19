import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Plus, Trophy, Calendar, Trash2, Award, Clock, 
  Filter, ChevronRight, Upload, Image as ImageIcon, X, Loader2, MoreVertical, Edit2, Save
} from 'lucide-react';

// Firebase Configuration จาก Environment
const firebaseConfig = {
    apiKey: "AIzaSyDHFBJ-mFOq9eq5YZ6kTkdqPUOTFsScarE",
    authDomain: "badminton-hall-of-fame.firebaseapp.com",
    projectId: "badminton-hall-of-fame",
    storageBucket: "badminton-hall-of-fame.firebasestorage.app",
    messagingSenderId: "602626986182",
    appId: "1:602626986182:web:130229150f2e1ad2a847c7",
    measurementId: "G-J4CS6KY933"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'badminton-hall-of-fame';

const App = () => {
  const [champions, setChampions] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(null); // เก็บ ID รายการที่กำลังแก้ไข
  const [selectedYear, setSelectedYear] = useState('All');
  const [showMainActions, setShowMainActions] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null); // สำหรับจัดการเมนูย่อยใน History
  
  const [formData, setFormData] = useState({
    tournament: '',
    date: '',
    winner: '',
    image: '',
    category: 'Super 500'
  });
  
  const fileInputRef = useRef(null);

  // 1. Authentication Setup
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Fetching (Firestore)
  useEffect(() => {
    if (!user) return;

    const championsRef = collection(db, 'artifacts', appId, 'public', 'data', 'champions');
    
    const unsubscribe = onSnapshot(championsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChampions(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Logic การจัดการข้อมูล
  const handleFileChange = (e, isEditMode = false) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 800000) {
        alert("ไฟล์รูปภาพใหญ่เกินไป โปรดเลือกรูปที่มีขนาดไม่เกิน 800KB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEditMode) {
          setFormData(prev => ({ ...prev, image: reader.result }));
        } else {
          setFormData(prev => ({ ...prev, image: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !formData.tournament || !formData.date || !formData.winner) return;

    try {
      const championsRef = collection(db, 'artifacts', appId, 'public', 'data', 'champions');
      if (isEditing) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'champions', isEditing), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        setIsEditing(null);
      } else {
        await addDoc(championsRef, {
          ...formData,
          createdAt: serverTimestamp(),
          createdBy: user.uid
        });
      }

      setFormData({ tournament: '', date: '', winner: '', image: '', category: 'Super 500' });
      setIsAdding(false);
      setShowMainActions(false);
    } catch (error) {
      console.error("Error processing document: ", error);
    }
  };

  const startEditing = (item) => {
    setFormData({
      tournament: item.tournament,
      date: item.date,
      winner: item.winner,
      image: item.image,
      category: item.category
    });
    setIsEditing(item.id);
    setIsAdding(true);
  };

  const deleteChampion = async (id) => {
    if (!window.confirm("คุณต้องการลบข้อมูลแชมป์รายการนี้ใช่หรือไม่?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'champions', id));
      setOpenMenuId(null);
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  // Memoized Calculations
  const sortedChampions = useMemo(() => {
    return [...champions].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [champions]);

  const latestChampion = sortedChampions[0];

  const availableYears = useMemo(() => {
    const years = champions.map(c => new Date(c.date).getFullYear().toString());
    return ['All', ...new Set(years)].sort((a, b) => b - a);
  }, [champions]);

  const filteredHistory = useMemo(() => {
    let history = sortedChampions.slice(1);
    if (selectedYear !== 'All') {
      history = history.filter(c => new Date(c.date).getFullYear().toString() === selectedYear);
    }
    return history;
  }, [sortedChampions, selectedYear]);

  const groupedByYear = useMemo(() => {
    return filteredHistory.reduce((groups, item) => {
      const year = new Date(item.date).getFullYear();
      if (!groups[year]) groups[year] = [];
      groups[year].push(item);
      return groups;
    }, {});
  }, [filteredHistory]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-bold">กำลังเชื่อมต่อฐานข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Compact Header */}
      <header className="bg-indigo-950 text-white py-4 shadow-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h1 className="text-xl font-black tracking-tight uppercase">Badminton Hall of Fame</h1>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowMainActions(!showMainActions)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <MoreVertical className="w-6 h-6" />
            </button>
            
            {showMainActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <button 
                  onClick={() => {
                    setIsEditing(null);
                    setFormData({ tournament: '', date: '', winner: '', image: '', category: 'Super 500' });
                    setIsAdding(true);
                  }}
                  className="w-full text-left px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> เพิ่มแชมป์ใหม่
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full text-left px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-50"
                >
                  <Clock className="w-4 h-4" /> รีเฟรชข้อมูล
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {/* Modal Form for Add/Edit */}
        {isAdding && (
          <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl p-6 overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-indigo-950 flex items-center gap-2">
                  <Award className="text-indigo-600" /> {isEditing ? 'แก้ไขข้อมูลแชมป์' : 'บันทึกทำเนียบแชมป์'}
                </h2>
                <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">ชื่อรายการ</label>
                  <input 
                    required name="tournament" value={formData.tournament} onChange={(e) => setFormData({...formData, tournament: e.target.value})}
                    className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold text-sm" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">วันที่ชนะเลิศ</label>
                  <input 
                    required type="date" name="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold text-sm" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">ชื่อแชมป์ / ทีม</label>
                  <input 
                    required name="winner" value={formData.winner} onChange={(e) => setFormData({...formData, winner: e.target.value})}
                    className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold text-sm" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">ระดับรายการ</label>
                  <select 
                    name="category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold text-sm appearance-none bg-white"
                  >
                    <option>Finals</option>
                    <option>Super 1000</option>
                    <option>Super 750</option>
                    <option>Super 500</option>
                    <option>Super 300</option>
                    <option>World Championships</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">รูปภาพแชมป์</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50 group">
                    {formData.image ? (
                      <div className="relative inline-block">
                        <img src={formData.image} alt="Preview" className="h-40 w-auto rounded-xl shadow-lg" />
                        <button 
                          type="button" onClick={() => setFormData({...formData, image: ''})}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <Upload className="mx-auto w-10 h-10 text-indigo-200 mb-2" />
                        <span className="text-indigo-600 font-bold text-sm">อัปโหลดรูปภาพ</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e)} />
                      </label>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 mt-4">
                  <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" />
                    {isEditing ? 'บันทึกการแก้ไข' : 'ยืนยันการเพิ่มแชมป์'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Hero: Latest Glory with Edit Action */}
        {latestChampion && (
          <section className="mb-12">
            <h2 className="text-xs font-black text-indigo-400 tracking-[0.2em] uppercase mb-4 flex items-center gap-3">
              <span className="w-8 h-[2px] bg-indigo-400" />
              Latest Glory
            </h2>
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-white group relative">
              <div className="md:flex">
                <div className="md:w-1/2 relative h-64 md:h-auto overflow-hidden">
                  <img 
                    src={latestChampion.image || "https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?q=80&w=1000&auto=format&fit=crop"} 
                    alt={latestChampion.winner}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/10 to-transparent" />
                </div>
                <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-white relative">
                  <button 
                    onClick={() => startEditing(latestChampion)}
                    className="absolute top-6 right-6 p-2 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-full transition-all"
                    title="แก้ไขข้อมูล"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  
                  <span className="bg-yellow-400 text-indigo-950 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase w-fit mb-3">
                    {latestChampion.category}
                  </span>
                  <h3 className="text-3xl md:text-4xl font-black text-indigo-950 leading-tight mb-4 pr-10">
                    {latestChampion.winner}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-600">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="font-bold text-base">{latestChampion.tournament}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-sm">
                      <Calendar className="w-4 h-4 text-indigo-300" />
                      <span className="font-bold">{new Date(latestChampion.date).toLocaleDateString('th-TH', { dateStyle: 'long' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Timeline Section */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h2 className="text-xl font-black text-indigo-950 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-300" />
              HISTORY
            </h2>
            <div className="flex flex-wrap gap-1.5 p-1 bg-white rounded-xl shadow-sm border border-slate-100">
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                    selectedYear === year 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {year === 'All' ? 'ALL' : year}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-12">
            {Object.keys(groupedByYear).sort((a, b) => b - a).map(year => (
              <div key={year} className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 rounded-full" />
                
                <div className="sticky top-20 z-20 mb-6 ml-1">
                  <span className="bg-white text-indigo-950 px-5 py-1.5 rounded-full font-black text-lg shadow-sm border border-slate-200 flex items-center w-fit gap-2">
                    {year}
                  </span>
                </div>

                <div className="space-y-6 ml-10">
                  {groupedByYear[year].map((item) => (
                    <div key={item.id} className="relative group max-w-2xl">
                      <div className="absolute -left-[32px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-indigo-600 z-10" />
                      
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 hover:shadow-md transition-all flex flex-col sm:flex-row gap-5 items-center relative">
                        {/* More Menu for History Item */}
                        <div className="absolute top-3 right-3">
                          <button 
                            onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                            className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          
                          {openMenuId === item.id && (
                            <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-30">
                              <button 
                                onClick={() => { startEditing(item); setOpenMenuId(null); }}
                                className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> แก้ไข
                              </button>
                              <button 
                                onClick={() => deleteChampion(item.id)}
                                className="w-full text-left px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2 border-t border-slate-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> ลบข้อมูล
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="w-full sm:w-32 h-48 flex-shrink-0 bg-slate-50 rounded-xl overflow-hidden">
                          <img 
                            src={item.image || "https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?q=80&w=1000&auto=format&fit=crop"} 
                            className="w-full h-full object-cover"
                            alt={item.winner}
                          />
                        </div>
                        <div className="flex-1 w-full text-center sm:text-left pr-8">
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{item.category}</span>
                          <h4 className="text-lg font-black text-indigo-950 mb-0.5">{item.winner}</h4>
                          <p className="text-slate-500 font-bold text-xs mb-1.5">{item.tournament}</p>
                          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-slate-400 text-[10px] font-bold">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.date).toLocaleDateString('th-TH')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-24 py-12 bg-slate-50 text-center border-t border-slate-200">
        <p className="text-slate-400 font-black tracking-widest uppercase text-[10px] mb-2">Badminton Hall of Fame</p>
        <p className="text-slate-300 text-[9px] font-bold">Manage your Champions with Ease</p>
      </footer>
    </div>
  );
};

export default App;