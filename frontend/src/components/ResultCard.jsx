export default function ResultCard({ title, children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "15px",
        padding: "20px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        marginBottom: "20px",
      }}
    >
      <h2
        style={{
          marginBottom: "15px",
          color: "#2563eb",
        }}
      >
        {title}
      </h2>

      {children}
    </div>
  );
}