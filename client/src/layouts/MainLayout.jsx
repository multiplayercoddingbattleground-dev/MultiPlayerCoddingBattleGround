import Navbar from "../components/Navbar";

function MainLayout({ children }) {
  return (
    <div className="app">
      <Navbar />

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default MainLayout;