import React, { useState, useEffect } from "react";
import { auth, db, googleProvider, appleProvider } from "./firebase";
import { signInWithPopup, signOut, updateProfile  } from "firebase/auth";
import {
  collection, addDoc, getDocs, doc, updateDoc,
  arrayUnion, arrayRemove, query, orderBy, getDoc, setDoc, deleteDoc
} from "firebase/firestore";
import html2canvas from "html2canvas";
import "./index.css";
import "./App.css";

const ADMIN_EMAILS = (process.env.REACT_APP_ADMIN_EMAILS || "").split(",").map(e => e.trim());

function StarRating({ value, onChange, size = 28, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1,2,3,4,5].map(s => (
        <span
          key={s}
          onClick={() => !readonly && onChange && onChange(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{
            fontSize: size,
            cursor: readonly ? "default" : "pointer",
            color: s <= (hover || value) ? "#f5a623" : "#333",
            transition: "color 0.15s",
            lineHeight: 1,
          }}
        >★</span>
      ))}
    </div>
  );
}

function ShareCard({ movie, userRating, userName, onClose }) {
  const cardRef = React.useRef();
  const [sharing, setSharing] = useState(false);

  const downloadCard = async () => {
    setSharing(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: "#0d0d0f" });
      const link = document.createElement("a");
      link.download = `${movie.title}-rating.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch(e) { console.error(e); }
    setSharing(false);
  };

  const shareWhatsApp = async () => {
    setSharing(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: "#0d0d0f" });
      canvas.toBlob(async (blob) => {
        if (navigator.share && navigator.canShare({ files: [new File([blob], "rating.png", { type: "image/png" })] })) {
          await navigator.share({
            title: `I rated ${movie.title}`,
            text: `I gave ${movie.title} ${userRating}/5 stars! Check it out on CineRate.`,
            files: [new File([blob], "rating.png", { type: "image/png" })]
          });
        } else {
          const text = `I gave ${movie.title} ${"★".repeat(userRating)}${"☆".repeat(5-userRating)} on CineRate!`;
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
        }
        setSharing(false);
      }, "image/png");
    } catch(e) { setSharing(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Share Your Rating</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

       <div 
        ref={cardRef} 
        style={{
          width: "420px",
          backgroundColor: "#121212",
          borderRadius: "16px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#ffffff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          boxSizing: "border-box"
        }}
      >
        {/* Main Horizontal Section */}
        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
          
          {/* Left Side: Clear Movie Poster */}
          {movie.posterUrl && (
            <img 
              src={movie.posterUrl} 
              alt={movie.title} 
              style={{
                width: "140px",
                height: "200px",
                borderRadius: "8px",
                objectFit: "cover",
                boxShadow: "0 4px 15px rgba(0,0,0,0.4)"
              }}
            />
          )}

          {/* Right Side: Movie Details */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingTop: "4px" }}>
            <h2 style={{ fontSize: "24px", margin: "0 0 4px 0", fontWeight: "700", lineHeight: "1.2" }}>
              {movie.title}
            </h2>
            <p style={{ fontSize: "14px", color: "#888888", margin: "0 0 20px 0" }}>
              Movie • {movie.year || "2026"}
            </p>

            {/* Rating Stars/Badge (Yellow Button) */}
            <div style={{
              backgroundColor: "#ffb300",
              color: "#000000",
              padding: "8px 16px",
              borderRadius: "20px",
              fontWeight: "700",
              fontSize: "14px",
              letterSpacing: "1px",
              textAlign: "center",
              display: "inline-block",
              width: "fit-content",
              marginBottom: "12px"
            }}>
              {"★".repeat(userRating)}{"☆".repeat(5 - userRating)}
            </div>
            
            {/* Small Date Divider Line */}
            <div style={{ display: "flex", alignItems: "center", width: "100%", margin: "8px 0" }}>
              <div style={{ height: "1px", backgroundColor: "#333333", flex: 1 }}></div>
              <span style={{ fontSize: "11px", color: "#666666", padding: "0 8px" }}>12th Jul 2026</span>
              <div style={{ height: "1px", backgroundColor: "#333333", flex: 1 }}></div>
            </div>
          </div>
        </div>

        {/* Bottom Section: User Profile & Branding */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#222",
              border: "1px solid #333"
            }}></div>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#e0e0e0" }}>
              @{userName || "Nikhil125"}
            </span>
          </div>
          
          <div style={{ fontWeight: "800", fontSize: "15px", letterSpacing: "1px", color: "#ffffff" }}>
            🎬 CINERATE
          </div>
        </div>
      </div>

        <div className="share-actions">
          <button className="share-btn wa" onClick={shareWhatsApp} disabled={sharing}>
            <span>📱</span> WhatsApp / Instagram
          </button>
          <button className="share-btn dl" onClick={downloadCard} disabled={sharing}>
            <span>⬇</span> Download Image
          </button>
        </div>
        <p className="share-hint">Download the image and post it as your Instagram or WhatsApp Status!</p>
      </div>
    </div>
  );
}

function MovieCard({ movie, user, onRate, onOpen }) {
  const avgRating = movie.ratings && movie.ratings.length > 0
    ? (movie.ratings.reduce((a, b) => a + b.score, 0) / movie.ratings.length).toFixed(1)
    : null;
  const userRating = user && movie.ratings?.find(r => r.uid === user.uid)?.score;

  return (
    <div className="movie-card" onClick={() => onOpen(movie)}>
      <div className="movie-poster-wrap">
        {movie.posterUrl
          ? <img src={movie.posterUrl} alt={movie.title} className="movie-poster" />
          : <div className="movie-poster-placeholder"><span>{movie.title[0]}</span></div>
        }
        {avgRating && <div className="avg-badge">★ {avgRating}</div>}
      </div>
      <div className="movie-info">
        <div className="movie-meta">{movie.year} · <span className="genre-tag">{movie.genre}</span></div>
        <h3 className="movie-title">{movie.title}</h3>
        <div className="movie-director">dir. {movie.director}</div>
        {user && (
          <div className="card-rating" onClick={e => { e.stopPropagation(); }}>
            <StarRating value={userRating || 0} onChange={(s) => onRate(movie, s)} size={20} />
            {userRating && <span className="your-rating-label">Your rating</span>}
          </div>
        )}
        {!user && <div className="login-prompt-sm">Sign in to rate</div>}
      </div>
    </div>
  );
}

function MovieModal({ movie, user, onClose, onRate, onShare }) {
  const [review, setReview] = useState("");
  const [tempRating, setTempRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const avgRating = movie.ratings && movie.ratings.length > 0
    ? (movie.ratings.reduce((a, b) => a + b.score, 0) / movie.ratings.length).toFixed(1)
    : null;
  const userRating = user && movie.ratings?.find(r => r.uid === user.uid)?.score;

  const handleSubmit = async () => {
    if (!tempRating) return;
    setSubmitting(true);
    await onRate(movie, tempRating, review);
    setSubmitting(false);
    setSubmitted(true);
    setReview("");
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box large" onClick={e => e.stopPropagation()}>
        <button className="icon-btn close-modal" onClick={onClose}>✕</button>
        <div className="modal-movie-layout">
          <div className="modal-poster-col">
            {movie.posterUrl
              ? <img src={movie.posterUrl} alt={movie.title} className="modal-poster" />
              : <div className="modal-poster-placeholder">{movie.title[0]}</div>
            }
            {avgRating && (
              <div className="modal-avg">
                <span className="modal-avg-num">{avgRating}</span>
                <span className="modal-avg-label">avg · {movie.ratings.length} ratings</span>
              </div>
            )}
          </div>
          <div className="modal-info-col">
            <div className="modal-meta">{movie.year} · {movie.genre} · {movie.duration}</div>
            <h2 className="modal-title">{movie.title}</h2>
            <div className="modal-director">Directed by <strong>{movie.director}</strong></div>
            <p className="modal-synopsis">{movie.synopsis}</p>

            {movie.cast && <div className="modal-cast">Cast: <span>{movie.cast}</span></div>}

            {user && (
              <div className="modal-rate-section">
                <h4>Your Rating</h4>
                <StarRating value={tempRating || userRating || 0} onChange={setTempRating} size={32} />
                <textarea
                  className="review-input"
                  placeholder="Write a short review (optional)..."
                  value={review}
                  onChange={e => setReview(e.target.value)}
                  rows={3}
                />
                <div className="modal-actions">
                  <button className="btn-primary" onClick={handleSubmit} disabled={!tempRating || submitting}>
                    {submitted ? "✓ Saved!" : submitting ? "Saving..." : userRating ? "Update Rating" : "Submit Rating"}
                  </button>
                  {userRating && (
                    <button className="btn-share" onClick={() => onShare(movie, userRating)}>
                      Share Rating 🎬
                    </button>
                  )}
                </div>
              </div>
            )}
            {!user && <div className="sign-in-prompt">Sign in to rate and review this film.</div>}

            {movie.ratings && movie.ratings.length > 0 && (
              <div className="reviews-section">
                <h4>Recent Reviews</h4>
                {movie.ratings.filter(r => r.review).slice(0, 4).map((r, i) => (
                  <div key={i} className="review-item">
                    <div className="review-header">
                      <span className="review-user">{r.userName}</span>
                      <span className="review-stars">{"★".repeat(r.score)}</span>
                    </div>
                    {r.review && <p className="review-text">{r.review}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPanel({ onAdd, onClose }) {
  const [form, setForm] = useState({ title: "", year: "", genre: "", director: "", synopsis: "", posterUrl: "", duration: "", cast: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title || !form.year || !form.genre) return;
    setSaving(true);
    await onAdd({ ...form, ratings: [], createdAt: Date.now() });
    setSaving(false);
    setSaved(true);
    setForm({ title: "", year: "", genre: "", director: "", synopsis: "", posterUrl: "", duration: "", cast: "" });
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Movie</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="admin-form">
          {[
            ["Title *", "title", "text"],
            ["Year *", "year", "text"],
            ["Genre *", "genre", "text"],
            ["Director", "director", "text"],
            ["Duration", "duration", "text"],
            ["Cast", "cast", "text"],
            ["Poster URL", "posterUrl", "url"],
          ].map(([label, key, type]) => (
            <label key={key} className="form-field">
              <span>{label}</span>
              <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={label} />
            </label>
          ))}
          <label className="form-field">
            <span>Synopsis</span>
            <textarea value={form.synopsis} onChange={e => set("synopsis", e.target.value)} rows={3} placeholder="Movie synopsis..." />
          </label>
          <button className="btn-primary full" onClick={handleSave} disabled={saving || !form.title}>
            {saved ? "✓ Added!" : saving ? "Saving..." : "Add Movie"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMovie, setOpenMovie] = useState(null);
  const [shareData, setShareData] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return unsub;
  }, []);

 const fetchMovies = async () => {
  try {
    const snap = await getDocs(collection(db, "movies"));
    console.log("DATABASE SE AAYA DATA:", snap.docs.map(d => d.data()));
    setMovies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (error) {
    console.error("FIREBASE ERROR DETAIL:", error);
  } finally {
    setLoading(false);
  }
};
  useEffect(() => { fetchMovies(); }, []);

  const signIn = async (provider) => {
    try { await signInWithPopup(auth, provider); }
    catch(e) { console.error(e); }
  };
 const handleUpdateProfile = async (newName, newPhotoUrl) => {
  const currentUser = auth.currentUser;
  
  // Agar koi user login nahi hai, toh yeh aage nahi badhega
  if (!currentUser) {
    alert("Pehle sign in kijiye!");
    return;
  }

  try {
    // 1. Firebase Server par user ka naya name aur photo save karega
    await updateProfile(currentUser, {
      displayName: newName,
      photoURL: newPhotoUrl
    });

    // 2. Local state (setUser) ko update karega taaki screen par turant badlaav dikhe
    if (typeof setUser === "function") {
      setUser({
        ...currentUser,
        displayName: newName,
        photoURL: newPhotoUrl,
        uid: currentUser.uid,
        email: currentUser.email
      });
    }

    alert("Profile successfully update ho gayi hai! 🎉");
  } catch (error) {
    console.error("Profile update error:", error);
    alert("Profile update nahi ho payi, console check karein.");
  }
};


  const handleRate = async (movie, score, reviewText = "") => {
    if (!user) return;
    const movieRef = doc(db, "movies", movie.id);
    const existingIdx = movie.ratings?.findIndex(r => r.uid === user.uid);
    let newRatings = [...(movie.ratings || [])];
    const entry = { uid: user.uid, userName: user.displayName || user.email, score, review: reviewText, at: Date.now() };
    if (existingIdx >= 0) newRatings[existingIdx] = { ...newRatings[existingIdx], ...entry };
    else newRatings.push(entry);
    await updateDoc(movieRef, { ratings: newRatings });
    setMovies(ms => ms.map(m => m.id === movie.id ? { ...m, ratings: newRatings } : m));
    if (openMovie?.id === movie.id) setOpenMovie(m => ({ ...m, ratings: newRatings }));
  };

  const handleAddMovie = async (data) => {
    const ref = await addDoc(collection(db, "movies"), data);
    setMovies(ms => [{ id: ref.id, ...data }, ...ms]);
  };

  const genres = ["All", ...Array.from(new Set(movies.map(m => m.genre).filter(Boolean)))];
  const filtered = movies.filter(m => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) || m.director?.toLowerCase().includes(search.toLowerCase());
    const matchGenre = filter === "All" || m.genre === filter;
    return matchSearch && matchGenre;
  });

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">CINE<span>RATE</span></div>
          <div className="header-right">
            {user ? (
              <div className="user-area">
                {isAdmin && <button className="btn-admin" onClick={() => setShowAdmin(true)}>+ Add Movie</button>}
                <img src={user.photoURL || ""} alt="" className="avatar" onError={e => e.target.style.display="none"} />
              <button 
  className="btn-admin" 
  style={{ marginRight: "10px", padding: "6px 12px", cursor: "pointer" }}
  onClick={() => {
    const newName = prompt("Apna naya naam likhiye:", user?.displayName || "");
    const newPhoto = prompt("Apni nayi photo ka web URL daliye:", user?.photoURL || "");
    
    if (newName !== null || newPhoto !== null) {
      handleUpdateProfile(
        newName || user?.displayName || "User", 
        newPhoto || user?.photoURL || ""
      );
    }
  }}
>
  ✏️ Edit Profile
</button>
                <span className="user-name">{user.displayName?.split(" ")[0]}</span>
                <button className="btn-signout" onClick={() => signOut(auth)}>Sign Out</button>
              </div>
            ) : (
              <div className="auth-btns">
                <button className="btn-google" onClick={() => signIn(googleProvider)}>
                  <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.175 0 7.548 0 9s.348 2.825.957 4.038l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
                  Google
                </button>
                <button className="btn-apple" onClick={() => signIn(appleProvider)}>
                  <svg width="17" height="18" viewBox="0 0 814 1000"><path fill="white" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 376.6 0 289.2 0 186.3c0-163.7 107-250.3 211.4-250.3 79.4 0 144.5 52.4 184.5 52.4 38.2 0 114.4-55.4 203.2-55.4 32.5 0 134.2 3.2 208 99.9zm-251.1-185.8c38.2-46.2 64.8-110.1 64.8-173.9 0-8.9-.6-17.8-1.9-25.4-61 2.6-133.6 41.5-177.1 94.6-34.7 40.8-66.5 104.7-66.5 170.1 0 9.6 1.9 19.2 2.6 22.4 3.9.6 10.3 1.3 16.5 1.3 55.7 0 123.8-38.2 161.6-88.1z"/></svg>
                  Apple
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">TRACK. RATE.<br/><span>SHARE.</span></h1>
          <p className="hero-sub">Rate movies you love. Share your take with the world.</p>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search movies or directors..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="filter-bar">
          {genres.map(g => (
            <button key={g} className={`filter-pill ${filter === g ? "active" : ""}`} onClick={() => setFilter(g)}>{g}</button>
          ))}
        </div>

        {loading ? (
          <div className="loading">Loading films...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            {movies.length === 0 ? (
              <>
                <div className="empty-icon">🎬</div>
                <h3>No movies yet</h3>
                {isAdmin ? <p>Add your first movie using the button above!</p> : <p>Check back soon — movies are being added.</p>}
              </>
            ) : (
              <><div className="empty-icon">🔍</div><h3>No results found</h3></>
            )}
          </div>
        ) : (
          <div className="movies-grid">
            {filtered.map(m => (
              <MovieCard key={m.id} movie={m} user={user} onRate={handleRate} onOpen={setOpenMovie} />
            ))}
          </div>
        )}
      </div>

      {openMovie && (
        <MovieModal
          movie={openMovie}
          user={user}
          onClose={() => setOpenMovie(null)}
          onRate={handleRate}
          onShare={(movie, rating) => { setOpenMovie(null); setShareData({ movie, rating }); }}
        />
      )}

      {shareData && (
        <ShareCard
          movie={shareData.movie}
          userRating={shareData.rating}
          userName={user?.displayName || user?.email}
          onClose={() => setShareData(null)}
        />
      )}

      {showAdmin && isAdmin && (
        <AdminPanel onAdd={handleAddMovie} onClose={() => setShowAdmin(false)} />
      )}
    </div>
  );
}
