import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export function useGalleryImages() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchImages = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/gallery.php?action=list`);
        if (!cancelled) {
          if (response.data?.success) {
            setImages(response.data.images || []);
          } else {
            setError(response.data?.error || 'Failed to load gallery images');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || err.message || 'Failed to load gallery images');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchImages();

    return () => {
      cancelled = true;
    };
  }, []);

  return { images, loading, error };
}
