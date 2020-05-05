import React, {useState, useEffect, useRef, useContext} from 'react';
import PropTypes from 'prop-types';
import {MetomicContext} from '../MetomicProvider';
import {noop} from '../utils';

export const MTM_TAG_TYPE = 'text/x-metomic';

const formatParams = params =>
  params &&
  Object.keys(params).reduce(
    (paramsStr, key) =>
      `${paramsStr}
       ${key}=${params[key]}`,
    ''
  );

// Prevent the browser from fetching the resource even before the node is attached.
// Note that we don't need to undo this on unblocking since this is the
// clone, so the original element will have the proper src attribute
function blockDescendentSubresource(element) {
  if (!element) return element;
  const {props} = element;
  return React.cloneElement(element, {
    'data-blocked-src': props.src,
    'data-blocked-srcset': props.srcSet,
    src: undefined,
    srcSet: undefined,
    children: React.Children.map(props.children, blockDescendentSubresource),
  });
}

const ConsentGate = ({
  micropolicy,
  placeholder,
  placeholderParams,
  children,
  ...rest
}) => {
  const [hasConsent, setConsentState] = useState(null);
  const {isReady: isMetomicReady, autoblockingRules, debug = noop} = useContext(
    MetomicContext
  );
  const scriptRef = useRef();

  if (autoblockingRules[micropolicy])
    debug(
      `An autoblocking rule for the "${micropolicy}" micropolicy exists. Make sure to use either autoblocking or manual blocking but not both.`
    );

  useEffect(() => {
    if (!isMetomicReady) return;
    /* eslint-disable no-unused-expressions */
    window.Metomic?.('getConsentState', {slug: micropolicy}, ({enabled}) =>
      setConsentState(enabled)
    );
    window.Metomic?.('ConsentManager:onConsentStateChange', ({slug, state}) => {
      if (state === 'CONSENTED' && slug === micropolicy) setConsentState(true);
    });
    /* eslint-enable no-unused-expressions */
  }, [isMetomicReady, micropolicy]);

  if (hasConsent === null) return false;

  return (
    <>
      {/**
       * React looks forward for a sibling host node to anchor the vDOM so that
       * it knows where to insert a rendered DOM node. Because placeholders
       * replace the rendered mtmTags, if two ConsentGates with placeholders are
       * rendered side by side, unblocking the first ConsentGate will throw an error.
       * This is because the reference sibling for the first ConsentGate
       * is the rendered mtmTag of the 2nd ConsentGate, which, since it has
       * been placeheld, is no longer in the DOM. For this reason, we render a
       * an empty text node before and after the mtmTag so that React always has reference to a proper DOM
       * node as the reference sibling.
       */}
      {''}
      {React.Children.only(children) && hasConsent ? (
        children
      ) : (
        <script
          ref={el => {
            if (el) {
              debug(`Blocking node for ${micropolicy}`);
              // We need to mark this script tag as coming from react so that the
              // SDK knows to keep a reference to the rendered DOM node, since
              // activating a placeholder will replace the <script> tag with the
              // placeholder <iframe>. When the micropolicy has been unblocked, the
              // sdk then restores the <script> DOM node back in place into the
              // DOM tree such that React knows where to render the now unblocked
              // `children` elements.
              /* eslint-disable-next-line fp/no-mutation,no-param-reassign */
              el.fromReact = true;
              scriptRef.current = el;
            } else {
              debug(`Unblocking node for ${micropolicy}`);
              scriptRef.current = null;
            }
          }}
          type={MTM_TAG_TYPE}
          data-placeholder={placeholder}
          data-micropolicy={micropolicy}
          data-placeholder-params={formatParams(placeholderParams)}
          width={children.props.width}
          height={children.props.height}
          {...rest}>
          {/*
              Native DOM elements give us 2 guarantees:
                1. Rendering them is free of DOM side effects -- they don't
                  add additional DOM nodes outside of their descendants / `children`
                2. They have outerHTML
              This allows us send the string representation of these DOM nodes as the
              `text` property of the `<script>`, and thus the `payload.text` parameter
              to the placeholder during its activation lifecycle.

              For non-native React component, this value will simply be undefined, but
              99% of use cases should use the `placeholderParams` prop anyway.
              Placeholders can then access these values via `payload.params`.
            */}
          {typeof children?.type === 'string' &&
            blockDescendentSubresource(children)}
        </script>
      )}
      {''}
    </>
  );
};

ConsentGate.propTypes = {
  micropolicy: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  placeholderParams: PropTypes.object,
  children: PropTypes.node.isRequired,
};

ConsentGate.defaultProps = {
  placeholder: undefined,
  placeholderParams: undefined,
};

export default ConsentGate;
