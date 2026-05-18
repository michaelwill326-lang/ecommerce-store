import { Link } from "react-router-dom";
    );

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        ...product,
        quantity: 1,
      });
    }

    localStorage.setItem(
      "cart",
      JSON.stringify(cart)
    );

    alert("✅ Added To Cart");
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "20px",
        borderRadius: "10px",
      }}
    >

      <img
        src={
          product.images?.[0] ||
          "/600x400.svg"
        }
        alt={product.name}
        style={{
          width: "100%",
          height: "220px",
          objectFit: "cover",
          borderRadius: "10px",
        }}
      />

      <h2>{product.name}</h2>

      <p>₦{product.price}</p>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >

        <button onClick={addToCart}>
          Add To Cart
        </button>

        <Link to={`/product/${product._id}`}>
          <button>
            View Product
          </button>
        </Link>

        <Link to="/cart">
          <button>
            Go To Cart
          </button>
        </Link>

      </div>
    </div>
  );
