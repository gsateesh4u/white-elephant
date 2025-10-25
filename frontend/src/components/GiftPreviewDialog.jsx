import { useEffect, useMemo, useState } from 'react';

export function GiftPreviewDialog({ gift, owner, onClose }) {
  if (!gift) {
    return null;
  }

  const titleId = `gift-preview-${gift.id}`;

  const images = useMemo(() => {
    if (Array.isArray(gift.imageUrls) && gift.imageUrls.length > 0) {
      return gift.imageUrls;
    }
    if (gift.imageUrl) {
      return [gift.imageUrl];
    }
    return [];
  }, [gift]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [gift?.id]);

  const totalImages = images.length;
  const hasCarousel = totalImages > 1;
  const currentImage = totalImages > 0 ? images[activeIndex] : null;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  const goPrevious = (event) => {
    event.stopPropagation();
    if (!hasCarousel) {
      return;
    }
    setActiveIndex((index) => (index - 1 + totalImages) % totalImages);
  };

  const goNext = (event) => {
    event.stopPropagation();
    if (!hasCarousel) {
      return;
    }
    setActiveIndex((index) => (index + 1) % totalImages);
  };

  const handleThumbnailClick = (event, index) => {
    event.stopPropagation();
    setActiveIndex(index);
  };

  return (
    <div
      className="gift-preview-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleBackdropClick}
    >
      <div className="gift-preview-dialog">
        <button
          type="button"
          className="gift-preview-close"
          onClick={onClose}
          aria-label="Close gift preview"
        >
          <span aria-hidden="true">&times;</span>
        </button>

        <div className="gift-preview-body">
          <div className="gift-preview-media">
            <div className="gift-preview-gallery">
              {hasCarousel && (
                <button
                  type="button"
                  className="gift-preview-nav prev"
                  onClick={goPrevious}
                  aria-label="View previous image"
                >
                  &#10094;
                </button>
              )}
              <div className="gift-preview-frame">
                {currentImage ? (
                  <img src={currentImage} alt={gift.name} />
                ) : (
                  <div className="gift-preview-placeholder">No image available</div>
                )}
              </div>
              {hasCarousel && (
                <button
                  type="button"
                  className="gift-preview-nav next"
                  onClick={goNext}
                  aria-label="View next image"
                >
                  &#10095;
                </button>
              )}
            </div>

            {hasCarousel && (
              <div className="gift-preview-thumbs" role="tablist" aria-label="Gift images">
                {images.map((url, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={`${gift.id}-thumb-${index}`}
                      type="button"
                      className={`gift-preview-thumb${isActive ? ' active' : ''}`}
                      onClick={(event) => handleThumbnailClick(event, index)}
                      aria-label={`View image ${index + 1} of ${totalImages}`}
                      aria-selected={isActive}
                      role="tab"
                    >
                      <img src={url} alt={`${gift.name} alternate view ${index + 1}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="gift-preview-details">
            <h2 id={titleId}>{gift.name}</h2>
            <p className="gift-preview-description">{gift.description}</p>
            <dl className="gift-preview-meta">
              {owner && (
                <>
                  <dt>Currently with</dt>
                  <dd>{owner.name}</dd>
                </>
              )}
              <dt>Gift ID</dt>
              <dd>{gift.id}</dd>
              <dt>Country</dt>
              <dd>{gift.country}</dd>
              {gift.timesStolen > 0 && (
                <>
                  <dt>Times stolen</dt>
                  <dd>{gift.timesStolen}</dd>
                </>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

