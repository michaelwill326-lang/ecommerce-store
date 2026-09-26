import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";
const FALLBACK = "https://placehold.co/300x200?text=No+Image";

const suggestions = [
  "iPhones under ₦200,000",
  "laptops for students under ₦500k",
  "Samsung phones with good camera",
  "refurbished MacBooks",
  "wireless earphones under ₦50,000",
  "gaming laptops",
  "Tecno phones under ₦100k",
  "used phones in good condition",
];

export default function AISearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [facets, setFacets] = useState(null);
  const [extractedFilters, setExtractedFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sponsored, setSponsored] = useState([]);

  // Active UI filters
  const [activeCategory, setActiveCategory] = useState("");
  const [activeBrand, setActiveBrand] = useState("");
  const [activeCondition, setActiveCondition] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState("grid");

  const navigate = useNavigate();

  const search = async (q) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    setActiveCategory(""); setActiveBrand(""); setActiveCondition("");
    setPriceMin(""); setPriceMax(""); setSortBy("relevance");
    try {
      const [searchRes, sponsoredRes] = await Promise.allSettled([
        axios.post(`${API}/api/ai/search`, { query: searchQuery }),
        axios.get(`${API}/api/sponsored/active`)
      ]);
      if (searchRes.status === "fulfilled") {
        const data = searchRes.value.data;
        setResults(data.results || []);
        setFiltered(data.results || []);
        setFacets(data.facets || null);
        setExtractedFilters(data.filters || {});
      }
      if (sponsoredRes.status === "fulfilled") setSponsored(sponsoredRes.value.data || []);
    } catch { setResults([]); setFiltered([]); }
    finally { setLoading(false); }
  };

  const applyFilters = (cat, brand, cond, pMin, pMax, sort) => {
    let r = [...results];
    if (cat) r = r.filter(p => p.category?.toLowerCase().includes(cat.toLowerCase()));
    if (brand) r = r.filter(p => p.name?.toLowerCase().includes(brand.toLowerCase()) || p.brand?.toLowerCase().includes(brand.toLowerCase()));
    if (cond) r = r.filter(p => (p.condition || "New").toLowerCase() === cond.toLowerCase());
    if (pMin) r = r.filter(p => p.price >= Number(pMin));
    if (pMax) r = r.filter(p => p.price <= Number(pMax));
    if (sort === "price_asc") r.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") r.sort((a, b) => b.price - a.price);
    else if (sort === "newest") r.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setFiltered(r);
  };

  const handleFilter = (type, value) => {
    const cat = type === "cat" ? value : activeCategory;
    const brand = type === "brand" ? value : activeBrand;
    const cond = type === "cond" ? value : activeCondition;
    const pMin = type === "pMin" ? value : priceMin;
    const pMax = type === "pMax" ? value : priceMax;
    const sort = type === "sort" ? value : sortBy;
    if (type === "cat") setActiveCategory(value);
    if (type === "brand") setActiveBrand(value);
    if (type === "cond") setActiveCondition(value);
    if (type === "pMin") setPriceMin(value);
    if (type === "pMax") setPriceMax(value);
    if (type === "sort") setSortBy(value);
    applyFilters(cat, brand, cond, pMin, pMax, sort);
  };

  const clearFilters = () => {
    setActiveCategory(""); setActiveBrand(""); setActiveCondition("");
    setPriceMin(""); setPriceMax(""); setSortBy("relevance");
    setFiltered(results);
  };

  const hasActiveFilters = activeCategory || activeBrand || activeCondition || priceMin || priceMax || sortBy !== "relevance";

  const inp = { padding: "10px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#fff", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", padding: "20px 16px 80px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h1 style={{ color: "var(--text-primary)", fontSize: "24px", fontWeight: "900", margin: "0 0 6px" }}>
            <span style={{ color: "#f97316" }}>AI</span> Product Search
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>Search in plain English — brand, price, condition, anything</p>
        </div>

        {/* Search Bar */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder='e.g. "iPhone under ₦200,000" or "used Samsung S23"'
            style={{ flex: 1, padding: "14px 18px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", color: "var(--text-primary)", fontSize: "15px", outline: "none" }}
          />
          <button onClick={() => search()} disabled={loading} style={{ padding: "14px 24px", background: "linear-gradient(135deg,#f97316,#dc2626)", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "700", fontSize: "15px", flexShrink: 0 }}>
            {loading ? "..." : "Search"}
          </button>
        </div>

        {/* Suggestions */}
        {!searched && (
          <div style={{ marginBottom: "24px" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "10px" }}>Try:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => { setQuery(s); search(s); }} style={{ padding: "8px 14px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "999px", color: "var(--text-secondary)", fontSize: "13px", cursor: "pointer" }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px" }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ background: "var(--bg-card)", borderRadius: "12px", height: "220px", animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        )}

        {/* Results */}
        {searched && !loading && (
          <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>

            {/* Sidebar Filters */}
            {results.length > 0 && facets && (
              <div style={{ width: "220px", flexShrink: 0, background: "var(--bg-card)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "16px", position: "sticky", top: "80px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <span style={{ color: "#fff", fontWeight: "700", fontSize: "14px" }}>🔧 Filters</span>
                  {hasActiveFilters && <button onClick={clearFilters} style={{ background: "none", border: "none", color: "#f97316", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>Clear all</button>}
                </div>

                {/* Sort */}
                <div style={{ marginBottom: "16px" }}>
                  <p style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: "600", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Sort By</p>
                  {[["relevance", "Most Relevant"], ["price_asc", "Price: Low to High"], ["price_desc", "Price: High to Low"], ["newest", "Newest First"]].map(([val, label]) => (
                    <div key={val} onClick={() => handleFilter("sort", val)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", cursor: "pointer" }}>
                      <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: `2px solid ${sortBy === val ? "#f97316" : "#444"}`, background: sortBy === val ? "#f97316" : "transparent", flexShrink: 0 }} />
                      <span style={{ color: sortBy === val ? "#f97316" : "var(--text-muted)", fontSize: "13px" }}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Price Range */}
                <div style={{ marginBottom: "16px" }}>
                  <p style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: "600", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Price (₦)</p>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input placeholder="Min" value={priceMin} onChange={e => handleFilter("pMin", e.target.value)} style={{ ...inp, width: "50%" }} type="number" />
                    <input placeholder="Max" value={priceMax} onChange={e => handleFilter("pMax", e.target.value)} style={{ ...inp, width: "50%" }} type="number" />
                  </div>
                  {facets.priceRange && <p style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px" }}>Range: ₦{facets.priceRange.min?.toLocaleString()} – ₦{facets.priceRange.max?.toLocaleString()}</p>}
                </div>

                {/* Condition */}
                {facets.conditions?.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: "600", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Condition</p>
                    {facets.conditions.map(c => (
                      <div key={c} onClick={() => handleFilter("cond", activeCondition === c ? "" : c)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", cursor: "pointer" }}>
                        <div style={{ width: "14px", height: "14px", borderRadius: "3px", border: `2px solid ${activeCondition === c ? "#f97316" : "#444"}`, background: activeCondition === c ? "#f97316" : "transparent", flexShrink: 0 }} />
                        <span style={{ color: activeCondition === c ? "#f97316" : "var(--text-muted)", fontSize: "13px" }}>{c}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Category */}
                {facets.categories?.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: "600", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Category</p>
                    {facets.categories.map(c => (
                      <div key={c} onClick={() => handleFilter("cat", activeCategory === c ? "" : c)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", cursor: "pointer" }}>
                        <div style={{ width: "14px", height: "14px", borderRadius: "3px", border: `2px solid ${activeCategory === c ? "#f97316" : "#444"}`, background: activeCategory === c ? "#f97316" : "transparent", flexShrink: 0 }} />
                        <span style={{ color: activeCategory === c ? "#f97316" : "var(--text-muted)", fontSize: "13px" }}>{c}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Brand */}
                {facets.brands?.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: "600", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Brand</p>
                    {facets.brands.slice(0, 8).map(b => (
                      <div key={b} onClick={() => handleFilter("brand", activeBrand === b ? "" : b)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", cursor: "pointer" }}>
                        <div style={{ width: "14px", height: "14px", borderRadius: "3px", border: `2px solid ${activeBrand === b ? "#f97316" : "#444"}`, background: activeBrand === b ? "#f97316" : "transparent", flexShrink: 0 }} />
                        <span style={{ color: activeBrand === b ? "#f97316" : "var(--text-muted)", fontSize: "13px" }}>{b}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Main Results */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Results Header */}
              {results.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <p style={{ color: "var(--text-primary)", fontWeight: "700", margin: "0 0 2px", fontSize: "15px" }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0 }}>for "{query}"</p>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {["grid", "list"].map(v => (
                      <button key={v} onClick={() => setViewMode(v)} style={{ padding: "6px 12px", background: viewMode === v ? "#f97316" : "#1a1a1a", border: "none", borderRadius: "8px", color: viewMode === v ? "#fff" : "var(--text-muted)", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                        {v === "grid" ? "⊞ Grid" : "☰ List"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Filter Tags */}
              {hasActiveFilters && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                  {activeCategory && <span style={{ padding: "4px 10px", background: "#1a1a1a", border: "1px solid #f97316", borderRadius: "999px", color: "#f97316", fontSize: "12px" }}>📁 {activeCategory} ✕</span>}
                  {activeBrand && <span style={{ padding: "4px 10px", background: "#1a1a1a", border: "1px solid #f97316", borderRadius: "999px", color: "#f97316", fontSize: "12px" }}>🏷 {activeBrand} ✕</span>}
                  {activeCondition && <span style={{ padding: "4px 10px", background: "#1a1a1a", border: "1px solid #f97316", borderRadius: "999px", color: "#f97316", fontSize: "12px" }}>✨ {activeCondition} ✕</span>}
                  {(priceMin || priceMax) && <span style={{ padding: "4px 10px", background: "#1a1a1a", border: "1px solid #f97316", borderRadius: "999px", color: "#f97316", fontSize: "12px" }}>💰 ₦{priceMin||"0"} – ₦{priceMax||"∞"} ✕</span>}
                </div>
              )}

              {/* Sponsored */}
              {sponsored.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <p style={{ color: "#f97316", fontWeight: "700", fontSize: "11px", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "1px" }}>📢 Sponsored</p>
                  <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
                    {sponsored.map((p, i) => (
                      <div key={i} onClick={() => navigate(`/product/${p._id}`)} style={{ background: "var(--bg-card)", border: "1px solid #f97316", borderRadius: "12px", overflow: "hidden", cursor: "pointer", flexShrink: 0, width: "140px" }}>
                        <img src={p.images?.[0] || FALLBACK} alt={p.name} style={{ width: "100%", height: "110px", objectFit: "cover" }} onError={e => e.target.src = FALLBACK} />
                        <div style={{ padding: "8px" }}>
                          <p style={{ color: "var(--text-primary)", fontSize: "11px", fontWeight: "600", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                          <p style={{ color: "#f97316", fontSize: "12px", fontWeight: "700", margin: 0 }}>₦{(p.price || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--bg-card)", borderRadius: "12px" }}>
                  <p style={{ fontSize: "48px", margin: "0 0 12px" }}>🤔</p>
                  <p style={{ color: "var(--text-primary)", fontWeight: "700", marginBottom: "8px" }}>No products found</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "16px" }}>Try adjusting your filters or search with different keywords</p>
                  {hasActiveFilters && <button onClick={clearFilters} style={{ padding: "10px 20px", background: "#f97316", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>Clear Filters</button>}
                </div>
              )}

              {/* Grid View */}
              {filtered.length > 0 && viewMode === "grid" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px" }}>
                  {filtered.map(p => (
                    <div key={p._id} onClick={() => navigate(`/product/${p._id}`)} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden", cursor: "pointer", transition: "border-color 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "#f97316"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color)"}>
                      <div style={{ position: "relative" }}>
                        <img src={p.images?.[0] || FALLBACK} alt={p.name} style={{ width: "100%", height: "150px", objectFit: "cover" }} onError={e => e.target.src = FALLBACK} />
                        {p.condition && p.condition !== "New" && (
                          <span style={{ position: "absolute", top: "6px", left: "6px", background: p.condition === "Used" ? "#1a3a6a" : "#1a2a0a", color: p.condition === "Used" ? "#60a5fa" : "#86efac", fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px" }}>{p.condition}</span>
                        )}
                      </div>
                      <div style={{ padding: "10px" }}>
                        <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{p.category}</p>
                        <p style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: "600", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                        <p style={{ color: "#f97316", fontWeight: "800", fontSize: "15px", margin: "0 0 4px" }}>₦{p.price?.toLocaleString()}</p>
                        {p.stock <= 5 && <p style={{ color: "#ef4444", fontSize: "11px", margin: 0 }}>Only {p.stock} left</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* List View */}
              {filtered.length > 0 && viewMode === "list" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {filtered.map(p => (
                    <div key={p._id} onClick={() => navigate(`/product/${p._id}`)} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden", cursor: "pointer", display: "flex", gap: "16px", padding: "12px" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "#f97316"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color)"}>
                      <img src={p.images?.[0] || FALLBACK} alt={p.name} style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }} onError={e => e.target.src = FALLBACK} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "0 0 2px", textTransform: "uppercase" }}>{p.category}</p>
                        <p style={{ color: "var(--text-primary)", fontWeight: "700", fontSize: "15px", margin: "0 0 4px" }}>{p.name}</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "0 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.description}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                          <p style={{ color: "#f97316", fontWeight: "800", fontSize: "18px", margin: 0 }}>₦{p.price?.toLocaleString()}</p>
                          {p.condition && <span style={{ padding: "2px 8px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "6px", color: "var(--text-muted)", fontSize: "12px" }}>{p.condition}</span>}
                          {p.stock <= 5 && <span style={{ color: "#ef4444", fontSize: "12px" }}>Only {p.stock} left</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
