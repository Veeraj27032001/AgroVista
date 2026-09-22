export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="row">
          <div className="col-lg-4 col-12 mb-5 mb-lg-0">
            <a className="navbar-brand d-flex align-items-center mb-3" href="/">
              <span className="navbar-brand-mark">
                <i className="bi bi-flower1"></i>
              </span>
              <span className="navbar-brand-text">
                AgroVista<small>Monthly Magazine</small>
              </span>
            </a>
            <p>Independent monthly reporting on agriculture technology, markets, sustainability and people.</p>
          </div>
          <div className="col-lg-2 col-6">
            <h5 className="mb-4">Explore</h5>
            <p>
              <a href="/#about">About</a>
            </p>
            <p>
              <a href="/#categories">Categories</a>
            </p>
            <p>
              <a href="/archive">Archive</a>
            </p>
            <p className="mb-0">
              <a href="/#contact">Contact</a>
            </p>
          </div>
          <div className="col-lg-2 col-6">
            <h5 className="mb-4">Categories</h5>
            <p>
              <a href="/archive?q=Technology">Technology</a>
            </p>
            <p>
              <a href="/archive?q=Markets">Markets</a>
            </p>
            <p>
              <a href="/archive?q=Sustainability">Sustainability</a>
            </p>
            <p className="mb-0">
              <a href="/archive?q=Policy">Policy</a>
            </p>
          </div>
          <div className="col-lg-3 col-12 ms-lg-auto">
            <h5 className="mb-4">Your Account</h5>
            <p>Sign in with your email to view purchased issues on any device.</p>
            <a href="/login" className="btn custom-btn custom-btn-sm">
              Sign In
            </a>
          </div>
        </div>
        <div className="footer-bottom d-flex flex-wrap justify-content-between">
          <p className="mb-0">Copyright © 2026 AgroVista Monthly. All rights reserved.</p>
          <p className="mb-0">Built for the global agriculture community.</p>
        </div>
      </div>
    </footer>
  );
}
