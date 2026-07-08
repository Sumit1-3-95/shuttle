// src/components/VideoTab.jsx — v4
// Rectangular 16:9 feed, filter chips, session-based watched ranking,
// one video at a time, larger touch area, no external redirect
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../supabaseClient'

const ALL_TAGS = ['Skills', 'Smash', 'Match Highlights', 'Rally', 'Footwork', 'Defense', 'Pro Tips']

const TAG_COLORS = {
  'Match Highlights': { bg:'rgba(248,113,113,0.12)', color:'#f87171', border:'rgba(248,113,113,0.25)' },
  'Skills':           { bg:'rgba(96,165,250,0.12)',  color:'#60a5fa', border:'rgba(96,165,250,0.25)' },
  'Smash':            { bg:'rgba(251,146,60,0.12)',  color:'#fb923c', border:'rgba(251,146,60,0.25)' },
  'New':              { bg:'rgba(74,222,128,0.12)',  color:'#4ade80', border:'rgba(74,222,128,0.25)' },
  'Rally':            { bg:'rgba(192,132,252,0.12)', color:'#c084fc', border:'rgba(192,132,252,0.25)' },
  'Footwork':         { bg:'rgba(251,191,36,0.12)',  color:'#fbbf24', border:'rgba(251,191,36,0.25)' },
  'Defense':          { bg:'rgba(52,211,153,0.12)',  color:'#34d399', border:'rgba(52,211,153,0.25)' },
  'Pro Tips':         { bg:'rgba(232,121,249,0.12)', color:'#e879f9', border:'rgba(232,121,249,0.25)' },
}
const DEFAULT_TAG = { bg:'rgba(255,255,255,0.06)', color:'#64748b', border:'rgba(255,255,255,0.12)' }

function getYouTubeId(url) {
  const patterns = [
    /youtu\.be\/([^?&\s]+)/,
    /youtube\.com\/shorts\/([^?&\s]+)/,
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
  ]
  for (const p of patterns) {
    const m = url?.match(p)
    if (m) return m[1]
  }
  return null
}

function getThumbnail(url) {
  const id = getYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null
}

function getEmbed(url) {
  const id = getYouTubeId(url)
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1` : null
}

// ── Video Card ─────────────────────────────────────────────────
function VideoCard({ video, watched, isPlaying, onPlay, onPause }) {
  const [thumbErr, setThumbErr] = useState(false)
  const iframeRef = useRef(null)
  const thumb  = getThumbnail(video.youtube_url)
  const embed  = getEmbed(video.youtube_url)

  // When another video starts, pause this one via postMessage
  useEffect(() => {
    if (!isPlaying && iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({ event:'command', func:'pauseVideo' }), '*'
        )
      } catch(e) {}
    }
  }, [isPlaying])

  return (
    <div style={{
      marginBottom: 14,
      borderRadius: 14,
      overflow: 'hidden',
      background: '#080f1a',
      border: watched
        ? '1.5px solid rgba(74,222,128,0.3)'
        : '1px solid rgba(255,255,255,0.07)',
      position: 'relative',
    }}>
      {/* Top glow line — unwatched only */}
      {!watched && (
        <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:1, background:'linear-gradient(90deg,transparent,rgba(74,222,128,0.35),transparent)', zIndex:2 }}/>
      )}

      {/* 16:9 video area */}
      <div style={{ position:'relative', width:'100%', paddingBottom:'56.25%', background:'#000' }}>
        {isPlaying && embed ? (
          <iframe
            ref={iframeRef}
            src={embed}
            title={video.title}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }}
          />
        ) : (
          /* Full-area tap target — no small button */
          <div onClick={onPlay} style={{ position:'absolute', inset:0, cursor:'pointer' }}>
            {/* Thumbnail */}
            {thumb && !thumbErr ? (
              <img src={thumb} alt={video.title}
                style={{ width:'100%', height:'100%', objectFit:'cover' }}
                onError={() => setThumbErr(true)}/>
            ) : (
              <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#0a1628,#1a2a1a)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>🏸</div>
            )}

            {/* Gradient overlay */}
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(8,15,26,0.8) 0%,transparent 50%)' }}/>

            {/* Centered play — larger invisible touch area */}
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{
                width:64, height:64, borderRadius:'50%',
                background:'rgba(255,255,255,0.1)',
                backdropFilter:'blur(8px)',
                border:'1.5px solid rgba(255,255,255,0.2)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <div style={{ width:0, height:0, borderTop:'10px solid transparent', borderBottom:'10px solid transparent', borderLeft:'18px solid rgba(255,255,255,0.9)', marginLeft:4 }}/>
              </div>
            </div>

            {/* Watched badge */}
            {watched && (
              <div style={{ position:'absolute', top:8, right:8, background:'rgba(74,222,128,0.88)', borderRadius:6, padding:'2px 8px', fontSize:9, color:'#052e16', fontWeight:700, fontFamily:"'Rajdhani',sans-serif", letterSpacing:1 }}>
                ✓ WATCHED
              </div>
            )}
          </div>
        )}

        {/* Pause button overlay when playing */}
        {isPlaying && (
          <div onClick={onPause} style={{ position:'absolute', top:8, right:8, zIndex:10, width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', backdropFilter:'blur(4px)' }}>
            <div style={{ display:'flex', gap:3 }}>
              <div style={{ width:3, height:12, background:'rgba(255,255,255,0.8)', borderRadius:1 }}/>
              <div style={{ width:3, height:12, background:'rgba(255,255,255,0.8)', borderRadius:1 }}/>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding:'9px 12px 11px' }}>
        {video.tags?.length > 0 && (
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:6 }}>
            {video.tags.map(t => {
              const s = TAG_COLORS[t] || DEFAULT_TAG
              return <span key={t} style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:s.bg, color:s.color, border:`1px solid ${s.border}`, fontFamily:"'Rajdhani',sans-serif", letterSpacing:0.5 }}>{t}</span>
            })}
          </div>
        )}
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:watched?'#64748b':'#e2e8f0', letterSpacing:1, lineHeight:1.2 }}>
          {video.title}
        </div>
      </div>
    </div>
  )
}

// ── Main VideoTab ──────────────────────────────────────────────
export default function VideoTab({ currentUserId }) {
  const [videos, setVideos]       = useState([])
  const [sessionWatched, setSessionWatched] = useState(new Set()) // watched THIS session
  const [prevWatched, setPrevWatched]       = useState(new Set()) // watched in PAST sessions
  const [activeTag, setActiveTag] = useState(null)
  const [playingId, setPlayingId] = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: vids }, { data: w }] = await Promise.all([
      supabase.from('videos').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('watched_videos').select('video_id').eq('player_id', currentUserId),
    ])
    // Only PREVIOUS sessions count for ranking
    const prevIds = new Set((w||[]).map(r => r.video_id))
    setPrevWatched(prevIds)

    // Sort: prev-watched to bottom, unwatched sorted by newest first
    const sorted = [...(vids||[])].sort((a, b) => {
      const aW = prevIds.has(a.id), bW = prevIds.has(b.id)
      if (aW !== bW) return aW ? 1 : -1
      return new Date(b.created_at) - new Date(a.created_at)
    })
    setVideos(sorted)
    setLoading(false)
  }

  async function handlePlay(videoId) {
    setPlayingId(videoId)
    if (!prevWatched.has(videoId) && !sessionWatched.has(videoId)) {
      // Mark watched for next session — don't reorder now
      setSessionWatched(prev => new Set([...prev, videoId]))
      await supabase.from('watched_videos').upsert({ player_id: currentUserId, video_id: videoId })
    }
  }

  function handlePause() {
    setPlayingId(null)
  }

  // Filter by tag
  const filteredVideos = activeTag
    ? videos.filter(v => v.tags?.includes(activeTag))
    : videos

  const allWatched = new Set([...prevWatched, ...sessionWatched])
  const unwatchedCount = filteredVideos.filter(v => !allWatched.has(v.id)).length

  // Tags that exist in current video list
  const availableTags = ALL_TAGS.filter(t => videos.some(v => v.tags?.includes(t)))

  if (loading) return (
    <div style={{ textAlign:'center', padding:60, color:'#475569', fontFamily:"'Rajdhani',sans-serif" }}>
      <div style={{ fontSize:28, marginBottom:10 }}>🎬</div>
      <div style={{ fontSize:13 }}>Loading...</div>
    </div>
  )

  if (videos.length === 0) return (
    <div style={{ textAlign:'center', padding:60, color:'#334155', fontFamily:"'Rajdhani',sans-serif" }}>
      <div style={{ fontSize:36, marginBottom:10 }}>📺</div>
      <div style={{ fontSize:14 }}>No videos yet</div>
    </div>
  )

  const unwatchedVids = filteredVideos.filter(v => !prevWatched.has(v.id))
  const watchedVids   = filteredVideos.filter(v => prevWatched.has(v.id))

  return (
    <div style={{ fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');`}</style>

      {/* Filter chips */}
      <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:14, paddingBottom:2 }}>
        <button onClick={()=>setActiveTag(null)} style={{
          flexShrink:0, padding:'6px 14px', borderRadius:20, cursor:'pointer',
          border: !activeTag?'1px solid rgba(74,222,128,0.5)':'1px solid rgba(255,255,255,0.1)',
          background: !activeTag?'rgba(74,222,128,0.1)':'rgba(255,255,255,0.03)',
          color: !activeTag?'#4ade80':'#64748b',
          fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700,
        }}>All {!activeTag && unwatchedCount>0 && `· ${unwatchedCount} new`}</button>

        {availableTags.map(t => {
          const s = TAG_COLORS[t] || DEFAULT_TAG
          const isActive = activeTag === t
          return (
            <button key={t} onClick={()=>setActiveTag(isActive ? null : t)} style={{
              flexShrink:0, padding:'6px 14px', borderRadius:20, cursor:'pointer',
              border: isActive?`1px solid ${s.border}`:'1px solid rgba(255,255,255,0.08)',
              background: isActive?s.bg:'rgba(255,255,255,0.03)',
              color: isActive?s.color:'#64748b',
              fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700,
            }}>{t}</button>
          )
        })}
      </div>

      {/* Unwatched videos */}
      {unwatchedVids.map(v => (
        <VideoCard
          key={v.id} video={v}
          watched={sessionWatched.has(v.id)} // dim if watched this session
          isPlaying={playingId === v.id}
          onPlay={() => handlePlay(v.id)}
          onPause={handlePause}
        />
      ))}

      {/* Watched from previous sessions */}
      {watchedVids.length > 0 && (
        <>
          <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 0 14px' }}>
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.05)' }}/>
            <span style={{ fontSize:9, color:'#1e293b', letterSpacing:2, fontWeight:700 }}>WATCHED</span>
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.05)' }}/>
          </div>
          {watchedVids.map(v => (
            <VideoCard
              key={v.id} video={v}
              watched={true}
              isPlaying={playingId === v.id}
              onPlay={() => handlePlay(v.id)}
              onPause={handlePause}
            />
          ))}
        </>
      )}

      {filteredVideos.length === 0 && (
        <div style={{ textAlign:'center', padding:40, color:'#334155', fontSize:13 }}>No videos in this category</div>
      )}
    </div>
  )
}