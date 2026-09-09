declare module 'react-player' {
    import { ComponentType } from 'react';

    export interface ReactPlayerProps {
        url?: string | string[] | SourceProps[] | MediaStream;
        playing?: boolean;
        loop?: boolean;
        controls?: boolean;
        volume?: number;
        muted?: boolean;
        playbackRate?: number;
        width?: string | number;
        height?: string | number;
        style?: object;
        progressInterval?: number;
        playsinline?: boolean;
        pip?: boolean;
        light?: boolean | string;
        fallback?: React.ReactNode;
        wrapper?: any;
        config?: object;
        onReady?: (player: any) => void;
        onStart?: () => void;
        onPlay?: () => void;
        onPause?: () => void;
        onBuffer?: () => void;
        onEnded?: () => void;
        onError?: (error: any, data?: any, hlsInstance?: any, hlsGlobal?: any) => void;
    }

    const ReactPlayer: ComponentType<ReactPlayerProps>;
    export default ReactPlayer;
}

declare module 'react-player/lazy' {
    import ReactPlayer from 'react-player';
    export default ReactPlayer;
}

declare module 'react-player/youtube' {
    import ReactPlayer from 'react-player';
    export default ReactPlayer;
}