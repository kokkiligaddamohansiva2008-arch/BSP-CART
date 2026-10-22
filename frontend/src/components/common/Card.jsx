import "./Card.css";

function Card({
  title,
  subtitle,
  image,
  price,
  children,
}) {
  return (
    <div className="custom-card">

      {image && (
        <img
          src={image}
          alt={title}
          className="card-image"
        />
      )}

      <div className="card-body">

        {title && <h4>{title}</h4>}

        {subtitle && <p>{subtitle}</p>}

        {price && (
          <h3 className="price">
            ${price}
          </h3>
        )}

        {children}

      </div>

    </div>
  );
}

export default Card;