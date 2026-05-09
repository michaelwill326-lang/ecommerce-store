import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

export default function Verify() {
  const [params] = useSearchParams();

  const [status, setStatus] = useState("Verifying payment...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reference = params.get("reference");

    if (!reference) {
      setStatus("No payment reference found");
      setLoading(false);
      return;
    }

    fetch(`${API}/api/paystack/verify/${reference}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setStatus("✅ Payment Successful");
        } else {
          setStatus("❌ Payment Failed");
        }

        setLoading(false);
      })
      .catch(() => {
        setStatus("Verification failed");
        setLoading(false);
      });
  }, []);

  return (
    <div className="container">
      <h1>{status}</h1>

      {!loading && (
        <div style={{ marginTop: "20px" }}>
          <Link to="/">
            <button>Continue Shopping</button>
          </Link>

          <Link to="/tracking">
            <button style={{ marginLeft: "10px" }}>
              Track Order
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}