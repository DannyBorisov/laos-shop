import { useState } from "react";
import "./SpotifyWidget.css";

// Swap this for your own playlist/album/track share URL.
const SPOTIFY_EMBED_URL =
  "https://open.spotify.com/embed/album/2QX7YR9lBSYEtZQoWb6fri?utm_source=generator&theme=0";

export function SpotifyWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`spotify-widget ${open ? "open" : "collapsed"}`}>
      {open ? (
        <div className="spotify-widget-panel">
          <button
            className="spotify-widget-close"
            aria-label="Close music player"
            onClick={() => setOpen(false)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <iframe
            title="Spotify player"
            src={SPOTIFY_EMBED_URL}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      ) : (
        <button
          className="spotify-widget-toggle"
          aria-label="Open music player"
          onClick={() => setOpen(true)}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.59 14.4a.62.62 0 01-.86.21c-2.36-1.44-5.33-1.77-8.84-.97a.625.625 0 11-.28-1.22c3.83-.88 7.13-.5 9.77 1.11.3.19.4.58.21.87zm1.22-2.73a.78.78 0 01-1.07.26c-2.7-1.66-6.82-2.14-10.02-1.17a.78.78 0 11-.45-1.49c3.65-1.11 8.19-.57 11.29 1.34.37.23.48.72.25 1.06zm.11-2.84c-3.24-1.92-8.6-2.1-11.7-1.16a.937.937 0 11-.54-1.79c3.56-1.08 9.48-.87 13.22 1.35a.937.937 0 11-.98 1.6z" />
          </svg>
        </button>
      )}
    </div>
  );
}
