import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
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

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));
  const FALLBACK = "https://placehold.co/300x200?text=No+Image";

  const ProductCard = ({ p }) => (
    <Link to={`/product/${p._id}`} className="tm-card">
      <img src={p.images?.[0]||FALLBACK} alt={p.name} onError={e=>e.target.src=FALLBACK} className="tm-card-img" />
      <div style={{padding:"10px"}}>
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
        .tm-search{width:100%;max-width:500px;padding:12px 20px;border-radius:999px;border:1px solid #333;background:#1a1a1a;color:#fff;font-size:15px;outline:none;box-sizing:border-box}
        .tm-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:28px}
        .tm-card{background:#1a1a1a;border-radius:10px;overflow:hidden;text-decoration:none;color:#fff;border:1px solid #2a2a2a;display:block}
        .tm-card-img{width:100%;height:130px;object-fit:cover;background:#222;display:block}
        .tm-title{font-size:15px;font-weight:700;margin:0 0 10px;color:#fff}
        @media(min-width:600px){.tm-grid{grid-template-columns:repeat(3,1fr);gap:14px}.tm-card-img{height:160px}.tm-title{font-size:18px}}
        @media(min-width:900px){.tm-grid{grid-template-columns:repeat(4,1fr);gap:18px}.tm-card-img{height:180px}.tm-title{font-size:20px}}
        @media(min-width:1200px){.tm-grid{grid-template-columns:repeat(5,1fr);gap:20px}.tm-card-img{height:200px}}
      `}</style>
      <div className="tm-container">
        <div style={{marginBottom:"20px",display:"flex",justifyContent:"center"}}>
          <input type="text" placeholder="🔍 Search products..." value={search} onChange={e=>setSearch(e.target.value)} className="tm-search" />
        </div>
        {!search && trending.length > 0 && (
          <section>
            <h2 className="tm-title">🔥 Trending</h2>
            <div className="tm-grid">{trending.map(p=><ProductCard key={p._id} p={p}/>)}</div>
          </section>
        )}
        <section>
          <h2 className="tm-title">{search?`🔍 Results for "${search}"`:"🛍 All Products"}</h2>
          {filtered.length===0?<p style={{color:"#888",textAlign:"center"}}>No products found.</p>:<div className="tm-grid">{filtered.map(p=><ProductCard key={p._id} p={p}/>)}</div>}
        </section>
        {!search && recent.length > 0 && (
          <section>
            <h2 className="tm-title">👀 Recently Viewed</h2>
            <div className="tm-grid">{recent.map(p=><ProductCard key={p._id} p={p}/>)}</div>
          </section>
        )}
      </div>
    </>
  );
}
