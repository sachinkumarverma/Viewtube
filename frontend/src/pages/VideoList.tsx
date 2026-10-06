import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { useTranslation } from '../i18n';
import VideoSkeleton from '../components/VideoSkeleton';
import VideoCard from '../components/VideoCard';
import { useDocumentTitle } from '../utils/useDocumentTitle';

export default function VideoList({ endpoint, title }: { endpoint: string, title: string }) {
    useDocumentTitle(title);
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { t, language } = useTranslation();

    useEffect(() => {
        const fetchVideos = async () => {
            const cached = sessionStorage.getItem(`videolist_${endpoint}`);
            if (cached) {
                setVideos(JSON.parse(cached));
                setLoading(false);
            } else {
                setLoading(true);
            }
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_BASE_URL}/${endpoint}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                const data = res.data;
                if (title === 'History' || title === 'Liked Videos') {
                    // Force latest-to-oldest sorting
                    data.sort((a: any, b: any) => new Date(b.viewed_at || b.created_at).getTime() - new Date(a.viewed_at || a.created_at).getTime());
                }
                setVideos(data);
                sessionStorage.setItem(`videolist_${endpoint}`, JSON.stringify(data));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchVideos();
    }, [endpoint]);

    const groupVideosByDate = (videoList: any[]) => {
        const groups: { [key: string]: any[] } = {};
        videoList.forEach(video => {
            const viewedAt = video.viewed_at || video.created_at;
            const locale = language === 'hi' ? 'hi-IN' : 'en-US';
            const date = new Date(viewedAt).toLocaleDateString(locale, {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            const today = new Date().toLocaleDateString(locale, {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            const displayDate = date === today ? t('today') : date;

            if (!groups[displayDate]) groups[displayDate] = [];
            groups[displayDate].push(video);
        });
        return groups;
    };

    const groupedVideos = (title === 'History' || title === 'Liked Videos') ? groupVideosByDate(videos) : null;

    // Translate the title key if possible
    const translatedTitle = t(title.toLowerCase().replace(' ', '') as any) || title;

    return (
        <div style={{ padding: '0 0 24px 0', color: 'var(--text-primary)', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <h1 style={{ marginBottom: '14px', fontSize: '20px', fontWeight: '700' }}>{translatedTitle}</h1>
            {loading ? (
                <div className="video-grid">
                    {Array.from({ length: 8 }).map((_, i) => <VideoSkeleton key={i} />)}
                </div>
            ) : videos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 24px', color: 'var(--text-secondary)' }}>
                    <p style={{ fontSize: '20px', marginBottom: '8px' }}>{t('noVideos')}</p>
                </div>
            ) : groupedVideos ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {Object.entries(groupedVideos).map(([date, items]) => (
                        <div key={date}>
                            <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>{date}</h2>
                            <div className="video-grid">
                                {items.map(video => (
                                    <VideoCard key={video.id} video={video} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="video-grid">
                    {videos.map(video => (
                        <VideoCard key={video.id} video={video} />
                    ))}
                </div>
            )}
        </div>
    );
}
