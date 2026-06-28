import { useEffect, useState, useMemo } from "react";
import FlashSaleBanner from "../components/FlashSaleBanner";
import { Link } from "react-router-dom";

const CATEGORIES = ["All", "Electronic", "Accessories", "Audio", "Electric"];
const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Most Popular", value: "popular" },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const recent = JSON.parse(localStorage.getItem("recent")) || [];

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/products`)
      .then(res => { if (!res.ok) throw new Error("Failed to fetch"); return res.json(); })
      .then(data => {
        setProducts(data);
        setTrending([...data].sort((a,b)=>(b.reviews?.length||0)-(a.reviews?.length||0)).slice(0,6));
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    let result = products.filter(p => {
      const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === "All" || p.category?.toLowerCase().trim().includes(category.toLowerCase().trim());
      const matchMin = !minPrice || p.price >= Number(minPrice);
      const matchMax = !maxPrice || p.price <= Number(maxPrice);
      return matchSearch && matchCategory && matchMin && matchMax;
    });
    if (sortBy === "price_asc") result = [...result].sort((a,b) => a.price - b.price);
    else if (sortBy === "price_desc") result = [...result].sort((a,b) => b.price - a.price);
    else if (sortBy === "popular") result = [...result].sort((a,b) => (b.reviews?.length||0) - (a.reviews?.length||0));
    else result = [...result].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    return result;
  }, [products, search, category, sortBy, minPrice, maxPrice]);

  const isFiltering = search || category !== "All" || minPrice || maxPrice || sortBy !== "newest";
  const FALLBACK = "https://placehold.co/300x200?text=No+Image";

  const ProductCard = ({ p }) => (
    <Link to={`/product/${p._id}`} className="tm-card">
      <div style={{ position: "relative" }}>
        <img src={p.images?.[0]||FALLBACK} alt={p.name} onError={e=>e.target.src=FALLBACK} className="tm-card-img" />
        {p.stock === 0 && <span style={{ position: "absolute", top: "8px", left: "8px", background: "#dc2626", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px" }}>Out of Stock</span>}
        {p.stock > 0 && p.stock <= 5 && <span style={{ position: "absolute", top: "8px", left: "8px", background: "#f59e0b", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px" }}>Only {p.stock} left</span>}
      </div>
      <div style={{padding:"10px"}}>
        {p.category && <p style={{ fontSize: "10px", color: "#f97316", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 3px", fontWeight: "600" }}>{p.category}</p>}
        <p style={{fontSize:"13px",fontWeight:"600",margin:"0 0 4px",color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</p>
        <p style={{fontSize:"14px",color:"#f97316",fontWeight:"700",margin:0}}>₦{p.price?.toLocaleString()}</p>
      </div>
    </Link>
  );

  if (loading) return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh"}}><div style={{width:"40px",height:"40px",border:"4px solid #333",borderTop:"4px solid #f97316",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} /><p style={{color:"#888",marginTop:"16px"}}>Loading...</p></div>;
  if (error) return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh"}}><p style={{color:"#f97316"}}>⚠️ {error}</p><button onClick={()=>window.location.reload()} style={{marginTop:"16px",padding:"10px 24px",background:"#f97316",color:"#fff",border:"none",borderRadius:"8px",cursor:"pointer"}}>Retry</button></div>;

  return (
    <>
      <style>{`
        .tm-container{max-width:1200px;margin:0 auto;padding:16px 12px;box-sizing:border-box;width:100%}
        .tm-search{width:100%;padding:12px 20px;border-radius:999px;border:1px solid #333;background:#1a1a1a;color:#fff;font-size:15px;outline:none;box-sizing:border-box}
        .tm-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:28px}
        .tm-card{background:#1a1a1a;border-radius:10px;overflow:hidden;text-decoration:none;color:#fff;border:1px solid #2a2a2a;display:block;transition:border 0.2s}
        .tm-card:hover{border-color:#f97316}
        .tm-card-img{width:100%;height:130px;object-fit:cover;background:#222;display:block}
        .tm-title{font-size:15px;font-weight:700;margin:0 0 10px;color:#fff}
        .tm-cat-btn{padding:6px 14px;border-radius:999px;border:1px solid #333;background:#1a1a1a;color:#888;font-size:12px;cursor:pointer;white-space:nowrap;font-weight:600;transition:all 0.2s}
        .tm-cat-btn.active{background:linear-gradient(135deg,#f97316,#dc2626);color:#fff;border-color:transparent}
        .tm-select{padding:8px 12px;border-radius:8px;border:1px solid #333;background:#1a1a1a;color:#fff;font-size:13px;outline:none;cursor:pointer}
        .tm-price-input{width:100%;padding:8px 12px;border-radius:8px;border:1px solid #333;background:#1a1a1a;color:#fff;font-size:13px;outline:none;box-sizing:border-box}
        @media(min-width:600px){.tm-grid{grid-template-columns:repeat(3,1fr);gap:14px}.tm-card-img{height:160px}.tm-title{font-size:18px}}
        @media(min-width:900px){.tm-grid{grid-template-columns:repeat(4,1fr);gap:18px}.tm-card-img{height:180px}.tm-title{font-size:20px}}
        @media(min-width:1200px){.tm-grid{grid-template-columns:repeat(5,1fr);gap:20px}.tm-card-img{height:200px}}
      `}</style>
      <div className="tm-container">
        <FlashSaleBanner />

        {/* SEARCH BAR */}
        <div style={{ marginBottom: "16px" }}>
          <input type="text" placeholder="🔍 Search products..." value={search} onChange={e=>setSearch(e.target.value)} className="tm-search" />
        </div>

        {/* CATEGORY PILLS */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px", marginBottom: "12px", scrollbarWidth: "none" }}>
          {CATEGORIES.map(cat => (
            <button key={cat} className={`tm-cat-btn${category === cat ? " active" : ""}`} onClick={() => setCategory(cat)}>{cat}</button>
          ))}
        </div>

        {/* FILTER ROW */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="tm-select">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={() => setShowFilters(!showFilters)} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #333", background: showFilters ? "#f97316" : "#1a1a1a", color: "#fff", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}>
            {showFilters ? "Hide Filters" : "Price Filter"}
          </button>
          {isFiltering && (
            <button onClick={() => { setSearch(""); setCategory("All"); setSortBy("newest"); setMinPrice(""); setMaxPrice(""); }} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #dc2626", background: "transparent", color: "#dc2626", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}>
              Clear All
            </button>
          )}
          <span style={{ color: "#888", fontSize: "13px", marginLeft: "auto" }}>{filtered.length} product{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* PRICE FILTER */}
        {showFilters && (
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
            <p style={{ color: "#fff", fontWeight: "700", fontSize: "14px", margin: "0 0 12px" }}>Price Range (₦)</p>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <input type="number" placeholder="Min price" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="tm-price-input" />
              <span style={{ color: "#888" }}>—</span>
              <input type="number" placeholder="Max price" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="tm-price-input" />
            </div>
          </div>
        )}

        {/* RESULTS */}
        {isFiltering ? (
          <section>
            <h2 className="tm-title">
              {search ? `🔍 Results for "${search}"` : category !== "All" ? `📱 ${category}` : "🛍 All Products"}
            </h2>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ fontSize: "40px", margin: "0 0 12px" }}>😕</p>
                <p style={{ color: "#888" }}>No products found. Try different filters.</p>
                <button onClick={() => { setSearch(""); setCategory("All"); setSortBy("newest"); setMinPrice(""); setMaxPrice(""); }} style={{ marginTop: "12px", padding: "10px 24px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>Clear Filters</button>
              </div>
            ) : (
              <div className="tm-grid">{filtered.map(p=><ProductCard key={p._id} p={p}/>)}</div>
            )}
          </section>
        ) : (
          <>
            {trending.length > 0 && (
              <section>
                <h2 className="tm-title">🔥 Trending</h2>
                <div className="tm-grid">{trending.map(p=><ProductCard key={p._id} p={p}/>)}</div>
              </section>
            )}
            <section>
              <h2 className="tm-title">�� All Products</h2>
              <div className="tm-grid">{products.map(p=><ProductCard key={p._id} p={p}/>)}</div>
            </section>
            {recent.length > 0 && (
              <section>
                <h2 className="tm-title">👀 Recently Viewed</h2>
                <div className="tm-grid">{recent.map(p=><ProductCard key={p._id} p={p}/>)}</div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
