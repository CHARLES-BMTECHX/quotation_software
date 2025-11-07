import { Link } from "react-router-dom";

export default function Layout({ children }) {
  return (
    <div>
      <nav style={{ background: "#eee", padding: "10px" }}>
        <Link to="/">Home</Link> |{" "}
        <Link to="/create">Create</Link> |{" "}
        <Link to="/register">Register</Link> |{" "}
        <Link to="/login">Login</Link> |{" "}
        <Link to="/users">Users</Link>
      </nav>
      <main style={{ padding: "20px" }}>{children}</main>
    </div>
  );
}
