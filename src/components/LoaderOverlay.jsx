import React from 'react'

const LoaderOverlay = ({ text = 'Loading…', fullscreen = true, zIndex = 9999 }) => {
    const common = {
        background: 'rgba(255,255,255,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex
    }
    const style = fullscreen
        ? { position: 'fixed', inset: 0, ...common }
        : { position: 'absolute', inset: 0, ...common }

    return (
        <div style={style}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, border: '4px solid rgba(179,0,0,0.2)', borderTop: '4px solid #b30000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <div style={{ fontWeight: 700, color: '#b30000' }}>{text}</div>
            </div>
            <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>
        </div>
    )
}

export default LoaderOverlay


