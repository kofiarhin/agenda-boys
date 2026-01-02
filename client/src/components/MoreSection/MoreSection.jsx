// client/src/components/MoreSection.jsx
import "./more-section.styles.scss";

const toId = (raw) => {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (raw.$oid) return raw.$oid;
  return String(raw);
};

const toDate = (raw) => {
  if (!raw) return null;
  if (typeof raw === "string" || typeof raw === "number") return new Date(raw);
  if (raw.$date) return new Date(raw.$date);
  return null;
};

const timeAgo = (date) => {
  if (!date || Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (sec < 60) return `${sec}s ago`;
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  return `${day}d ago`;
};

const normalize = (item) => {
  const id = toId(item?._id);
  const date = toDate(item?.timestamp);
  return {
    id,
    source: item?.source || "",
    url: item?.url || "#",
    title: item?.title || "",
    image: item?.image || "",
    time: timeAgo(date),
  };
};

const MoreSection = ({ heading = "More", items = [], limit = 6 }) => {
  const list = Array.isArray(items)
    ? items.map(normalize).filter((x) => x.title && x.url)
    : [];

  return (
    <section className="more-section">
      <div className="more-section-top">
        <h3 className="more-section-heading">{heading}</h3>
      </div>

      <div className="more-section-list" role="list">
        {list.length === 0 ? (
          <div className="more-section-empty">No items.</div>
        ) : (
          list.slice(0, limit).map((item) => (
            <a
              key={item.id || item.url}
              className="more-section-row"
              href={item.url}
              target="_blank"
              rel="noreferrer"
              role="listitem"
              aria-label={item.title}
            >
              <div className="more-section-row-inner">
                <div className="more-section-text">
                  <div className="more-section-title">{item.title}</div>
                  <div className="more-section-meta">
                    {item.source ? (
                      <span className="more-section-source">{item.source}</span>
                    ) : null}
                    {item.time ? (
                      <>
                        <span className="more-section-dot">•</span>
                        <span className="more-section-time">{item.time}</span>
                      </>
                    ) : null}
                  </div>
                </div>

                {item.image ? (
                  <img
                    className="more-section-thumb"
                    src={item.image}
                    alt=""
                    loading="lazy"
                  />
                ) : null}
              </div>
            </a>
          ))
        )}
      </div>
    </section>
  );
};

export default MoreSection;
