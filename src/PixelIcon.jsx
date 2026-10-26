import React from 'react';

// Original ClubPulse artwork on a 24-unit grid. No third-party icon assets used.
const shapes={
 chart:'M3 3h2v16h16v2H3zM8 11h3v6H8zM13 7h3v10h-3zM18 3h3v14h-3z',
 message:'M3 3h18v14H9v2H7v2H3V3zm2 2v12h2v-2h12V5H5zm3 3h8v2H8zm0 4h6v2H8z',
 calendar:'M6 2h2v3h8V2h2v3h3v16H3V5h3V2zm-1 9v8h14v-8H5zm2 2h3v3H7zm6 0h3v3h-3z',
 shield:'M10 2h4v2h6v10h-2v4h-2v2h-2v2h-4v-2H8v-2H6v-4H4V4h6V2zm0 4H6v8h2v3h2v2h4v-2h2v-3h2V6h-4V4h-4v2z',
 arrow:'M13 3h2v3h3v3h3v6h-3v3h-3v3h-2v-4h3v-3H3v-4h13V7h-3z',
 download:'M10 2h4v10h4v2h-2v2h-2v2h-4v-2H8v-2H6v-2h4zM3 18h3v3h12v-3h3v6H3z',
 plus:'M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z',
 chevron:'M8 3h3v3h3v3h3v6h-3v3h-3v3H8v-4h3v-3h3v-4h-3V7H8z',
 logout:'M3 3h8v3H6v12h5v3H3zM15 6h3v3h3v6h-3v3h-3v-4H9v-4h6z',
 search:'M5 2h10v2h3v11h-3v3H5v-3H2V5h3V2zm1 3v2H5v6h2v2h6v-2h2V7h-2V5H6zm11 11h3v3h3v3h-4v-3h-2z',
 close:'M3 3h4v3h3v3h4V6h3V3h4v4h-3v3h-3v4h3v3h3v4h-4v-3h-3v-3h-4v3H7v3H3v-4h3v-3h3v-4H6V7H3z',
 check:'M18 4h4v4h-3v3h-3v3h-3v3h-3v3H7v-3H4v-3H1v-4h4v3h3v3h2v-3h3v-3h3V7h2z',
 link:'M13 2h7v2h2v7h-2v2h-6v-3h4V6h-4v4h-4V4h3V2zM2 13h2v-3h6v4H6v4h4v-4h4v6h-3v2H4v-2H2z',
 lock:'M8 2h8v2h2v6h3v12H3V10h3V4h2V2zm1 3v5h6V5H9zm1 9v4h4v-4z',
 star:'M10 2h4v5h3v2h5v4h-3v3h-2v6h-4v-3h-2v3H7v-6H5v-3H2V9h5V7h3z'
};
export default function PixelIcon({name,size=20,...props}){return <svg className="pixel-icon" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" shapeRendering="crispEdges" aria-hidden="true" {...props}><path fillRule="evenodd" d={shapes[name]||shapes.chart}/></svg>}
