// "── 01 · why ───────────────────────────" section opener.
export default function Section({ id, label, title, lede, children, className = "" }) {
  return (
    <section className={`section ${className}`} id={id}>
      <div className="wrap">
        <div className="rule" aria-hidden="true">
          <span className="label">{`── ${label}`}</span>
          <span className="fill">{"─".repeat(240)}</span>
        </div>
        {title ? <h2>{title}</h2> : null}
        {lede ? <p className="section-lede">{lede}</p> : null}
        {children ? <div className={title || lede ? "mt-3" : ""}>{children}</div> : null}
      </div>
    </section>
  );
}
