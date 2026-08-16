import { useEffect, useState, useMemo, useRef, useCallback, useDeferredValue } from "react";
import { Link } from "react-router-dom";
import FlashSaleBanner from "../components/FlashSaleBanner";
import ProductCard from "../components/ProductCard";
import { ProductGridSkeleton } from "../components/Skeleton";

const CATEGORIES = ["All", "Phones", "Laptops", "Electronics", "Audio", "Accessories", "Gaming", "Computers", "Wearables", "Printers"];
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [recent] = useState(() => { try { return JSON.parse(localStorage.getItem("recent")) || []; } catch { return []; } });
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const observerRef = useRef(null);
  
  const loaderRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);


  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch.length >= 2) {
      params.set("search", debouncedSearch);
    }
    if (category !== "All") params.set("category", category);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    fetch(`${import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com"}/api/products?${params.toString()}`)
      .then(res => { if (!res.ok) throw new Error("Failed to fetch"); return res.json(); })
      .then(data => {
        const productList = Array.isArray(data)
          ? data
          : Array.isArray(data.products)
            ? data.products
            : [];

        setProducts(productList);

        setTrending(
          [...productList]
            .sort((a,b)=>(b.reviews?.length||0)-(a.reviews?.length||0))
            .slice(0,6)
        );

        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [debouncedSearch, category, minPrice, maxPrice]);

  const filtered = useMemo(() => {
    let result = [...products];
    if (sortBy === "price_asc") result.sort((a,b) => a.price - b.price);
    else if (sortBy === "price_desc") result.sort((a,b) => b.price - a.price);
    else if (sortBy === "popular") result.sort((a,b) => (b.reviews?.length||0) - (a.reviews?.length||0));
    else result.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    return result;
  }, [products, sortBy]);

  const isFiltering = search || category !== "All" || minPrice || maxPrice || sortBy !== "newest";
  const paginatedProducts = useMemo(() => filtered.slice(0, page * ITEMS_PER_PAGE), [filtered, page]);
  const hasMore = paginatedProducts.length < filtered.length;

  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [hasMore]);

  useEffect(() => {
    const option = { root: null, rootMargin: "20px", threshold: 0 };
    observerRef.current = new IntersectionObserver(handleObserver, option);
    if (loaderRef.current) observerRef.current.observe(loaderRef.current);
    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, [handleObserver]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, category, sortBy, minPrice, maxPrice]);
  const FALLBACK = "https://placehold.co/300x200?text=No+Image";


  if (loading) return <div className="tm-container"><ProductGridSkeleton count={8} /></div>;
  if (error) return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh"}}><p style={{color:"#f97316"}}>⚠️ {error}</p><button onClick={()=>window.location.reload()} style={{marginTop:"16px",padding:"10px 24px",background:"#f97316",color:"var(--text-primary)",border:"none",borderRadius:"8px",cursor:"pointer"}}>Retry</button></div>;

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
        <div style={{ marginBottom: "16px", display: "flex", gap: "8px" }}>
          <input type="text" placeholder="🔍 Search products..." value={search} onChange={e=>setSearch(e.target.value)} className="tm-search" style={{ flex: 1 }} />
          <Link to="/ai-search" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "12px 16px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", borderRadius: "999px", textDecoration: "none", fontWeight: "700", fontSize: "13px", whiteSpace: "nowrap", flexShrink: 0 }}>
            🤖 AI Search
          </Link>
        </div>

        {/* CATEGORY PILLS */}
        <div className="hide-scrollbar" style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px", marginBottom: "12px" }}>
          {CATEGORIES.map(cat => (
            <button key={cat} className={`tm-cat-btn${category === cat ? " active" : ""}`} onClick={() => setCategory(cat)}>{cat}</button>
          ))}
        </div>

        {/* FILTER ROW */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="tm-select">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={() => setShowFilters(!showFilters)} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", background: showFilters ? "#f97316" : "#1a1a1a", color: "var(--text-primary)", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}>
            {showFilters ? "Hide Filters" : "Price Filter"}
          </button>
          {isFiltering && (
            <button onClick={() => { setSearch(""); setCategory("All"); setSortBy("newest"); setMinPrice(""); setMaxPrice(""); }} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #dc2626", background: "transparent", color: "#dc2626", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}>
              Clear All
            </button>
          )}
          <span style={{ color: "var(--text-muted)", fontSize: "13px", marginLeft: "auto" }}>{filtered.length} product{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* PRICE FILTER */}
        {showFilters && (
          <div style={{ background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
            <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "14px", margin: "0 0 12px" }}>Price Range (₦)</p>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <input type="number" placeholder="Min price" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="tm-price-input" />
              <span style={{ color: "var(--text-muted)" }}>—</span>
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
                <p style={{ color: "var(--text-muted)" }}>No products found. Try different filters.</p>
                <button onClick={() => { setSearch(""); setCategory("All"); setSortBy("newest"); setMinPrice(""); setMaxPrice(""); }} style={{ marginTop: "12px", padding: "10px 24px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>Clear Filters</button>
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
              <div className="tm-grid">{paginatedProducts.map(p=><ProductCard key={p._id} p={p}/>)}</div>
              <div ref={loaderRef} style={{ padding: "20px", textAlign: "center" }}>
                {hasMore && <div style={{ width: "30px", height: "30px", border: "3px solid #333", borderTop: "3px solid #f97316", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />}
                {!hasMore && filtered.length > ITEMS_PER_PAGE && <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>All {filtered.length} products loaded</p>}
              </div>
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
