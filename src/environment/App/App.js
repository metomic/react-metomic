import React from 'react';
import Intercom from 'react-intercom';
import {MetomicProvider, ConsentGate} from 'lib';

const App = opts => (
  <MetomicProvider {...opts}>
    {/** <iframe> */}
    <ConsentGate
      placeholder="@metomic/youtube"
      micropolicy="media"
      width={680}
      height={315}>
      <iframe
        title="test-iframe"
        src="https://www.youtube.com/embed/AgpWX18dby4?autoplay=1"
        width={680}
        height={315}
        frameBorder={0}
      />
    </ConsentGate>

    {/** <img> */}
    <ConsentGate
      micropolicy="marketing"
      placeholder="@metomic/generic"
      placeholderParams={{
        title: 'image',
      }}>
      <img
        alt="My face"
        src="https://avatars1.githubusercontent.com/u/2020382?s=60&v=4"
        srcSet="https://avatars1.githubusercontent.com/u/2020382?s=100&v=4 1x, https://avatars1.githubusercontent.com/u/2020382?s=200&v=4 2x"
      />
    </ConsentGate>

    {/** <picture> with <source>s */}
    <ConsentGate
      micropolicy="marketing"
      placeholder="@metomic/generic"
      placeholderParams={{
        title: 'picture',
      }}>
      <picture>
        <source
          media="(max-width: 799px)"
          srcSet="https://avatars1.githubusercontent.com/u/2020382?s=100&v=4"
        />
        <source
          media="(min-width: 800px)"
          srcSet="https://avatars1.githubusercontent.com/u/2020382?s=200&v=4"
        />
        <img
          src="https://avatars1.githubusercontent.com/u/2020382?s=60&v=4"
          alt="My responsive face"
        />
      </picture>
    </ConsentGate>

    {/** React component */}
    <ConsentGate
      placeholder="@metomic/intercom"
      micropolicy="chat"
      placeholderParams={{
        color: 'green',
      }}>
      <Intercom appID="zwwnvxnx" />
    </ConsentGate>
  </MetomicProvider>
);

export default App;
