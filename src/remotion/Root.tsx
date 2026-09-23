import React from 'react';
import { Composition } from 'remotion';
import { CircadianFocusReel } from './compositions/CircadianFocusReel';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CircadianFocusReel"
        component={CircadianFocusReel}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'Solis — The Archival Circadian Monograph'
        }}
      />
    </>
  );
};
