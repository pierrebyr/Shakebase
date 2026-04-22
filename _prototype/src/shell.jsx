// Sidebar + Topbar shell

const NAV = [
  { id: 'dashboard',   label: 'Overview',     icon: 'home' },
  { id: 'library',     label: 'Cocktails',    icon: 'cup',     badge: '24' },
  { id: 'products',    label: 'Products',     icon: 'beaker',  badge: '5' },
  { id: 'creators',    label: 'Creators',     icon: 'user',    badge: '8' },
  { id: 'ingredients', label: 'Ingredients',  icon: 'leaf' },
  { id: 'submit',      label: 'New Cocktail', icon: 'plus' },
  { id: 'analytics',   label: 'Analytics',    icon: 'analytics' },
];

const Sidebar = ({ route, setRoute, mobileOpen, setMobileOpen }) => {
  const go = (page) => { setRoute({ page }); setMobileOpen && setMobileOpen(false); };
  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar${mobileOpen ? ' is-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark" />
          <div className="brand-name">Casa Dragones</div>
          <div className="brand-env">R&amp;D</div>
        </div>

        <div className="nav-group">
          <div className="nav-label">Library</div>
          {NAV.slice(0, 5).map(n => (
            <button key={n.id} className="nav-item" data-active={route.page === n.id} onClick={() => go(n.id)}>
              <Icon name={n.icon} className="nav-ico" />
              <span>{n.label}</span>
              {n.badge && <span className="nav-badge">{n.badge}</span>}
            </button>
          ))}
        </div>

        <div className="nav-group">
          <div className="nav-label">Workflows</div>
          {NAV.slice(5).map(n => (
            <button key={n.id} className="nav-item" data-active={route.page === n.id} onClick={() => go(n.id)}>
              <Icon name={n.icon} className="nav-ico" />
              <span>{n.label}</span>
            </button>
          ))}
        </div>

        <div className="nav-group">
          <div className="nav-label">Pinned</div>
          <button className="nav-item" onClick={() => { setRoute({ page: 'detail', id: 'k01' }); setMobileOpen && setMobileOpen(false); }}>
            <DrinkOrb from="#ffd9c2" to="#f58a6e" size={16} />
            <span>Clarified Paloma</span>
          </button>
          <button className="nav-item" onClick={() => { setRoute({ page: 'detail', id: 'k24' }); setMobileOpen && setMobileOpen(false); }}>
            <DrinkOrb from="#f6efe2" to="#c9b89a" size={16} />
            <span>Milk Punch №7</span>
          </button>
        </div>

        {/* Mobile-only close button above the user card */}
        <button className="sidebar-close-btn" onClick={() => setMobileOpen(false)}>
          Close menu
        </button>

        <div className="sidebar-foot">
          <Avatar name="Eli Marchant" />
          <div className="side-me">
            <strong>Eli Marchant</strong>
            <small>Brand Marketing</small>
          </div>
        </div>
      </aside>
    </>
  );
};

const Topbar = ({ crumbs, search, setSearch, onBurger, mobileOpen, setRoute }) => (
  <>
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            {i === crumbs.length - 1 ? <strong>{c}</strong> : <span>{c}</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="search">
        <Icon name="search" size={14} />
        <input
          placeholder="Search cocktails, creators, ingredients…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="kbd">⌘K</span>
      </div>
      <div className="top-actions">
        <button className="icon-btn" title="Notifications"><Icon name="bell" size={15} /></button>
        <button className="icon-btn" title="Settings"><Icon name="settings" size={15} /></button>
        <button className="btn-primary" onClick={() => setRoute({ page: 'submit' })}><Icon name="plus" size={14} />New Cocktail</button>
      </div>
    </div>

    {/* Floating menu launcher — mobile only */}
    {!mobileOpen && (
      <button className="menu-fab" onClick={onBurger} aria-label="Open menu">
        <div className="brand-mark" style={{ width: 22, height: 22 }} />
        <span>Menu</span>
      </button>
    )}
  </>
);

Object.assign(window, { Sidebar, Topbar, NAV });
